import { CookieManager, Cookie } from './Cookie'
import {
    Auth2, AuthConfig, CookieConfig, ILoginOptions, ILoginCreateOptions,
    LinkOptions, UnlinkOptions, ITokenInfo, LoginPick, CreateTokenInput, NewTokenInfo,
    UserSearchInput, PutMeInput, RootInfo
} from './Auth2'
import {
    AuthError
} from './Auth2Error'
import { Html } from './Html'
import { Utils } from './Utils'
import * as Promise from 'bluebird';

enum CacheState {
    New = 1, // newly created cache, no token info yet.    
    Ok, // session token exists and is synced
    Stale, // session token exists, but cache lifetime has expired
    Syncing, // session token exists, syncing in progress
    Error,   // session token exists, error syncing
    Interrupted, // session token exists, not able to sync
    None // no session token exists
}

interface SessionCache {
    session: Session | null,
    fetchedAt: number,
    state: CacheState,
    interruptedAt?: number,
    lastCheckedAt?: number
}

interface Session {
    token: string,
    tokenInfo: ITokenInfo,
}

export class Auth2Session {

    cookieName: string;

    extraCookies: Array<CookieConfig>;

    baseUrl: string;

    sessionCache: SessionCache;
    session: Session;
    auth2Client: Auth2;

    cookieManager: CookieManager;
    serviceLoopActive: boolean;

    cookieMaxAge: number;

    changeListeners: { [key: string]: Function };

    root: RootInfo;

    now: number;

    // cookieName: string,
    //     baseUrl: string,
    //     endpoints: AuthEndpoints,
    //     providers: Array<AuthProvider>

    constructor(config: AuthConfig) {
        this.cookieName = config.cookieName;
        this.extraCookies = config.extraCookies;
        this.baseUrl = config.baseUrl;
        this.cookieManager = new CookieManager();
        this.auth2Client = new Auth2(config)
        this.serviceLoopActive = false;
        // TODO: feed this from config.


        // how long does the cookie live for
        // TODO: set this properly
        this.cookieMaxAge = 300000;

        this.changeListeners = {};

        this.sessionCache = {
            session: null,
            fetchedAt: 0,
            state: CacheState.New            
        }
    }

    getSession(): Session | null {
        if (this.sessionCache.state === CacheState.Ok) {
            return this.sessionCache.session;
        }
        return null;
    }

    getToken(): string | null {
        var session = this.getSession();
        if (session) {
            return session.token;
        }
        return null;
    }

    getUsername(): string | null {
        var session = this.getSession();
        if (session) {
            return session.tokenInfo.user;
        }
        return null;
    }

    getRealname(): string | null {
        var session = this.getSession();
        if (session) {
            return session.tokenInfo.name;
        }
        return null;
    }

    getKbaseSession(): any {
        var session = this.getSession();
        if (!session) {
            return null;
        }
        let info = session.tokenInfo;
        return {
            un: info.user,
            user_id: info.user,
            name: info.name,
            token: session.token,
            kbase_sessionid: null
        };
    }

    isAuthorized(): boolean {
        var session = this.getSession();
        if (session) {
            return true;
        }
        return false;
    }

    isLoggedIn(): boolean {
        return this.isAuthorized();
    }

    setLastProvider(providerId: string): void {
        this.cookieManager.setItem(new Cookie('last-provider-used')
            .setValue(providerId)
            .setMaxAge(Infinity)
            .setPath('/'));
    }
    getLastProvider(): string {
        return this.cookieManager.getItem('last-provider-used');
    }

    getClient(): Auth2 {
        return this.auth2Client;
    }

    loginPick(arg: LoginPick): Promise<any> {
        return this.auth2Client.loginPick(arg)
            .then((result) => {
                this.setSessionCookie(result.token.token, result.token.expires);
                return this.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    loginCreate(data: ILoginCreateOptions): Promise<any> {
        return this.auth2Client.loginCreate(data)
            .then((result) => {
                this.setSessionCookie(result.token.token, result.token.expires);
                return this.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    loginUsernameSuggest(username: string): Promise<any> {
        return this.auth2Client.loginUsernameSuggest(username);
    }

    loginCancel(): Promise<null> {
        return this.auth2Client.loginCancel();
    }

    linkCancel(): Promise<null> {
        return this.auth2Client.linkCancel();
    }

    // getAccount() : Promise<any> {
    //     return this.auth2Client.getAccount(this.getToken());
    // }

    getMe(): Promise<any> {
        return this.auth2Client.getMe(this.getToken());
    }

    putMe(data: PutMeInput): Promise<any> {
        return this.auth2Client.putMe(this.getToken(), data)
    }

    getTokens(): Promise<any> {
        return this.auth2Client.getTokens(this.getToken());
    }

    createToken(data: CreateTokenInput): Promise<NewTokenInfo> {
        return this.auth2Client.createToken(this.getToken(), data);
    }

    getTokenInfo(): Promise<any> {
        return this.auth2Client.getTokenInfo(this.getToken());
    }

    getLoginCoice(): Promise<any> {
        return this.auth2Client.getLoginChoice();
    }

    loginStart(config: ILoginOptions): void {
        this.setLastProvider(config.provider);
        this.auth2Client.loginStart(config)
    }

    link(config: LinkOptions) {
        return this.auth2Client.linkPost(config);
    }

    removeLink(config: UnlinkOptions) {
        return this.auth2Client.removeLink(this.getToken(), config);
    }

    getLinkChoice(token: string): Promise<any> {
        return this.auth2Client.getLinkChoice(this.getToken());
    }

    linkPick(identityId: string): Promise<any> {
        return this.auth2Client.linkPick(this.getToken(), identityId)
            .then((result) => {
                return result;
            });
    }

    logout(tokenId?: string): Promise<any> {
        return this.getTokenInfo()
            .then((tokenInfo) => {
                var session = this.getSession();
                var currentTokenId = session ? session.tokenInfo.id : null;
                if (tokenId && tokenId !== currentTokenId) {
                    throw new Error('Supplied token id does not match the current token id, will not log out');
                }
                return this.auth2Client.revokeToken(this.getToken(), tokenInfo.id);
            })
            .then(() => {
                this.removeSessionCookie();
                return this.evaluateSession();
            });
    }

    revokeToken(tokenId: string): Promise<any> {
        let that = this;
        return this.getTokenInfo()
            .then((tokenInfo) => {
                return this.auth2Client.revokeToken(this.getToken(), tokenId);
            });
    }


    onChange(listener: Function): string {
        let utils = new Utils();
        let id = utils.genId();
        this.changeListeners[id] = listener;
        return id;
    }
    offChange(id: string) {
        delete this.changeListeners[id];
    }
    notifyListeners(change: string | null) {
        if (change === null) {
            return;
        }
        Object.keys(this.changeListeners).forEach((key) => {
            let listener = this.changeListeners[key];
            try {
                listener(change);
            } catch (ex) {
                console.error('Error running change listener', key, ex);
            }
        });
    }

    checkSession(): string {
        let cookieToken = this.auth2Client.getAuthCookie();
        let currentSession = this.getSession();
        let hadSession = currentSession ? true : false;
        var result: string | null = null;
        let now = new Date().getTime();

        // This handles the token cookie going missing. This may happen
        // if the user signed out in another window, or if they deleted
        // their cookies.
        if (!cookieToken) {
            //this.removeSessionCookie();
            if (this.sessionCache.session) {
                this.sessionCache.session = null;
                this.sessionCache.state = CacheState.None;
                return 'loggedout';
            } else {
                this.sessionCache.state = CacheState.None;
                return 'nosession';
            }
        }

        // No session, but a cookie has appeard.
        if (this.sessionCache.session === null) {
            return 'newtoken';
        }

        // if (session === null) {

        //     return 'nosession';
        // }

        // Detect user or session switcheroo. Just kill the old session.
        // The caller of checkSession will need to rebulid the session cache
        // and provide any notifications.
        if (cookieToken !== this.sessionCache.session.token) {
            this.sessionCache.session = null;
            return 'newtoken';
        }

        // Detect expired session
        let expiresIn = this.sessionCache.session.tokenInfo.expires - now;
        if (expiresIn <= 0) {
            this.sessionCache.session = null;
            this.sessionCache.state = CacheState.None;
            this.removeSessionCookie();
            return 'loggedout';
        } else if (expiresIn <= 300000) {
            // TODO: issue warning to ui.
            // console.warn('session about to expire', expiresIn);
            
        }

        // Attempt to restore interrupted session.
        // We do this once every 5 seconds for one minute,
        // then once every minute.
        if (this.sessionCache.state === CacheState.Interrupted) {
            let interruptedFor = now - this.sessionCache.interruptedAt;
            let checkedFor = now - this.sessionCache.lastCheckedAt;
            if (interruptedFor < 60000) {
                if (checkedFor > 5000) {
                    return 'interrupted-retry';
                }
            } else {
                if (checkedFor > 60000) {
                    return 'interrupted-retry'
                }
            }
            return 'ok';
        }

        // If we _still_ have a session, see if the cache is stale.
        // Note that we change the cache state but we leave the session intact.
        // TODO: revert back, just testing...
        let sessionAge = now - this.sessionCache.fetchedAt;
        if (sessionAge > this.sessionCache.session.tokenInfo.cachefor) {
            // this.session = null;
            this.sessionCache.state = CacheState.Stale;
            return 'cacheexpired';
        }

        return 'ok';
    }

    evaluateSession(): Promise<any> {
        return Promise.try(() => {
            let change: string | null = null;
            let sessionState = this.checkSession();
            switch (sessionState) {
                case 'loggedout':
                    this.notifyListeners('loggedout');
                    return;
                case 'ok':
                    return;
                case 'nosession':
                    return;
                case 'interrupted-retry':
                case 'newtoken':
                case 'cacheexpired':
                    // All these cases need the session to be rebuilt.
                    break;
                default: throw new Error('Unexpected session state: ' + sessionState);
            }

            let cookieToken = this.auth2Client.getAuthCookie();
            // if (!cookieToken) {
            //     return;
            // }
            this.sessionCache.lastCheckedAt = new Date().getTime();            
            return this.auth2Client.getTokenInfo(cookieToken)
                .then((tokenInfo) => {
                    // TODO detect invalidated token...
                    this.sessionCache.fetchedAt = new Date().getTime();
                    this.sessionCache.state = CacheState.Ok;
                    this.sessionCache.interruptedAt = null;
                    this.sessionCache.session = {
                        token: cookieToken,
                        tokenInfo: tokenInfo,
                    };

                    switch (sessionState) {
                        case 'newtoken':
                            this.notifyListeners('loggedin');
                            break;
                        case 'interrupted-retry':
                            this.notifyListeners('restored');
                            break;
                        case 'cacheexpired':
                        // nothing special, the session has just been
                        // reconfirmed.
                    }
                })
                .catch(AuthError, (err) => {
                    switch (err.code) {
                        case 'connection-error':
                        case 'timeout-error':
                        case 'abort-error':
                            // TODO: remove
                            this.sessionCache.state = CacheState.Interrupted;
                            this.sessionCache.interruptedAt = new Date().getTime();
                            this.notifyListeners('interrupted');
                            switch (sessionState) {
                                case 'cacheexpired':
                                case 'newtoken':
                                    // TODO: go to error page
                                    this.sessionCache.fetchedAt = new Date().getTime()
                                    this.notifyListeners('interrupted');
                                    break;
                                case 'interrupted-retry':
                                    this.notifyListeners('interrupted');
                                    break;
                            }
                            // console.error('CONNECTION ERROR', err);
                            break; 
                        default:
                            console.error('AUTH ERROR', err);
                    }
                })
                .catch((err) => {
                    // TODO: signal error to UI.
                    console.error('ERROR', err, err instanceof AuthError);
                    this.session = null;
                    this.removeSessionCookie();
                    if (sessionState === 'newtoken') {
                        this.notifyListeners('loggedout');
                    }
                });
        });
    }

    // root stuff
    serverTimeOffset() : number {
        return this.now - this.root.servertime;
    }


    loopTimer: number;

    start(): Promise<any> {
        console.log('starting');
        return this.auth2Client.root()
        .then((root) => {
            console.log('ROOT', root);
            this.root = root;
            this.now = new Date().getTime();
            return Promise.try(() => {
                let nextLoop = () => {
                    if (!this.serviceLoopActive) {
                        return;
                    }
                    this.loopTimer = window.setTimeout(serviceLoop, 1000);
                };
                let serviceLoop = () => {
                    return this.evaluateSession()
                        .then(() => {
                            nextLoop();
                        });
                }
                this.serviceLoopActive = true;
                serviceLoop();
                return;
            });
        });
    }

    stop(): Promise<any> {
        return Promise.try(() => {
            this.serviceLoopActive = false;
            if (this.loopTimer) {
                window.clearTimeout(this.loopTimer);
                this.loopTimer = null;
            }
        });
    }

    // COOKIES

    setSessionCookie(token: string, expiration: number) {
        let sessionCookie = new Cookie(this.cookieName)
            .setValue(token)
            .setPath('/')
            .setSecure(true);

        if (this.isSessionPersistent()) {
            sessionCookie.setExpires(new Date(expiration).toUTCString());
        }

        this.cookieManager.setItem(sessionCookie);
        let that = this;
        if (this.extraCookies) {
            this.extraCookies.forEach((cookieConfig) => {
                let extraCookie = new Cookie(cookieConfig.name)
                    .setValue(token)
                    .setPath('/')
                    .setDomain(cookieConfig.domain);

                if (this.isSessionPersistent()) {
                    extraCookie.setExpires(new Date(expiration).toUTCString());
                };

                that.cookieManager.setItem(extraCookie);
            });
        }
    }

    removeSessionCookie() {
        this.cookieManager.removeItem(new Cookie(this.cookieName)
            .setPath('/'));
        if (this.extraCookies) {
            this.extraCookies.forEach((cookieConfig) => {
                this.cookieManager.removeItem(new Cookie(cookieConfig.name)
                    .setPath('/')
                    .setDomain(cookieConfig.domain));
            })
        }
    }

    // Session persistence

    setSessionPersistent(isPersistent: boolean): void {
        let cookie = new Cookie('sessionpersist')
            .setPath('/');

        // if (isPersistent) {
        //     this.cookieManager.setItem(cookie
        //         .setValue('t')
        //         .setMaxAge(Infinity));
        // } else {
        //     this.cookieManager.removeItem(cookie);
        // }
        this.cookieManager.setItem(cookie
            .setValue(isPersistent ? 't' : 'f')
            .setMaxAge(Infinity));
    }

    isSessionPersistent(): boolean {
        var persist = this.cookieManager.getItem('sessionpersist');
        if (persist === 't') {
            return true;
        } else if (persist === 'f') {
            return false;
        } else {
            return true;
        }
    }

    userSearch(search: UserSearchInput) {
        return this.auth2Client.userSearch(this.getToken(), search);
    }

    adminUserSearch(search: UserSearchInput) {
        return this.auth2Client.adminUserSearch(this.getToken(), search);
    }

    getAdminUser(username: string) {
        return this.auth2Client.getAdminUser(this.getToken(), username);
    }

}