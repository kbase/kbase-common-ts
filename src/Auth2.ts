import { Cookie, CookieManager } from './Cookie'
import { Html } from './Html'
import { HttpClient, Response } from './HttpClient'
import * as Promise from 'bluebird';

interface AuthProvider {
    id: string,
    label: string
}

export interface AuthConfig {
    cookieName: string,
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

interface ILoginOptions {
    node: HTMLElement, 
    provider: string, 
    redirectUrl: string, 
    stayLoggedIn: boolean    
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

    setLastProvider(providerId: string): void {
        this.cookieManager.setItem(new Cookie('last-provider-used')
            .setValue(providerId)
            .setMaxAge(Infinity)
            .setPath('/'));
    }

    login(config: ILoginOptions) : void {
    // login(node: HTMLElement, provider: string, redirectUrl: string, stayLoggedIn: string): void {
        let html = new Html();
        let t = html.tag;
        let form = t('form');
        let input = t('input');

        this.setLastProvider(config.provider);

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

    logout(token: string): Promise<any> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'DELETE',
            header: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                token: token
            }),
            url: this.config.endpoints.logout
        })
            .then((result: Response) => {
                switch (result.status) {
                    case 200:
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

    introspectToken(token: string) {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            url: this.config.endpoints.introspect,
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

    getLoginChoice(token: string) {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            url: this.config.endpoints.loginChoice,
            query: {
                token: token
            },
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

    pickAccount(token: string, identityId: string) : Promise<any> {
        let data = {
            token: token,
            id: identityId
        };
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'PUT',
            url: this.config.endpoints.loginPick,
            data: JSON.stringify(data),
            header: {
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

    loginCreate(data : any) {
        let httpClient = new HttpClient();
        httpClient.request({
            method: 'POST',
            url: this.config.endpoints.loginCreate,
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