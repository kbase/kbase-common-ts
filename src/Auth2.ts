import { Cookie, CookieManager } from './Cookie'
import { Html } from './Html'
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
    endpoints: AuthEndpoints,
    providers: Array<AuthProvider>
}

interface AuthEndpoints {
    introspect: string,
    profile: string,
    loginStart: string,
    loginChoice: string,
    loginCreate: string,
    loginPick: string,
    logout: string
}

export interface ILoginOptions {
    node: HTMLElement, 
    provider: string, 
    redirectUrl: string, 
    stayLoggedIn: boolean    
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
    user: string
}

export interface ILoginCreateResponse {
    redirect_url: string,
    token: ITokenInfo
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

    login(config: ILoginOptions) : void {
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
            action: [this.config.baseUrl, this.config.endpoints.loginStart].join('/'),
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

    revokeToken(token: string, tokenid: string): Promise<any> {
        let httpClient = new HttpClient();

        return httpClient.request({
            method: 'DELETE',
            header: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
            url: this.config.baseUrl + '/' + this.config.endpoints.logout
        })
            .then((result: Response) => {
                // console.log('DELETEd', result);
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


    logout(token: string): Promise<any> {
        let httpClient = new HttpClient();

        return httpClient.request({
            method: 'DELETE',
            header: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
            url: this.config.baseUrl + '/' + this.config.endpoints.logout
        })
            .then((result: Response) => {
                // console.log('DELETEd', result);
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

    getIntrospection(token: string) {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            url: this.config.baseUrl + '/' + this.config.endpoints.introspect,
            header: {
                Authorization: token
            }
        })
            .then((result: Response) => {
                try {
                    let tokenInfo = JSON.parse(result.response);
                    return tokenInfo;
                } catch (ex) {
                    console.error('ERROR', result);
                    throw new Error('Cannot parse token introspection result: ' + ex.message);
                }
            });
    }

    getAccount(token: string) {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            url: this.config.baseUrl + '/' + this.config.endpoints.profile,
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
        })
    }

    getLoginChoice(token: string) {
        let httpClient = new HttpClient();
        // console.error('fetching with', token);
        return httpClient.request({
            method: 'GET',
            url: this.config.baseUrl + '/' + this.config.endpoints.loginChoice,
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

    loginPick(token: string, identityId: string) : Promise<any> {
        let data = {
            id: identityId
        };
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            url: this.config.baseUrl + '/' + this.config.endpoints.loginPick,
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

    loginCreate(data : ILoginCreateOptions) : Promise<any> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            url: this.config.baseUrl + '/' + this.config.endpoints.loginCreate,
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

}