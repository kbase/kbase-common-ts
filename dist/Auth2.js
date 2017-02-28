define(["require", "exports", "./Cookie", "./Html", "./HttpClient"], function (require, exports, Cookie_1, Html_1, HttpClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Auth2 = (function () {
        function Auth2(config) {
            this.config = config;
            this.cookieManager = new Cookie_1.CookieManager();
        }
        Auth2.prototype.getAuthCookie = function () {
            return this.cookieManager.getItem(this.config.cookieName);
        };
        Auth2.prototype.getProviders = function () {
            return this.config.providers;
        };
        Auth2.prototype.setLastProvider = function (providerId) {
            this.cookieManager.setItem(new Cookie_1.Cookie('last-provider-used')
                .setValue(providerId)
                .setMaxAge(Infinity)
                .setPath('/'));
        };
        Auth2.prototype.login = function (config) {
            var html = new Html_1.Html();
            var t = html.tag;
            var form = t('form');
            var input = t('input');
            this.setLastProvider(config.provider);
            var query = {
                provider: config.provider,
                redirectUrl: config.redirectUrl,
                stayLoggedIn: config.stayLoggedIn ? 'true' : 'false'
            };
            var formId = html.genId();
            var content = form({
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
            document.getElementById(formId).submit();
        };
        Auth2.prototype.logout = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
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
                .then(function (result) {
                switch (result.status) {
                    case 200:
                        return {
                            status: 'ok'
                        };
                    default:
                        return {
                            status: 'error',
                            message: 'Unexpected response logging out',
                            statusCode: result.status
                        };
                }
            });
        };
        Auth2.prototype.introspectToken = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                url: this.config.endpoints.introspect,
                header: {
                    Authorization: token
                }
            })
                .then(function (result) {
                try {
                    var tokenInfo = JSON.parse(result.response);
                    return tokenInfo;
                }
                catch (ex) {
                    console.error('ERROR', result);
                    throw new Error('Cannot parse token introspection result: ' + ex.message);
                }
            });
        };
        Auth2.prototype.getLoginChoice = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
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
                }
                catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    };
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
                        };
                }
            });
        };
        Auth2.prototype.pickAccount = function (token, identityId) {
            var data = {
                token: token,
                id: identityId
            };
            var httpClient = new HttpClient_1.HttpClient();
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
                }
                catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    };
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
                        };
                }
            });
        };
        Auth2.prototype.loginCreate = function (data) {
            var httpClient = new HttpClient_1.HttpClient();
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
                }
                catch (ex) {
                    return {
                        status: 'error',
                        data: {
                            message: 'Error parsing response',
                            detail: 'ex.message'
                        }
                    };
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
                        };
                }
            });
        };
        return Auth2;
    }());
    exports.Auth2 = Auth2;
});
//# sourceMappingURL=Auth2.js.map