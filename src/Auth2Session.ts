import { CookieManager, Cookie } from './Cookie'
import { 
    Auth2, AuthConfig, CookieConfig, ILoginOptions, ILoginCreateOptions, 
    LinkOptions, UnlinkOptions, ITokenInfo, LoginPick, CreateTokenInput, NewTokenInfo,
    UserSearchInput, PutMeInput} from './Auth2'
import { Html } from './Html'
import { Utils } from './Utils'
import * as Promise from 'bluebird';



interface Session {
    token : string,
    fetchedAt : number,
    tokenInfo : ITokenInfo
}

export class Auth2Session {

    cookieName : string;

    extraCookies: Array<CookieConfig>;

    baseUrl : string;

    session : Session;
    auth2Client: Auth2;

    cookieManager : CookieManager;
    serviceLoopActive : boolean;

    cookieMaxAge : number;

    changeListeners : {[key:string] : Function};

// cookieName: string,
//     baseUrl: string,
//     endpoints: AuthEndpoints,
//     providers: Array<AuthProvider>

    constructor (config: AuthConfig) {
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

        this.session = null;
    }

    getToken() : string | null {
        if (this.session) {
            return this.session.token;
        }
        return null;
    }

    getUsername() : string | null {
        if (this.session) {
            return this.session.tokenInfo.user;            
        }
        return null;
    }

    getRealname() : string | null {
        if (this.session) {
            return this.session.tokenInfo.name;
        }
        return null;
    }

    getKbaseSession() : any {
        if (!this.session) {
            return null;
        }
        let info = this.session.tokenInfo;
        return {
            un: info.user,
            user_id: info.user,
            name: info.name,
            token: this.session.token,
            kbase_sessionid: null
        };
    }

    isAuthorized() : boolean {
        if (this.session) {
            return true;
        }
        return false;
    }

    isLoggedIn() : boolean {
        return this.isAuthorized();
    }

    setLastProvider(providerId : string) : void {
        this.cookieManager.setItem(new Cookie('last-provider-used')
            .setValue(providerId)
            .setMaxAge(Infinity)
            .setPath('/'));
    }
    getLastProvider() : string {
        return this.cookieManager.getItem('last-provider-used');
    }

    getClient() : Auth2 {
        return this.auth2Client;
    }

    loginPick(arg: LoginPick) : Promise<any> {
        return this.auth2Client.loginPick(arg)
            .then((result) => {
                this.setSessionCookie(result.data.token.token, result.data.token.expires);
                return this.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    loginCreate(data: ILoginCreateOptions) : Promise<any> {
        return this.auth2Client.loginCreate(data)
            .then((result) => {
                this.setSessionCookie(result.data.token.token, result.data.token.expires);
                return this.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    // getAccount() : Promise<any> {
    //     return this.auth2Client.getAccount(this.getToken());
    // }

    getMe() : Promise<any> {
        return this.auth2Client.getMe(this.getToken());
    }

    putMe(data : PutMeInput) : Promise<any> {
        return this.auth2Client.putMe(this.getToken(), data)
    }

    getTokens() : Promise<any> {
        return this.auth2Client.getTokens(this.getToken());
    }

    createToken(data: CreateTokenInput) : Promise<NewTokenInfo> {
        return this.auth2Client.createToken(this.getToken(), data);
    }

    getTokenInfo() : Promise<any> {
        return this.auth2Client.getTokenInfo(this.getToken());
    }

    getLoginCoice() : Promise<any> {
        return this.auth2Client.getLoginChoice();
    }

    loginStart(config : ILoginOptions) : void {
        this.setLastProvider(config.provider);
        this.auth2Client.loginStart(config)
    }

    link(config : LinkOptions) {
        return this.auth2Client.linkPost(config);
    }

    removeLink(config: UnlinkOptions) {
        return this.auth2Client.removeLink(this.getToken(), config);
    }

    getLinkChoice(token: string): Promise<any> {
        return this.auth2Client.getLinkChoice(this.getToken());
    }

    linkPick(identityId : string) : Promise<any> {
        return this.auth2Client.linkPick(this.getToken(), identityId)
            .then((result) => {
                return result;
            });
    }         

    logout(tokenId?: string) : Promise<any> {
        return this.getTokenInfo()
            .then((tokenInfo) => {
                var currentTokenId = this.session ? this.session.tokenInfo.id : null;
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

    revokeToken(tokenId: string) : Promise<any> {
        let that = this;
        return this.getTokenInfo()
            .then((tokenInfo) => {
                return this.auth2Client.revokeToken(this.getToken(), tokenId);
            });
    }


    onChange(listener : Function) : string {
        let utils = new Utils();
        let id = utils.genId();
        this.changeListeners[id] = listener;
        return id;
    }
    offChange(id : string) {
        delete this.changeListeners[id];
    }
    notifyListeners(change : string | null) {
        if (change === null ) {
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

    checkSession() : string {
        let cookieToken = this.auth2Client.getAuthCookie();
        let currentSession = this.session;
        let hadSession = this.session ? true : false;
        var result : string | null = null;
        let now = new Date().getTime();

        if (!cookieToken) {
            this.removeSessionCookie();
            if (this.session) {
                this.session = null;
                return 'loggedout';
            } else {
                return 'nosession'
            }
        }

        if (this.session === null) {
            return 'nosession';
        }

        // Detect user or session switcheroo. Just kill the old session.
        if (cookieToken !== currentSession.token) {
            // Detect change in token 
            this.session = null;
            return 'newtoken';
        }

        // Detect expired session
        let expiresIn = this.session.tokenInfo.expires - now;
        if (expiresIn <= 0) {
            this.session = null;
            this.removeSessionCookie();
            return 'loggedout';
        } else if (expiresIn <= 300000) {
            // TODO: issue warning to ui.
            // console.warn('session about to expire', expiresIn);
        } 

        let sessionAge = now - this.session.fetchedAt;
        // If we _still_ have a session, see if we need to refetch the session state.
        if (sessionAge > this.session.tokenInfo.cachefor) {
            this.session = null;
            return 'cacheexpired';
        }
        return 'ok';
    }

    evaluateSession() : Promise<any> {
        return Promise.try(() => {
            let change : string | null = null;
            let sessionState = this.checkSession();
            switch (sessionState) {
                case 'loggedout':
                    this.notifyListeners('loggedout');
                    return;
                case 'ok':
                    return;
                case 'nosession':
                case 'newtoken':
                case 'cacheexpired':
                    break;
                default: throw new Error('Unexpected session state: ' + sessionState);
            }

            // No need to fetch a new session if checkSession lets
            // us keep it.

            let cookieToken = this.auth2Client.getAuthCookie();
            if (!cookieToken) {
                return;
            }
            return this.auth2Client.getTokenInfo(cookieToken)
                .then((tokenInfo) => {
                    // TODO detect invalidated token...
                    this.session = {
                        token: cookieToken,
                        fetchedAt: new Date().getTime(),
                        tokenInfo: tokenInfo
                    };

                    switch (sessionState) {
                        case 'nosession':
                            this.notifyListeners('loggedin');
                            break;
                        case 'newtoken':
                            this.notifyListeners('loggedin');
                            break;
                        case 'cacheexpired':
                            // nothing special;
                    }
                })
                .catch((err) => {
                    // TODO: signal error to UI.
                    console.error('ERROR', err);                    
                    this.session = null;
                    this.removeSessionCookie();
                    if (sessionState === 'newtoken') {
                        this.notifyListeners('loggedout');
                    }
                });            
        });
    }

    loopTimer : number;

    start() : Promise<any> {
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
    }

    stop() : Promise<any> {
        return Promise.try(() => {
            this.serviceLoopActive = false;
            if (this.loopTimer) {
                window.clearTimeout(this.loopTimer);
                this.loopTimer = null;
            }
        });
    }

    // COOKIES

    setSessionCookie(token : string, expiration: number) {
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

    setSessionPersistent(isPersistent : boolean) : void {
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

    isSessionPersistent() : boolean {
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