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
    introspect: string,
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
    introspect: 'api/V2/token',
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
    tokens: Array<any>,
    dev: boolean,
    serv: boolean
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

    removeLink(token: string, config: UnlinkOptions) : Promise<any> {
        let httpClient = new HttpClient();

        return httpClient.request({
            method: 'POST',
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

    getIntrospection(token: string): Promise<ITokenInfo> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            url: this.config.baseUrl + '/' + endpoints.introspect,
            header: {
                Authorization: token
            }
        })
            .then((result: Response) => {
                switch (result.status) {
                    case 200:
                        return <ITokenInfo>JSON.parse(result.response);
                    case 401:
                        console.error('Error in getIntrospection', result);
                        let errorData = JSON.parse(result.response).error;
                        console.error('Error in getIntrospection', errorData);
                        switch (errorData.appCode) {
                            case 10011:
                                throw new Error(errorData.appError);
                            default:
                                throw new Error('Unexpected error: ' + errorData.appError);
                        }
                    default:
                        throw new Error('Unexpected error: ' + errorData.appError);
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

    getTokens(token: string): Promise<Tokens> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.tokens,
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

    getLoginChoice() {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.loginChoice,
            header: {
                Accept: 'application/json'
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