var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "./Cookie", "./Html", "./HttpUtils", "./HttpClient"], function (require, exports, Cookie_1, Html_1, HttpUtils_1, HttpClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var endpoints = {
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
        linkChoice: 'link/choice',
        linkPick: 'link/pick',
        linkRemove: 'me/unlink',
        tokens: 'tokens',
        tokensRevoke: 'tokens/revoke',
        tokensCreate: 'tokens/create',
        userSearch: 'api/V2/users/search',
        adminUserSearch: 'api/V2/admin/search',
        adminUser: 'api/V2/admin/user'
    };
    var AuthError = (function (_super) {
        __extends(AuthError, _super);
        function AuthError(errorInfo) {
            var _this = _super.call(this, errorInfo.message) || this;
            Object.setPrototypeOf(_this, AuthError.prototype);
            _this.name = 'AuthError';
            _this.code = errorInfo.code;
            _this.message = errorInfo.message;
            _this.detail = errorInfo.detail;
            _this.data = errorInfo.data;
            _this.stack = new Error().stack;
            return _this;
        }
        return AuthError;
    }(Error));
    exports.AuthError = AuthError;
    var Auth2 = (function () {
        function Auth2(config) {
            this.config = config;
            this.cookieManager = new Cookie_1.CookieManager();
        }
        Auth2.prototype.getAuthCookie = function () {
            return this.cookieManager.getItem(this.config.cookieName);
        };
        Auth2.prototype.getProviders = function () {
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
        };
        Auth2.prototype.getProvider = function (providerId) {
            var providers = this.getProviders();
            return providers.filter(function (provider) {
                return (provider.id === providerId);
            })[0];
        };
        Auth2.prototype.loginStart = function (config) {
            var state = JSON.stringify(config.state);
            var html = new Html_1.Html();
            var t = html.tagMaker();
            var form = t('form');
            var input = t('input');
            var button = t('button');
            var url = new URL(document.location.origin);
            url.search = new HttpUtils_1.HttpQuery({
                state: JSON.stringify(config.state)
            }).toString();
            var query = {
                provider: config.provider,
                redirectUrl: url.toString(),
                stayLoggedIn: config.stayLoggedIn ? 'true' : 'false'
            };
            var formId = html.genId();
            var content = form({
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
            document.getElementById(formId).submit();
        };
        Auth2.prototype.linkPost = function (config) {
            var html = new Html_1.Html();
            var t = html.tagMaker();
            var form = t('form');
            var input = t('input');
            var query = {
                provider: config.provider
            };
            var formId = html.genId();
            var content = form({
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
            document.getElementById(formId).submit();
        };
        Auth2.prototype.decodeError = function (result) {
            var error;
            try {
                return JSON.parse(result.response);
            }
            catch (ex) {
                console.error(ex);
                throw new AuthError({
                    code: 'decode-error',
                    message: 'Error decoding JSON error response',
                    detail: ex.message
                });
            }
        };
        Auth2.prototype.removeLink = function (token, config) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
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
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.revokeToken = function (token, tokenid) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                header: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                },
                url: this.config.baseUrl + '/' + endpoints.tokensRevoke + '/' + tokenid
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.getTokenInfo = function (token) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                url: this.makePath([endpoints.tokenInfo]),
                withCredentials: true,
                header: {
                    Authorization: token
                }
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getMe = function (token) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.config.baseUrl + '/' + endpoints.apiMe,
                header: {
                    Authorization: token,
                    Accept: 'application/json'
                }
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.putMe = function (token, data) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
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
                .then(function (result) {
                _this.processResult(result, 204);
            });
        };
        Auth2.prototype.makePath = function (path) {
            if (typeof path === 'string') {
                return [this.config.baseUrl].concat([path]).join('/');
            }
            return [this.config.baseUrl].concat(path).join('/');
        };
        Auth2.prototype.getTokens = function (token) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
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
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.createToken = function (token, create) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
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
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getLoginChoice = function () {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.loginChoice),
                header: {
                    Accept: 'application/json'
                }
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.loginCancel = function () {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                url: this.makePath(endpoints.loginCancel)
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.loginPick = function (arg) {
            var _this = this;
            var data = {
                id: arg.identityId,
                linkall: arg.linkAll,
                policy_ids: arg.agreements.map(function (a) {
                    return [a.id, a.version].join('.');
                })
            };
            var httpClient = new HttpClient_1.HttpClient();
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
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.loginCreate = function (data) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
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
                .then(function (result) {
                return _this.processResult(result, 201);
            });
        };
        Auth2.prototype.loginUsernameSuggest = function (username) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.loginUsernameSuggest, username]),
                header: {
                    Accept: 'application/json'
                }
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getLinkChoice = function (token) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
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
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.linkPick = function (token, identityId) {
            var _this = this;
            var data = {
                id: identityId
            };
            var httpClient = new HttpClient_1.HttpClient();
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
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.processResult = function (result, expectedResponse) {
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
                }
                else if (result.status === 204) {
                    return null;
                }
                else {
                    throw new AuthError({
                        code: 'unexpected-response-code',
                        message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                    });
                }
            }
            else {
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
                }
                catch (ex) {
                    throw new AuthError({
                        code: 'decoding-error',
                        message: 'Error decoding error message',
                        detail: 'Original error code: ' + result.status,
                        data: {
                            text: errorText
                        }
                    });
                }
                var code = errorData.code || errorData.appCode || errorData.httpCode || 0;
                throw new AuthError({
                    code: String(code),
                    status: result.status,
                    message: errorData.message || errorData.appError,
                    data: errorData
                });
            }
        };
        Auth2.prototype.userSearch = function (token, search) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            var url = new URL(this.makePath([endpoints.userSearch, search.prefix]));
            url.search = new HttpUtils_1.HttpQuery({
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
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.adminUserSearch = function (token, search) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            var url = new URL(this.makePath([endpoints.adminUserSearch, search.prefix]));
            url.search = new HttpUtils_1.HttpQuery({
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
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getAdminUser = function (token, username) {
            var _this = this;
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.adminUser, username]),
                header: {
                    Authorization: token,
                    Accept: 'application/json'
                }
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        return Auth2;
    }());
    exports.Auth2 = Auth2;
});
