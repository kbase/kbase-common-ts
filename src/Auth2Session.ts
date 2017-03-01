import { CookieManager, Cookie } from './Cookie'
import { Auth2, AuthConfig, CookieConfig, ILoginOptions, ILoginCreateOptions } from './Auth2'
import { Html } from './Html'
import { Utils } from './Utils'
import * as Promise from 'bluebird';

interface TokenInfo {
    user : string,
    name : string
}

interface Session {
    token : string,
    fetchedAt : number,
    tokenInfo : TokenInfo
}

export class Auth2Session {

    cookieName : string;

    extraCookies: Array<CookieConfig>;

    baseUrl : string;
    sessionTtl : number;

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

        // how long is the session cached for
        this.sessionTtl = 300000;

        // how long does the cookie live for
        // TODO: set this properly
        this.cookieMaxAge = 300000;

        this.changeListeners = {};
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

    loginPick(token : string, identityId : string) : Promise<any> {
        let that = this;
        return that.auth2Client.loginPick(token, identityId)
            .then((result) => {
                // console.log('picked', token, identityId, result);
                that.setSessionCookie(result.data.token.token);
                return that.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    loginCreate(data: ILoginCreateOptions) : Promise<any> {
        return this.auth2Client.loginCreate(data)
            .then((result) => {
                // console.log('CREATED', result);
                this.setSessionCookie(result.data.token.token);
                return this.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    getAccount() : Promise<any> {
        return this.auth2Client.getAccount(this.getToken());
    }

    getIntrospection() : Promise<any> {
        return this.auth2Client.getIntrospection(this.getToken());
    }

    getLoginCoice() : Promise<any> {
        return this.auth2Client.getLoginChoice(this.getToken());
    }

    login(config : ILoginOptions) {
        this.setLastProvider(config.provider);
        return this.auth2Client.login(config)
    }
            

    logout() : Promise<any> {
        let that = this;
        return this.getIntrospection()
            .then(function (tokenInfo) {
                return that.auth2Client.revokeToken(that.getToken(), tokenInfo.id);
            })
            .then(() => {
                that.removeSessionCookie();
                return that.evaluateSession();
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

    evaluateSession() : Promise<any> {
        let token = this.auth2Client.getAuthCookie();
        // console.log('TOKEN', token);
        let hadSession = this.session ? true : false;
        var change : string | null = null;
        return Promise.try(() => {
            if (!token) {
                if (this.session) {
                    change = 'loggedout';
                }
                this.session = null;
            } else {
                let now = new Date().getTime();
                if (this.session) {
                    if (now - this.session.fetchedAt > this.sessionTtl) {
                        change = 'loggedout';
                        this.session = null;
                    } else if (token !== this.session.token) {
                        change = 'newuser';
                        this.session = null;
                    }
                }

                // If no session, yet we have a token, we need to 
                // fetch the session info.
                if (!this.session) {
                    return this.auth2Client.getIntrospection(token)
                        .then((tokenInfo) => {
                            if (!tokenInfo) {
                                if (hadSession) {
                                    change = 'loggedout';
                                    this.session = null;
                                }
                            } else {
                                if (!this.session) {
                                    change = 'loggedin';
                                } else {
                                    if (this.session.token !== token) {
                                        change = 'newuser';
                                    }
                                }
                                this.session = {
                                    token: token,
                                    fetchedAt: new Date().getTime(),
                                    tokenInfo: tokenInfo
                                };
                            }
                        })
                        .catch((err) => {
                            console.error('ERROR', err);
                            if (this.session) {
                                change = 'loggedout';
                                this.session = null;
                            }
                        });            
                }
            }
        })
        .then(() => {
            this.notifyListeners(change);
        })
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

    setSessionCookie(token : string) {
        this.cookieManager.setItem(new Cookie(this.cookieName)
            .setValue(token)
            .setPath('/')
            .setMaxAge(this.cookieMaxAge));
        let that = this;
        if (this.extraCookies) {
            this.extraCookies.forEach((cookieConfig) => {
                that.cookieManager.setItem(new Cookie(cookieConfig.name)
                    .setValue(token)
                    .setPath('/')
                    .setDomain(cookieConfig.domain)
                    .setMaxAge(that.cookieMaxAge));
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




}