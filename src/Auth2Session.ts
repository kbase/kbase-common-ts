import { CookieManager, Cookie } from './Cookie'
import { Auth2, AuthConfig } from './Auth2'
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
    baseUrl : string;
    sessionTtl : number;

    session : Session;
    auth2Client: Auth2;

    cookieManager : CookieManager;
    serviceLoopActive : boolean;

    cookieMaxAge : number;


// cookieName: string,
//     baseUrl: string,
//     endpoints: AuthEndpoints,
//     providers: Array<AuthProvider>

    constructor (config: AuthConfig) {
        this.cookieName = config.cookieName;
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

    pickAccount(token : string, identityId : string) : Promise<any> {
        return this.auth2Client.pickAccount(token, identityId)
            .then((result) =>{
                this.setSessionCookie(result.data.token);
                return this.evaluateSession()
                    .then(() => {
                        return result;
                    });
            });
    }

    logout() : Promise<any> {
        return this.auth2Client.logout(this.getToken());
    }

    changeListeners : {[key:string] : Function};

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
                    return this.auth2Client.introspectToken(token)
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

    start() : void {
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
    }

    stop() : void {
        this.serviceLoopActive = false;
        if (this.loopTimer) {
            window.clearTimeout(this.loopTimer);
            this.loopTimer = null;
        }
    }

    // COOKIES

    setSessionCookie(token : string) {
        this.cookieManager.setItem(new Cookie(this.cookieName)
            .setValue(token)
            .setPath('/')
            .setMaxAge(this.cookieMaxAge));
    }

    removeSessionCookie() {
        this.cookieManager.removeItem(new Cookie(this.cookieName)
            .setPath('/'));
    }

    // login(node: HTMLElement, provider: string, redirectUrl: string, stayLoggedIn: string) {
    //     return Auth2.login(node, provider, redirectUrl)
    // }
}