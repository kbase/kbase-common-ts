define(["require", "exports", "./Html", "./HttpUtils", "./HttpClient", "./Auth2Client", "./Auth2Error"], function (require, exports, Html_1, HttpUtils_1, HttpClient_1, Auth2Client_1, Auth2Error_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var endpoints = {
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
        tokensRevokeAll: 'tokens/revokeall',
        userSearch: 'api/V2/users/search',
        adminUserSearch: 'api/V2/admin/search',
        adminUser: 'api/V2/admin/user'
    };
    var Auth2 = (function () {
        function Auth2(config) {
            this.config = config;
        }
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
        Auth2.prototype.root = function () {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    Accept: 'application/json'
                }),
                url: this.makePath([endpoints.root])
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.loginStart = function (config) {
            var state = JSON.stringify(config.state);
            var html = new Html_1.Html();
            var t = html.tagMaker();
            var form = t('form');
            var input = t('input');
            var button = t('button');
            var search = new HttpUtils_1.HttpQuery({
                state: JSON.stringify(config.state)
            }).toString();
            var url = document.location.origin + '?' + search;
            var query = {
                provider: config.provider,
                redirecturl: url,
                stayloggedin: config.stayLoggedIn ? 'true' : 'false'
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
                    name: 'redirecturl',
                    value: query.redirecturl
                }, [])
            ]);
            var donorNode = document.createElement('div');
            donorNode.innerHTML = content;
            document.body.appendChild(donorNode);
            document.getElementById(formId).submit();
        };
        Auth2.prototype.linkStart = function (token, config) {
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
                }, []),
                input({
                    type: 'hidden',
                    name: 'token',
                    value: token
                })
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
                throw new Auth2Error_1.AuthError({
                    code: 'decode-error',
                    message: 'Error decoding JSON error response',
                    detail: ex.message
                });
            }
        };
        Auth2.prototype.removeLink = function (token, config) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json',
                    accept: 'application/json'
                }),
                url: this.makePath([endpoints.linkRemove, config.identityId])
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.logout = function (token) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    'content-type': 'application/json'
                }),
                url: this.makePath(endpoints.logout)
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.revokeToken = function (token, tokenid) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json'
                }),
                url: this.makePath([endpoints.tokensRevoke, tokenid])
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.revokeAllTokens = function (token) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json'
                }),
                url: this.makePath(endpoints.tokensRevokeAll)
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.getTokenInfo = function (token) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                url: this.makePath([endpoints.tokenInfo]),
                withCredentials: true,
                header: new HttpClient_1.HttpHeader({
                    authorization: token
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getMe = function (token) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.apiMe),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.putMe = function (token, data) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'PUT',
                withCredentials: true,
                url: this.makePath(endpoints.me),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json',
                    'content-type': 'application/json'
                }),
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
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.tokens]),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.createToken = function (token, create) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath(endpoints.tokens),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json',
                    'content-type': 'application/json'
                }),
                data: JSON.stringify(create)
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getLoginChoice = function () {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.loginChoice),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.loginCancel = function () {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                url: this.makePath(endpoints.loginCancel),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.linkCancel = function () {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                url: this.makePath(endpoints.linkCancel),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
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
                policyids: arg.agreements.map(function (a) {
                    return [a.id, a.version].join('.');
                })
            };
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath([endpoints.loginPick]),
                data: JSON.stringify(data),
                header: new HttpClient_1.HttpHeader({
                    'content-type': 'application/json',
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.loginCreate = function (data) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath(endpoints.loginCreate),
                data: JSON.stringify(data),
                header: new HttpClient_1.HttpHeader({
                    'content-type': 'application/json',
                    'accept': 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 201);
            });
        };
        Auth2.prototype.loginUsernameSuggest = function (username) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.loginUsernameSuggest, username]),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getLinkChoice = function (token) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath(endpoints.linkChoice),
                header: new HttpClient_1.HttpHeader({
                    accept: 'application/json',
                    authorization: token
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            })
                .then(function (response) {
                if (response.haslinks) {
                    return {
                        id: response.idents[0].id,
                        expires: response.expires,
                        cancelurl: response.cancelurl,
                        pickurl: response.pickurl,
                        canlink: true,
                        provider: response.provider,
                        provusername: response.idents[0].provusername,
                        linkeduser: null,
                        user: response.user
                    };
                }
                else {
                    return {
                        id: response.linked[0].id,
                        expires: response.expires,
                        cancelurl: response.cancelurl,
                        pickurl: response.pickurl,
                        canlink: false,
                        provider: response.provider,
                        provusername: response.linked[0].provusername,
                        linkeduser: response.linked[0].user,
                        user: response.user
                    };
                }
            });
        };
        Auth2.prototype.linkPick = function (token, identityId) {
            var _this = this;
            var data = {
                id: identityId
            };
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'POST',
                withCredentials: true,
                url: this.makePath(endpoints.linkPick),
                data: JSON.stringify(data),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    'content-type': 'application/json',
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 204);
            });
        };
        Auth2.prototype.processResult = function (result, expectedResponse) {
            if (result.status >= 200 && result.status < 300) {
                if (expectedResponse !== result.status) {
                    throw new Auth2Error_1.AuthError({
                        code: 'unexpected-response-code',
                        message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                    });
                }
                if (result.status === 200 || result.status === 201) {
                    switch (result.header.getContentType().mediaType) {
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
                    throw new Auth2Error_1.AuthError({
                        code: 'unexpected-response-code',
                        message: 'Unexpected response code; expected ' + String(expectedResponse) + ', received ' + String(result.status)
                    });
                }
            }
            else {
                var auth2ErrorData, errorResponse;
                var errorText = result.response;
                try {
                    switch (result.header.getContentType().mediaType) {
                        case 'application/json':
                            auth2ErrorData = JSON.parse(errorText);
                            break;
                        default:
                            if (result.status === 502) {
                                errorResponse = {
                                    code: 'proxy-error',
                                    status: result.status,
                                    message: 'The auth service could not be contacted due to a proxy error (502)',
                                    detail: 'An error returned by the proxy service indicates that the auth service is not operating corectly',
                                    data: {
                                        text: result.response
                                    }
                                };
                            }
                            else {
                                errorResponse = {
                                    code: 'invalid-content-type',
                                    status: result.status,
                                    message: 'An invalid content type was returned',
                                    detail: 'An invalid content was returned',
                                    data: {
                                        text: result.response,
                                        contentType: result.header.getContentType().mediaType,
                                        status: result.status
                                    }
                                };
                            }
                    }
                }
                catch (ex) {
                    throw new Auth2Error_1.AuthError({
                        code: 'decoding-error',
                        status: result.status,
                        message: 'Error decoding error message',
                        detail: 'Original error code: ' + result.status,
                        data: {
                            text: errorText
                        }
                    });
                }
                if (auth2ErrorData) {
                    var code = auth2ErrorData.error.code || auth2ErrorData.error.appcode || auth2ErrorData.error.httpcode || 0;
                    throw new Auth2Error_1.AuthError({
                        code: String(code),
                        status: result.status,
                        message: auth2ErrorData.error.message || auth2ErrorData.error.apperror,
                        data: auth2ErrorData
                    });
                }
                throw new Auth2Error_1.AuthError(errorResponse);
            }
        };
        Auth2.prototype.userSearch = function (token, searchInput) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            var path = this.makePath([endpoints.userSearch, searchInput.prefix]);
            var search = new HttpUtils_1.HttpQuery({
                fields: searchInput.fields
            }).toString();
            var url = path + '?' + search;
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: url,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.adminUserSearch = function (token, searchInput) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            var search = new HttpUtils_1.HttpQuery({
                fields: searchInput.fields
            }).toString();
            var url = this.makePath([endpoints.adminUserSearch, searchInput.prefix]) + '?' + search;
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: url,
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        Auth2.prototype.getAdminUser = function (token, username) {
            var _this = this;
            var httpClient = new Auth2Client_1.AuthClient();
            return httpClient.request({
                method: 'GET',
                withCredentials: true,
                url: this.makePath([endpoints.adminUser, username]),
                header: new HttpClient_1.HttpHeader({
                    authorization: token,
                    accept: 'application/json'
                })
            })
                .then(function (result) {
                return _this.processResult(result, 200);
            });
        };
        return Auth2;
    }());
    exports.Auth2 = Auth2;
});
