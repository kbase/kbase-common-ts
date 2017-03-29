import { Cookie, CookieManager } from './Cookie'
import { Html } from './Html'
import { HttpQuery } from './HttpUtils'
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
    apiMe: string,
    me: string,
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
    tokensRevoke: string,
    tokensCreate: string,
    userSearch: string,
    adminUserSearch: string,
    adminUser: string
}

const endpoints: AuthEndpoints = {
    tokenInfo: 'api/V2/token',
    apiMe: 'api/V2/me',
    me: 'me',
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
    tokensRevoke: 'tokens/revoke',
    tokensCreate: 'tokens/create',
    userSearch: 'api/V2/users/search',
    adminUserSearch: 'api/V2/admin/search',
    adminUser: 'api/V2/admin/user'
}


export interface ILoginOptions {
    provider: string,
    state: string,
    stayLoggedIn: boolean
}

export interface LoginStartResponse {
    token: string,
    providerUrl: string,
    providerCode: string
}

export interface LinkOptions {
    provider: string,
    node: HTMLElement
}

export interface UnlinkOptions {
    identityId: string
}

export interface UserPolicy {
    id: string,
    agreed_on: number
}

export interface ILoginCreateOptions {
    id: string,
    user: string,
    display: string,
    email: string,
    linkall: boolean,
    policy_ids: Array<UserPolicy>
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
    state: string,
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
    appError: string,
    message: string
}

export interface AuthErrorInfo {
    code: string,
    message: string,
    detail?: string
}

export interface PolicyAgreement {
    id: string,
    version: number
}

export interface LoginPick {
    token: string,
    identityId: string,
    linkAll: boolean,
    agreements: Array<PolicyAgreement>
}

export interface CreateTokenInput {
    name: string,
    type: string
}

export interface NewTokenInfo {
    type: string,
    id: string,
    expires: number,
    created: number,
    name: string,
    user: string,
    token: string
}

export interface UserSearchInput {
    prefix: string,
    fields: string
}

export interface UserSearchOutput {

}

export interface PutMeInput {
    display: string,
    email: string
}

// Classes

export class AuthError extends Error {
    code: string;
    message: string;
    detail?: string;
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
    getProvider(providerId: string): AuthProvider {
        var providers = this.getProviders();
        return providers.filter(function (provider) {
            return (provider.id === providerId);
        })[0];
    }

    /*
        Note that this just just punts the browser via a javascript-submitted
        form post.
        There is no return value, nor any way of verifying that the server
        did the correctthing.
    */
    loginStart(config: ILoginOptions): void {
        // Set the client state cookie.
        var state = JSON.stringify(config.state);
        // var cookies = new CookieManager();
        // cookies.setItem(new Cookie('client-state')
        //     .setValue(state)
        //     .setPath('/'));

        // Punt over to the auth service
        let html = new Html();
        let t = html.tagMaker();
        let form = t('form');
        let input = t('input');
        let button = t('button');

        var url = new URL(document.location.origin);
        let q = new URLSearchParams(); 
        q.append('state', JSON.stringify(config.state));
        url.search = q.toString();

        let query = {
            provider: config.provider,
            redirectUrl: url.toString(),
            stayLoggedIn: config.stayLoggedIn ? 'true' : 'false'
        };

        let formId = html.genId();

        let content = form({
            method: 'post',
            id: formId,
            action: this.makePath(endpoints.loginStart),
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
        var donorNode = document.createElement('div');

        donorNode.innerHTML = content;
        document.body.appendChild(donorNode);

        // console.log(content);
        (<HTMLFormElement>document.getElementById(formId)).submit();
    }

    // loginStartBrowser(config: ILoginOptions): void {
    //     // login(node: HTMLElement, provider: string, redirectUrl: string, stayLoggedIn: string): void {
    //     let url = new URL(this.makePath([endpoints.loginStart]));
    //     let query = new URLSearchParams();
    //     query.append('provider', config.provider);
    //     // query.append('redirectUrl', config.redirectUrl);
    //     query.append('clientstate', config.redirectUrl);
    //     query.append('stayLoggedIn', config.stayLoggedIn ? 'true' : 'false');
    //     url.search = query.toString();

    //     try {
    //         var result = document.location.assign(url.toString());
    //         console.log('ok', result);
    //     } catch (ex) {
    //         if (ex instanceof DOMException) {
    //             console.log('DOM ERROR', ex);
    //         } else {
    //             console.log('ERROR', ex);
    //         }
    //     }
    // }

    // loginStartPost(config: ILoginOptions): Promise<LoginStartResponse> {
    //     let http = new HttpClient();

    //     // login(node: HTMLElement, provider: string, redirectUrl: string, stayLoggedIn: string): void {
    //     let html = new Html();
    //     let t = html.tagMaker();
    //     let form = t('form');
    //     let input = t('input');

    //     let query = {
    //         provider: config.provider,
    //         redirectUrl: config.redirectUrl,
    //         stayLoggedIn: config.stayLoggedIn ? 'true' : 'false'
    //     };
    //     return http.request({
    //         method: 'POST',
    //         url: [this.config.baseUrl, endpoints.loginStart].join('/'),
    //         header: {
    //             'Content-Type': 'application/json',
    //             'Accept': 'application/json'
    //         },
    //         data: JSON.stringify(query)
    //     })
    //         .then((result) => {
    //             switch (result.status) {
    //                 case 400:
    //                     var error;
    //                     try {
    //                         error = <Auth2ApiErrorInfo>JSON.parse(result.response);
    //                     } catch (ex) {
    //                         console.error(ex);
    //                         throw new AuthError({
    //                             code: 'decode-error',
    //                             message: 'Error decoding JSON error response',
    //                             detail: ex.message
    //                         });
    //                     }
    //                     console.error(error);
    //                     throw new AuthError({
    //                         code: String(error.appCode),
    //                         message: error.message || error.appError
    //                     });
    //                 case 200:
    //                     try {
    //                         return <LoginStartResponse>JSON.parse(result.response);
    //                     } catch (ex) {
    //                         throw new AuthError({
    //                             code: 'decode-error',
    //                             message: 'Error decoding JSON login start response',
    //                             detail: ex.message
    //                         });
    //                     }
    //                 default:
    //                     throw new AuthError({
    //                         code: 'unexpected-response-status',
    //                         message: 'Unexpected response status: ' + String(result.status)
    //                     })
    //             }
    //         })
    //         .catch((err) => {
    //             throw new AuthError({
    //                 code: String(err.appCode),
    //                 message: err.message || err.appError
    //             });
    //         });

    // }

    // loginStart(config: ILoginOptions): Promise<LoginStartResponse> {
    //     let http = new HttpClient();

    //     let url = new URL(this.makePath([endpoints.loginStart]));
    //     let query = new URLSearchParams();
    //     query.append('provider', config.provider);
    //     query.append('clientstate', config.state);
    //     query.append('stayLoggedIn', config.stayLoggedIn ? 'true' : 'false');

    //     return http.request({
    //         method: 'GET',
    //         url: url.toString(),
    //         header: {
    //         },
    //         data: JSON.stringify(query)
    //     })
    //         .then((result) => {
    //             switch (result.status) {
    //                 case 400:
    //                     var error;
    //                     try {
    //                         error = <Auth2ApiErrorInfo>JSON.parse(result.response);
    //                     } catch (ex) {
    //                         console.error(ex);
    //                         throw new AuthError({
    //                             code: 'decode-error',
    //                             message: 'Error decoding JSON error response',
    //                             detail: ex.message
    //                         });
    //                     }
    //                     console.error(error);
    //                     throw new AuthError({
    //                         code: String(error.appCode),
    //                         message: error.message || error.appError
    //                     });
    //                 case 200:
    //                     try {
    //                         return <LoginStartResponse>JSON.parse(result.response);
    //                     } catch (ex) {
    //                         throw new AuthError({
    //                             code: 'decode-error',
    //                             message: 'Error decoding JSON login start response',
    //                             detail: ex.message
    //                         });
    //                     }
    //                 default:
    //                     throw new AuthError({
    //                         code: 'unexpected-response-status',
    //                         message: 'Unexpected response status: ' + String(result.status)
    //                     })
    //             }
    //         })
    //         .catch((err) => {
    //             throw new AuthError({
    //                 code: String(err.appCode),
    //                 message: err.message || err.appError
    //             });
    //         });

    // }

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
    throws NoTokenProvidedException, InvalidTokenException, AuthStorageException,
			UnLinkFailedException, DisabledUserException, NoSuchIdentityException
    */

    decodeError(result: Response): Auth2ApiErrorInfo {
        var error;
        try {
            return <Auth2ApiErrorInfo>JSON.parse(result.response);
        } catch (ex) {
            console.error(ex);
            throw new AuthError({
                code: 'decode-error',
                message: 'Error decoding JSON error response',
                detail: ex.message
            });
        }
    }

    removeLink(token: string, config: UnlinkOptions): Promise<void> {
        let httpClient = new HttpClient();

        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            header: {
                Authorization: token,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            url: this.makePath([endpoints.linkRemove, config.identityId])
        })
            .then((result: Response) => {
                if (result.status === 204) {
                    // happy ending :)
                    return;
                } else if (result.status === 500) {
                    throw new AuthError({
                        code: 'server-error',
                        message: 'An error occurred in the server',
                        detail: result.response
                    });
                } else {
                    // TODO: should we distinguish error conditions or let the caller do so?
                    // Maybe we should throw a basic error type, like 
                    // AuthorizationError - for 401s
                    // ClientError - for 400s
                    // ServerError - for 500s
                    switch (result.status) {
                        case 401:
                        case 400:
                            let error = this.decodeError(result);
                            throw new AuthError({
                                code: String(error.appCode),
                                message: error.message || error.appError
                            });
                        default:
                            throw new AuthError({
                                code: 'unexpected-response-status',
                                message: 'Unexpected response status: ' + String(result.status)
                            });
                    }
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

    // getAccount(token: string): Promise<Account> {
    //     let httpClient = new HttpClient();
    //     return httpClient.request({
    //         method: 'GET',
    //         withCredentials: true,
    //         url: this.config.baseUrl + '/' + endpoints.apiMe,
    //         header: {
    //             Authorization: token,
    //             Accept: 'application/json'
    //         }
    //     })
    //         .then(function (result) {
    //             console.log('result', result);
    //             try {
    //                 return JSON.parse(result.response);
    //             } catch (ex) {
    //                 console.error('ERROR getting user account info', result);
    //                 throw new Error('Cannot parse "me" result:' + ex.message);
    //             }
    //         });
    // }

    getMe(token: string): Promise<Account> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.config.baseUrl + '/' + endpoints.apiMe,
            header: {
                Authorization: token,
                Accept: 'application/json'
            }
        })
            .then((result) => {
                try {
                    return JSON.parse(result.response);
                } catch (ex) {
                    console.error('ERROR getting user account info', result);
                    throw new Error('Cannot parse "me" result:' + ex.message);
                }
            });
    }

    putMe(token: string, data: PutMeInput) : Promise<any> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'PUT',
            withCredentials: true,
            url: this.makePath(endpoints.me),
            header: {
                Authorization: token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
        .then((result) => {
            this.processResult(result);
            return null;
        });
    }

    makePath(path: Array<string> | string): string {
        if (typeof path === 'string') {
            return [this.config.baseUrl].concat([path]).join('/');
        }
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

    createToken(token: string, create: CreateTokenInput): Promise<NewTokenInfo> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.makePath(endpoints.tokensCreate),
            header: {
                Authorization: token,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(create)
        })
            .then(function (result) {
                if (result.status === 200) {
                    let data = <NewTokenInfo>JSON.parse(result.response);
                    return data;
                } else if (result.status === 500) {
                    throw new AuthError({
                        code: 'server-error',
                        message: 'An error occurred in the server',
                        detail: result.response
                    });
                } else {
                    // TODO: should we distinguish error conditions or let the caller do so?
                    // Maybe we should throw a basic error type, like 
                    // AuthorizationError - for 401s
                    // ClientError - for 400s
                    // ServerError - for 500s
                    switch (result.status) {
                        case 401:
                        case 400:
                            let error = this.decodeError(result);
                            throw new AuthError({
                                code: String(error.appCode),
                                message: error.message || error.appError
                            });
                        default:
                            throw new AuthError({
                                code: 'unexpected-response-status',
                                message: 'Unexpected response status: ' + String(result.status)
                            });
                    }
                }
            });
    }

    // Note that the auth2 service will have set cookies 
    // in the browser which are implicitly sent.
    getLoginChoice(): Promise<LoginChoice> {
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
                    if (data.redirecturl) {
                        var url = new URL(data.redirecturl);
                        if (url.search && url.search.length > 0) {
                            var params = new URLSearchParams(url.search.slice(1));
                            data.state = JSON.parse(params.get('state'));
                        }
                    }
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

    loginPick(arg: LoginPick): Promise<any> {
        let data = {
            id: arg.identityId,
            linkall: arg.linkAll,
            policy_ids: arg.agreements.map((a) => {
                return [a.id, a.version].join('.');
            })
        };
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.makePath([endpoints.loginPick]),
            data: JSON.stringify(data),
            header: {
                Authorization: arg.token,
                'Content-Type': 'application/json',
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
            url: this.makePath(endpoints.linkPick),
            data: JSON.stringify(data),
            header: {
                Authorization: token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
            .then(function (result) {
                if (result.status === 204) {
                    // happy ending :)
                    return;
                } else if (result.status === 500) {
                    throw new AuthError({
                        code: 'server-error',
                        message: 'An error occurred in the server',
                        detail: result.response
                    });
                } else {
                    // TODO: should we distinguish error conditions or let the caller do so?
                    // Maybe we should throw a basic error type, like 
                    // AuthorizationError - for 401s
                    // ClientError - for 400s
                    // ServerError - for 500s
                    switch (result.status) {
                        case 401:
                        case 400:
                            let error = this.decodeError(result);
                            throw new AuthError({
                                code: String(error.appCode),
                                message: error.message || error.appError
                            });
                        default:
                            throw new AuthError({
                                code: 'unexpected-response-status',
                                message: 'Unexpected response status: ' + String(result.status)
                            });
                    }
                }
            });
    }

    processResult(result : any) : any {
        if (result.status === 200) {
            switch (result.header['Content-Type']) {
                case 'application/json':
                    return JSON.parse(result.response);
                case 'text/plain':
                    return result.response;
            }
        } else if (result.status === 204) {
            return;
        } else if (result.status === 500) {
            throw new AuthError({
                code: 'server-error',
                message: 'An error occurred in the server',
                detail: result.response
            });
        } else {
            // TODO: should we distinguish error conditions or let the caller do so?
            // Maybe we should throw a basic error type, like 
            // AuthorizationError - for 401s
            // ClientError - for 400s
            // ServerError - for 500s
            switch (result.status) {
                case 401:
                case 400:
                    let error = this.decodeError(result);
                    throw new AuthError({
                        code: String(error.appCode),
                        message: error.message || error.appError
                    });
                default:
                    throw new AuthError({
                        code: 'unexpected-response-status',
                        message: 'Unexpected response status: ' + String(result.status)
                    });
            }
        }
    }

    userSearch(token: string, search: UserSearchInput): Promise<any> {
        let httpClient = new HttpClient();
        let url = new URL(this.makePath([endpoints.userSearch, search.prefix]));
        let query = new URLSearchParams();
        query.append('fields', search.fields);
        url.search = query.toString();

        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: url.toString(),
            header: {
                Authorization: token,
                'Accept': 'application/json'
            }
        })
            .then((result) => {
                if (result.status === 200) {
                    let data = JSON.parse(result.response);
                    return data;
                } else if (result.status === 500) {
                    throw new AuthError({
                        code: 'server-error',
                        message: 'An error occurred in the server',
                        detail: result.response
                    });
                } else {
                    // TODO: should we distinguish error conditions or let the caller do so?
                    // Maybe we should throw a basic error type, like 
                    // AuthorizationError - for 401s
                    // ClientError - for 400s
                    // ServerError - for 500s
                    switch (result.status) {
                        case 401:
                        case 400:
                            let error = this.decodeError(result);
                            throw new AuthError({
                                code: String(error.appCode),
                                message: error.message || error.appError
                            });
                        default:
                            throw new AuthError({
                                code: 'unexpected-response-status',
                                message: 'Unexpected response status: ' + String(result.status)
                            });
                    }
                }
            })

    }

    adminUserSearch(token: string, search: UserSearchInput): Promise<any> {
        let httpClient = new HttpClient();
        let url = new URL(this.makePath([endpoints.adminUserSearch, search.prefix]));
        let query = new URLSearchParams();
        query.append('fields', search.fields);
        url.search = query.toString();

        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: url.toString(),
            header: {
                Authorization: token,
                Accept: 'application/json'
            }
        })
            .then((result) => {
                if (result.status === 200) {
                    let data = JSON.parse(result.response);
                    return data;
                } else if (result.status === 500) {
                    throw new AuthError({
                        code: 'server-error',
                        message: 'An error occurred in the server',
                        detail: result.response
                    });
                } else {
                    // TODO: should we distinguish error conditions or let the caller do so?
                    // Maybe we should throw a basic error type, like 
                    // AuthorizationError - for 401s
                    // ClientError - for 400s
                    // ServerError - for 500s
                    switch (result.status) {
                        case 401:
                        case 400:
                            let error = this.decodeError(result);
                            throw new AuthError({
                                code: String(error.appCode),
                                message: error.message || error.appError
                            });
                        default:
                            throw new AuthError({
                                code: 'unexpected-response-status',
                                message: 'Unexpected response status: ' + String(result.status)
                            });
                    }
                }
            })
    }

     getAdminUser(token: string, username: string): Promise<any> {
        let httpClient = new HttpClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.makePath([endpoints.adminUser, username]),
            header: {
                Authorization: token,
                Accept: 'application/json'
            }
        })
            .then((result) => {
                return this.processResult(result);
            });
    }

}