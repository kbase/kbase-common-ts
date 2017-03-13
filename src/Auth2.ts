import { Cookie, CookieManager } from './Cookie'
import { Html } from './Html'
import {HttpQuery} from './HttpUtils'
import { HttpClient, Response } from './HttpClient'
import * as Promise from 'bluebird';

interface AuthProvider {
    id: string,
    label: string
}

export interface CookieConfig {
    name: string,
    domain: string
}

export interface AuthConfig {
    cookieName: string,
    extraCookies: Array<CookieConfig>
    baseUrl: string,
    providers: Array<AuthProvider>
}


interface AuthEndpoints {
    tokenInfo: string,
    profile: string,
    loginStart: string,
    loginChoice: string,
    loginCreate: string,
    loginPick: string,
    logout: string,
    linkStart: string,
    linkChoice: string,
    linkPick: string,
    linkRemove: string,
    tokens: string,
    tokensRevoke: string
}

const endpoints: AuthEndpoints = {
    tokenInfo: 'api/V2/token',
    profile: 'api/V2/me',
    loginStart: 'login/start',
    logout: 'logout',
    loginChoice: 'login/choice',
    loginCreate: 'login/create',
    loginPick: 'login/pick',
    linkStart: 'link/start',
    linkChoice: 'link/choice',
    linkPick: 'link/pick',
    linkRemove: 'me/unlink',
    tokens: 'tokens',
    tokensRevoke: 'tokens/revoke'
}


export interface ILoginOptions {
    node: HTMLElement,
    provider: string,
    redirectUrl: string,
    stayLoggedIn: boolean
}

export interface LinkOptions {
    provider: string,
    node: HTMLElement
}

export interface UnlinkOptions {
    identityId: string
}

export interface ILoginCreateOptions {
    id: string,
    user: string,
    display: string,
    email: string
}

export interface ITokenInfo {
    created: number,
    expires: number,
    id: string,
    name: string | null,
    token: string,
    type: string,
    user: string,
    cachefor: number
}

export interface Identity {
    id: string,
    provider: string,
    username: string
}

export interface Role {
    id: string,
    desc: string
}

export interface Account {
    created: number,
    customroles: Array<string>,
    display: string,
    email: string,
    idents: Array<Identity>,
    lastLogin: number,
    local: boolean,
    roles: Array<Role>,
    user: string
}

export interface ILoginCreateResponse {
    redirect_url: string,
    token: ITokenInfo
}

export interface Tokens {
    tokens: Array<ITokenInfo>,
    dev: boolean,
    serv: boolean
}

export interface CreateChoice {
    id: string,
    usernamesugg: string,
    prov_username: string,
    prov_fullname: string,
    prov_email: string
}

export interface LoginChoice {
    id: string,
    prov_usernames: Array<string>
    username: string,
    loginallowed: boolean,
    disabled: boolean,
    adminonly: boolean,
}

export interface LoginChoice {
    createurl: string,
    pickurl: string,
    provider: string
    redirecturl: string,
    creationallowed: string,
    create: Array<CreateChoice>,
    login: Array<LoginChoice>,
    token?: string,
    logged_in: boolean,
    // TODO: this is in here twice, bug.
    redirect?: string
}

export interface Auth2ApiErrorInfo {
    appCode: number,
    appError: string
}

export interface AuthErrorInfo {
    code: string,
    message: string,
    detail: string
}

export class AuthError extends Error {
    code : string;
    message: string;
    detail: string;
    constructor(errorInfo: AuthErrorInfo) {
        super(errorInfo.message);

        this.code = errorInfo.code;
        this.message = errorInfo.message;
        this.detail = errorInfo.detail;

    }

}

export class Auth2 {
    cookieManager: CookieManager;

    config: AuthConfig;

    constructor(config: AuthConfig) {
        this.config = config;
        this.cookieManager = new CookieManager();
    }

    getAuthCookie(): string {
        return this.cookieManager.getItem(this.config.cookieName);
    }

    getProviders(): Array<AuthProvider> {
        return this.config.providers;
    }
    getProvider(providerId: string) : AuthProvider {
        var providers = this.getProviders();
        return providers.filter(function (provider) {
            return (provider.id === providerId);
        })[0];           
    }

    login(config: ILoginOptions): void {
        // login(node: HTMLElement, provider: string, redirectUrl: string, stayLoggedIn: string): void {
        let html = new Html();
        let t = html.tagMaker();
        let form = t('form');
        let input = t('input');

        let query = {
            provider: config.provider,
            redirectUrl: config.redirectUrl,
            stayLoggedIn: config.stayLoggedIn ? 'true' : 'false'
        };

        let formId = html.genId();

        let content = form({
            method: 'POST',
            id: formId,
            action: [this.config.baseUrl, endpoints.loginStart].join('/'),
            style: {
                display: 'hidden'
            }
        }, [
                input({
                    type: 'hidden',
                    name: 'provider',
                    value: query.provider
                }, []),
                input({
                    type: 'hidden',
                    name: 'redirect',
                    value: query.redirectUrl
                }, [])
            ]);

        config.node.innerHTML = content;

        (<HTMLFormElement>document.getElementById(formId)).submit();
    }

    linkPost(config: LinkOptions): void {
        let html = new Html();
        let t = html.tagMaker();
        let form = t('form');
        let input = t('input');

        let query = {
            provider: config.provider
        };

        let formId = html.genId();

        let content = form({
            method: 'POST',
            id: formId,
            action: [this.config.baseUrl, endpoints.linkStart].join('/'),
            style: {
                display: 'hidden'
            }
        }, [
                input({
                    type: 'hidden',
                    name: 'provider',
                    value: query.provider
                }, [])
            ]);

        config.node.innerHTML = content;

        (<HTMLFormElement>document.getElementById(formId)).submit();
    }

    // link(token: string, config: LinkOptions): void {
    //     // login(node: HTMLElement, provider: string, redirectUrl: string, stayLoggedIn: string): void {
    //     let html = new Html();
    //     let t = html.tagMaker();
    //     let form = t('form');
    //     let input = t('input');

    //     let query = new HttpQuery({
    //         provider: config.provider,
    //         token: token
    //     });

    //     let url = this.config.baseUrl + '/' + this.config.endpoints.linkStart + '?' + query.toString();

    //     window.location.href = url;
    // }

    // removeLink(token: string, config: UnlinkOptions) : Promise<any> {
    //     let httpClient = new HttpClient();

    //     return httpClient.request({
    //         method: 'DELETE',
    //         withCredentials: true,
    //         header: {
    //             Authorization: token,
    //             'Content-Type': 'application/json'
    //         },
    //         url: [this.config.baseUrl, endpoints.linkRemove, config.identityId].join('/')
    //     })
    //         .then((result: Response) => {
    //             switch (result.status) {
    //                 case 204:
    //                     return {
    //                         status: 'ok'
    //                     }                  
    //                 default:
    //                     return {
    //                         status: 'error',
    //                         message: 'Unexpected response logging out',
    //                         statusCode: result.status
    //                     };
    //             }
    //         });
    // }

    /*
    POST /me/unlink/:id
    Authorization :token
    */
    removeLink(token: string, config: UnlinkOptions) : Promise<any> {
        let httpClient = new HttpClient();

        return httpClient.request({
            method: 'DELETE',
            withCredentials: true,
            header: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
            url: [this.config.baseUrl, endpoints.linkRemove, config.identityId].join('/')
        })
            .then((result: Response) => {
                switch (result.status) {
                    case 204:
                        return {
                            status: 'ok'
                        }                  
                    default:
                        return {
                            status: 'error',
                            message: 'Unexpected response logging out',
                            statusCode: result.status
                        };
                }
            });
    }


    revokeToken(token: string, tokenid: string): Promise<any> {
        let httpClient = new HttpClient();

        return httpClient.request({
            method: 'DELETE',
            withCredentials: true,
            header: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
            url: this.config.baseUrl + '/' + endpoints.tokensRevoke + '/' + tokenid
        })
            .then((result: Response) => {
                switch (result.status) {
                    case 204:
                        return {
                            status: 'ok'
                        }                  
                    default:
                        return {
                            status: 'error',
                            message: 'Unexpected response logging out',
                            statusCode: result.status
                        };
                }
            });
    } 
 
    getTokenInfo(token: string): Promise<ITokenInfo> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            url: this.makePath([endpoints.tokenInfo]),
            withCredentials: true,
            header: {
                Authorization: token
            }
        })
            .then((result: Response) => {
                var response;
                try {
                    response = JSON.parse(result.response)
                } catch (ex) {
                    throw new AuthError({
                        code: 'json-parse-error',
                        message: ex.message,
                        detail: 'An unexpected error occurred parsing the request response as JSON.'
                    });  
                }
                
                if (result.status === 200) {
                    return <ITokenInfo>response;
                }

                var error = <Auth2ApiErrorInfo>response;

                switch (result.status) {
                    case 401: 
                        throw new AuthError({
                            code: String(error.appCode),
                            message: error.appError,
                            detail: 'An authorization error occurred'
                        });
                    case 400:
                        throw new AuthError({
                            code: 'client-error',
                            message: error.appError,
                            detail: 'An unexpected client error occurred'
                        });
                    case 500:
                        throw new AuthError({
                            code: 'server-error',
                            message: error.appError,
                            detail: 'An unexpected server error occurred'
                        });
                    default:
                        throw new AuthError({
                            code: 'unexpected-error',
                            message: error.appError,
                            detail: 'An unexpected error occurred'
                        });                        
                }
                

            });
    }

    getAccount(token: string): Promise<Account> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.profile,
            header: {
                Authorization: token,
                Accept: 'application/json'
            }
        })
            .then(function (result) {
                try {
                    return JSON.parse(result.response);
                } catch (ex) {
                    console.error('ERROR getting user account info', result);
                    throw new Error('Cannot parse "me" result:' + ex.message);
                }
            });
    }

    makePath(path: Array<string>) : string {
        return [this.config.baseUrl].concat(path).join('/');
    }

    getTokens(token: string): Promise<Tokens> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.makePath([endpoints.tokens]),
            header: {
                Authorization: token,
                Accept: 'application/json'
            }
        })
            .then(function (result) {
                var data;
                try {
                    data = JSON.parse(result.response);                   
                } catch (ex) {
                    console.error('ERROR getting tokens', result);
                    throw new Error('Cannot parse "tokens" result');
                }
                switch (result.status) {
                    case 200:
                        return data;
                    default:
                        console.error('ERROR getting tokens', result);
                        throw new Error('Error getting tokens');
                }
            });
    }

    // Note that the auth2 service will have set cookies 
    // in the browser which are implicitly sent.
    getLoginChoice() : Promise<LoginChoice> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.makePath([endpoints.loginChoice]),
            header: {
                Accept: 'application/json'
            }
        })
            .then(function (result) {
                var data;
                try {
                    data = <LoginChoice>JSON.parse(result.response);
                } catch (ex) {
                    throw new AuthError({
                        code: 'parse', 
                        message: 'Error parsing response', 
                        detail: ex.message
                    });
                    // return {
                    //     status: 'error',
                    //     data: {
                    //         message: 'Error parsing response',
                    //         detail: 'ex.message'
                    //     }
                    // }
                }
                switch (result.status) {
                    case 200:
                        return data;
                    default:
                        console.error('ERROR fix me', result);
                        throw new AuthError({
                            code: '?',
                            message: 'some message',
                            detail: 'some detail'
                        });
                        // return {
                        //     status: 'error',
                        //     code: result.status,
                        //     data: data
                        // }
                }
            });
    }

    loginPick(token: string, identityId: string): Promise<any> {
        let data = {
            id: identityId
        };
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.loginPick,
            data: JSON.stringify(data),
            header: {
                Authorization: token,
                'Content-Type': 'application/json',
                'Accept': 'Application/json'
            }
        })
            .then(function (result) {
                var data;
                try {
                    data = JSON.parse(result.response);
                } catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    }
                }
                switch (result.status) {
                    case 200:
                        return {
                            status: 'ok',
                            data: data
                        };
                    default:
                        return {
                            status: 'error',
                            code: result.status,
                            data: data
                        }
                }
            });
    }

    loginCreate(data: ILoginCreateOptions): Promise<any> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.loginCreate,
            data: JSON.stringify(data),
            header: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
            .then(function (result) {
                var data;
                try {
                    data = JSON.parse(result.response);
                } catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    }
                }
                switch (result.status) {
                    case 201:
                        return {
                            status: 'ok',
                            data: data
                        };
                    default:
                        return {
                            status: 'error',
                            code: result.status,
                            data: data
                        }
                }
            });
    }

     getLinkChoice(token: string) {
        let httpClient = new HttpClient();
        // console.error('fetching with', token);
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.linkChoice,
            header: {
                Accept: 'application/json',
                Authorization: token
            }
        })
            .then(function (result) {
                var data;
                try {
                    data = JSON.parse(result.response);
                } catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    }
                }
                switch (result.status) {
                    case 200:
                        return {
                            status: 'ok',
                            data: data
                        };
                    case 400: 
                        return {
                            status: 'error',
                            code: result.status,
                            data: data
                        }
                    default:
                        return {
                            status: 'error',
                            code: result.status,
                            data: data
                        }
                }
            });
    }

    linkPick(token: string, identityId: string): Promise<any> {
        let data = {
            id: identityId
        };
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.linkPick,
            data: JSON.stringify(data),
            header: {
                Authorization: token,
                'Content-Type': 'application/json',
                'Accept': 'Application/json'
            }
        })
            .then(function (result) {
                var data;
                try {
                    data = JSON.parse(result.response);
                } catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    }
                }
                switch (result.status) {
                    case 200:
                        return {
                            status: 'ok',
                            data: data
                        };
                    default:
                        return {
                            status: 'error',
                            code: result.status,
                            data: data
                        }
                }
            });
    }

}