import { Cookie, CookieManager } from './Cookie'
import { Html } from './Html'
import { HttpQuery } from './HttpUtils'
import { Response } from './HttpClient'
import { AuthClient } from './Auth2Client';
import * as Promise from 'bluebird';
import { AuthError, AuthErrorInfo} from './Auth2Error';

interface AuthProvider {
    id: string,
    label: string,
    logoutUrl: string
}

export interface CookieConfig {
    name: string,
    domain: string
}

export interface AuthConfig {
    cookieName: string,
    extraCookies: Array<CookieConfig>
    baseUrl: string
}


interface AuthEndpoints {
    root: string,
    tokenInfo: string,
    apiMe: string,
    me: string,
    loginStart: string,
    loginChoice: string,
    loginCreate: string,
    loginUsernameSuggest: string,
    loginPick: string,
    loginCancel: string,
    logout: string,
    linkStart: string,
    linkCancel: string,
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
    root: '',
    tokenInfo: 'api/V2/token',
    apiMe: 'api/V2/me',
    me: 'me',
    loginStart: 'login/start',
    logout: 'logout',
    loginChoice: 'login/choice',
    loginCreate: 'login/create',
    loginUsernameSuggest: 'login/suggestname',
    loginPick: 'login/pick',
    loginCancel: 'login/cancel',
    linkStart: 'link/start',
    linkCancel: 'link/cancel',
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

export interface RootInfo {
    version: string,
    servertime: number
}

export interface ILoginCreateOptions {
    id: string,
    user: string,
    display: string,
    email: string,
    linkall: boolean,
    policyids: Array<UserPolicy>
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
    redirecturl: string,
    token: ITokenInfo
}

export interface Tokens {
    tokens: Array<ITokenInfo>,
    dev: boolean,
    serv: boolean
}

export interface CreateChoice {
    id: string,
    availablename: string,
    provusername: string,
    provfullname: string,
    provemail: string
}

export interface LoginChoice {
    id: string,
    provusernames: Array<string>
    user: string,
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
    appcode: number,
    apperror: string,
    message: string,
    httpcode: number,
    httpstatus: string,
    callid: string,
    time: number
}

export interface PolicyAgreement {
    id: string,
    version: number
}

export interface LoginPick {
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
        return [
            {
                id: 'Globus',
                label: 'Globus',
                logoutUrl: 'https://www.globus.org/app/logout'
            },
            {
                id: 'Google',
                label: 'Google',
                logoutUrl: 'https://accounts.google.com/Logout'
            }
        ];

    }
    getProvider(providerId: string): AuthProvider {
        var providers = this.getProviders();
        return providers.filter((provider) => {
            return (provider.id === providerId);
        })[0];
    }

    root() : Promise<RootInfo> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            header: {
                Accept: 'application/json'
            },
            url: this.makePath([endpoints.root])
        })
            .then((result: Response) => {
                return this.processResult(result, 200);
            });
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

        url.search = new HttpQuery({
            state: JSON.stringify(config.state)
        }).toString();

        let query = {
            provider: config.provider,
            redirecturl: url.toString(),
            stayloggedin: config.stayLoggedIn ? 'true' : 'false'
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
                    name: 'redirecturl',
                    value: query.redirecturl
                }, [])
            ]);
        var donorNode = document.createElement('div');

        donorNode.innerHTML = content;
        document.body.appendChild(donorNode);

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
        let httpClient = new AuthClient();

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
                return this.processResult(result, 204);
            });
    }


    revokeToken(token: string, tokenid: string): Promise<any> {
        let httpClient = new AuthClient();

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
                return this.processResult(result, 204);
            });
    }

    getTokenInfo(token: string): Promise<ITokenInfo> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'GET',
            url: this.makePath([endpoints.tokenInfo]),
            withCredentials: true,
            header: {
                Authorization: token
            }
        })
            .then((result: Response) => {
                return <ITokenInfo>this.processResult(result, 200);
            });
    }

    getMe(token: string): Promise<Account> {
        let httpClient = new AuthClient();
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
                return <Account>this.processResult(result, 200);
            });
    }

    putMe(token: string, data: PutMeInput): Promise<any> {
        let httpClient = new AuthClient();
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
                this.processResult(result, 204);
            });
    }

    makePath(path: Array<string> | string): string {
        if (typeof path === 'string') {
            return [this.config.baseUrl].concat([path]).join('/');
        }
        return [this.config.baseUrl].concat(path).join('/');
    }

    getTokens(token: string): Promise<Tokens> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.makePath([endpoints.tokens]),
            header: {
                Authorization: token,
                Accept: 'application/json'
            }
        })
            .then((result) => {
                return <Tokens>this.processResult(result, 200);
            });
    }

    createToken(token: string, create: CreateTokenInput): Promise<NewTokenInfo> {
        let httpClient = new AuthClient();
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
            .then((result) => {
                return <NewTokenInfo>this.processResult(result, 200);
            });
    }

    // Note that the auth2 service will have set cookies 
    // in the browser which are implicitly sent.
    getLoginChoice(): Promise<LoginChoice> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.makePath(endpoints.loginChoice),
            header: {
                Accept: 'application/json'
            }
        })
            .then((result) => {
                return <LoginChoice>this.processResult(result, 200);
            });
    }

    loginCancel(): Promise<null> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'DELETE',
            withCredentials: true,
            url: this.makePath(endpoints.loginCancel),
            header: {
                Accept: 'application/json'
            }
        })
        .then((result) => {
            return this.processResult(result, 204);
        });
    }

    linkCancel(): Promise<null> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'DELETE',
            withCredentials: true,
            url: this.makePath(endpoints.linkCancel),
            header: {
                Acccept: 'application/json'
            }
        })
        .then((result) => {
            return this.processResult(result, 204);
        });
    }

    loginPick(arg: LoginPick): Promise<any> {
        let data = {
            id: arg.identityId,
            linkall: arg.linkAll,
            policyids: arg.agreements.map((a) => {
                return [a.id, a.version].join('.');
            })
        };
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.makePath([endpoints.loginPick]),
            data: JSON.stringify(data),
            header: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
            .then((result) => {
                return this.processResult(result, 200);
            });
    }

    loginCreate(data: ILoginCreateOptions): Promise<any> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'POST',
            withCredentials: true,
            url: this.makePath(endpoints.loginCreate),
            data: JSON.stringify(data),
            header: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
            .then((result) => {
                return this.processResult(result, 201);
            });
    }


    loginUsernameSuggest(username: string): Promise<any> {
        let httpClient = new AuthClient();
        return httpClient.request({
            method: 'GET',
            withCredentials: true,
            url: this.makePath([endpoints.loginUsernameSuggest, username]),
            header: {
                Accept: 'application/json'
            }
        })
            .then((result) => {
                return this.processResult(result, 200);
            });
    }

    getLinkChoice(token: string) {
        let httpClient = new AuthClient();
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
            .then((result) => {
                return this.processResult(result, 200);
            });
    }

    linkPick(token: string, identityId: string): Promise<any> {
        let data = {
            id: identityId
        };
        let httpClient = new AuthClient();
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
            .then((result) => {
                return this.processResult(result, 204);
            });
    }

    processResult(result: any, expectedResponse: number): any {
        if (result.status >= 200 && result.status < 300) {
            if (expectedResponse !== result.status) {
                throw new AuthError({
                    code: 'unexpected-response-code',
                    message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                });
            }
            if (result.status === 200 || result.status === 201) {
                switch (result.header['Content-Type']) {
                    case 'application/json':
                        return JSON.parse(result.response);
                    case 'text/plain':
                        return result.response;
                }
            } else if (result.status === 204) {
                return null;
            } else {
                throw new AuthError({
                    code: 'unexpected-response-code',
                    message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                });
            }
        } else {
            // TODO: should we distinguish error conditions or let the caller do so?
            // Maybe we should throw a basic error type, like 
            // AuthorizationError - for 401s
            // ClientError - for 400s
            // ServerError - for 500s
            var errorData;
            var errorText = result.response;
            try {
                switch (result.header['Content-Type']) {
                    case 'application/json':
                        errorData = JSON.parse(errorText).error;
                        break;
                    default:
                        errorData = {
                            code: 'unknown',
                            message: 'Unknown error',
                            text: errorText
                        };
                }
            } catch (ex) {
                throw new AuthError({
                    code: 'decoding-error',
                    message: 'Error decoding error message',
                    detail: 'Original error code: ' + result.status,
                    data: {
                        text: errorText
                    }
                });
            }
            let code = errorData.code || errorData.appcode || errorData.httpcode || 0;
            throw new AuthError({
                    code: String(code),
                    status: result.status,
                    message: errorData.message || errorData.apperror,
                    data: errorData
                });

            // switch (result.status) {
            //     case 401:
            //     case 400:
            //         let error = this.decodeError(result);
            //         throw new AuthError({
            //             code: String(errorData.error.appCode),
            //             message: errorData.error.message || errorData.error.appError,
            //             data: errorData
            //         });
            //     case 500:
            //         let error = this.decodeError(result);
            //         throw new AuthError({
            //             code: String(errorData.error.appCode),
            //             message: errorData.error.message || errorData.error.appError,
            //             data: errorData
            //         });
            //     default:
            //         throw new AuthError({
            //             code: 'unexpected-response-status',
            //             message: 'Unexpected response status: ' + String(result.status),
            //             data: errorData
            //         });
            // }
        }
    }


    userSearch(token: string, search: UserSearchInput): Promise<any> {
        let httpClient = new AuthClient();
        let url = new URL(this.makePath([endpoints.userSearch, search.prefix]));
        url.search = new HttpQuery({
            fields: search.fields
        }).toString();

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
                return this.processResult(result,200);
            })
    }

    adminUserSearch(token: string, search: UserSearchInput): Promise<any> {
        let httpClient = new AuthClient();
        let url = new URL(this.makePath([endpoints.adminUserSearch, search.prefix]));
        url.search = new HttpQuery({
            fields: search.fields
        }).toString();

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
                return this.processResult(result, 200);
            })
    }

    getAdminUser(token: string, username: string): Promise<any> {
        let httpClient = new AuthClient();
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
                return this.processResult(result, 200);
            });
    }

}