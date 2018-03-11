import { CookieManager, Cookie } from './Cookie'
import {
    Auth2, AuthConfig, ILoginOptions, ILoginCreateOptions,
    LinkOptions, UnlinkOptions, ITokenInfo, LoginPick, CreateTokenInput, NewTokenInfo,
    UserSearchInput, PutMeInput, RootInfo, Account, Role
} from './Auth2'
import {
    AuthError
} from './Auth2Error'
import { Html } from './Html'
import { Utils } from './Utils'
import * as Promise from 'bluebird';


export interface CookieConfig {
    name: string,
    domain: string
}

export interface AuthSessionConfig {
    cookieName: string,
    baseUrl: string,
    extraCookies: Array<CookieConfig>
}

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
    me: Account
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

    constructor(config: AuthSessionConfig) {
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

    getEmail(): string | null {
        var session = this.getSession();
        if (session) {
            return session.me.email;
        }
        return null;
    }

    getRealname(): string | null {
        var session = this.getSession();
        if (session) {
            return session.me.display;
        }
        return null;
    }

    getRoles(): Array<Role> | null {
        var session = this.getSession();
        if (session) {
            return session.me.roles;
        }
        return null;
    }

    getCustomRoles(): Array<string> | null {
        var session = this.getSession();
        if (session) {
            return session.me.customroles;
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
        return this.auth2Client.loginCreate(data);
    }

    initializeSession(tokenInfo: any): Promise<any> {
        this.setSessionCookie(tokenInfo.token, tokenInfo.expires);
        return this.evaluateSession();
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
        this.auth2Client.loginStart(config)
    }

    linkStart(config: LinkOptions) {
        return this.auth2Client.linkStart(this.getToken(), config);
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
        return this.auth2Client.logout(this.getToken())
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

    revokeAllTokens(): Promise<any> {
        let that = this;
        return this.getTokenInfo()
            .then((tokenInfo) => {
                return this.auth2Client.revokeAllTokens(this.getToken());
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

    checkSession(): any {
        let cookieToken = this.getAuthCookie();
        let currentSession = this.getSession();
        let hadSession = currentSession ? true : false;
        var result: string | null = null;
        let now = new Date().getTime();

        // This handles the token cookie going missing. This may happen
        // if the user signed out in another window, or if they deleted
        // their cookies.
        if (!cookieToken) {
            if (this.sessionCache.session) {
                this.sessionCache.session = null;
                this.sessionCache.state = CacheState.None;
                return {
                    status: 'loggedout'
                };
            } else {
                this.sessionCache.state = CacheState.None;
                return {
                    status: 'nosession'
                };
            }
        }

        // No session, but a cookie has appeard.
        if (this.sessionCache.session === null) {
            return {
                status: 'newtoken',
                cookie: cookieToken
            };
        }

        // Detect user or session switcheroo. Just kill the old session.
        // The caller of checkSession will need to rebulid the session cache
        // and provide any notifications.
        if (cookieToken !== this.sessionCache.session.token) {
            this.sessionCache.session = null;
            return {
                status: 'newtoken',
                cookie: cookieToken
            };
        }

        // Detect expired session
        let expiresIn = this.sessionCache.session.tokenInfo.expires - now;
        if (expiresIn <= 0) {
            this.sessionCache.session = null;
            this.sessionCache.state = CacheState.None;
            this.removeSessionCookie();
            return {
                status: 'loggedout'
            };
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
                    return {
                        status: 'interrupted-retry',
                        cookie: cookieToken
                    };
                }
            } else {
                if (checkedFor > 60000) {
                    return {
                        status: 'interrupted-retry',
                        cookie: cookieToken
                    };
                }
            }
            // Note that we don't try to recache the session whiel in interrupted
            // state, so we just return ok here.
            return {
                status: 'ok',
                cookie: cookieToken
            };
        }

        // If we _still_ have a session, see if the cache is stale.
        // Note that we change the cache state but we leave the session intact.
        // TODO: revert back, just testing...
        let sessionAge = now - this.sessionCache.fetchedAt;
        if (sessionAge > this.sessionCache.session.tokenInfo.cachefor) {
            // this.session = null;
            this.sessionCache.state = CacheState.Stale;
            return {
                status: 'cacheexpired',
                cookie: cookieToken
            };
        }

        return {
            status: 'ok',
            cookie: cookieToken
        };
    }

    getAuthCookie(): string {
        var cookies = this.cookieManager.getItems(this.cookieName);
        if (cookies.length === 1) {
            return cookies[0];
        }
        if (cookies.length === 0) {
            return null;
        }
        // Handle case of a domain and host cookie slipping in.
        if (cookies.length === 2) {
            this.removeSessionCookie();
        }
        var cookies = this.cookieManager.getItems(this.cookieName);
        if (cookies.length > 0) {
            throw new Error('Duplicate session cookie detected and cannot remove it. Please delete your browser cookies for this site.');
        }
    }

    evaluateSession(): Promise<any> {
        return Promise.try(() => {
            let change: string | null = null;
            let sessionState = this.checkSession();
            switch (sessionState.status) {
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
                default: throw new Error('Unexpected session state: ' + sessionState.status);
            }

            let cookieToken = sessionState.cookie;

            this.sessionCache.lastCheckedAt = new Date().getTime();
            var tokenInfo: ITokenInfo;
            var me: Account;
            return this.auth2Client.getTokenInfo(cookieToken)
                .then((result) => {
                    tokenInfo = result;
                    return this.auth2Client.getMe(cookieToken);
                })
                .then((result) => {
                    me = result;
                    // TODO detect invalidated token...
                    this.sessionCache.fetchedAt = new Date().getTime();
                    this.sessionCache.state = CacheState.Ok;
                    this.sessionCache.interruptedAt = null;
                    this.sessionCache.session = {
                        token: cookieToken,
                        tokenInfo: tokenInfo,
                        me: me
                    };

                    switch (sessionState.status) {
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
                        case '10020':
                            // invalid token - the token is not accepted by the auth2 service, 
                            // so just invalidate the session.
                            console.error('Invalid Session Cookie Detected', err);
                            this.removeSessionCookie();
                            this.notifyListeners('loggedout');
                        case 'connection-error':
                        case 'timeout-error':
                        case 'abort-error':
                            // TODO: remove
                            this.sessionCache.state = CacheState.Interrupted;
                            this.sessionCache.interruptedAt = new Date().getTime();
                            this.notifyListeners('interrupted');
                            switch (sessionState.status) {
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
                            console.error('Unhandled AUTH ERROR', err);
                            this.removeSessionCookie();
                            this.notifyListeners('loggedout');
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
    serverTimeOffset(): number {
        return this.now - this.root.servertime;
    }

    loopTimer: number;

    start(): Promise<any> {
        return this.auth2Client.root()
            .then((root) => {
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
                    return serviceLoop();
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

        sessionCookie.setExpires(new Date(expiration).toUTCString());

        this.cookieManager.setItem(sessionCookie);
        let that = this;
        if (this.extraCookies) {
            this.extraCookies.forEach((cookieConfig) => {
                let extraCookie = new Cookie(cookieConfig.name)
                    .setValue(token)
                    .setPath('/')
                    .setDomain(cookieConfig.domain);

                extraCookie.setExpires(new Date(expiration).toUTCString());

                that.cookieManager.setItem(extraCookie);
            });
        }
    }

    removeSessionCookie() {
        // Remove host-based cookie. This is the only one officially set.
        this.cookieManager.removeItem(new Cookie(this.cookieName)
            .setPath('/'));

        // Also remove the domain level cookie in case it was in advertently 
        // created. This can be a cause for a corruupt token, since the old auth
        // system tokens are invalid, and it could create domain level cookies.
        // New auth code does not (other than the backup cookie.)
        let domainParts = window.location.hostname.split('.');
        var domain;
        for (var len = 2; len <= domainParts.length; len += 1) {
            domain = domainParts.slice(-len).join('.');
            this.cookieManager.removeItem(new Cookie(this.cookieName)
                .setPath('/').setDomain(domain));
        }

        if (this.extraCookies) {
            this.extraCookies.forEach((cookieConfig) => {
                this.cookieManager.removeItem(new Cookie(cookieConfig.name)
                    .setPath('/')
                    .setDomain(cookieConfig.domain));
            })
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