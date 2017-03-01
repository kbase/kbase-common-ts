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
        Auth2.prototype.login = function (config) {
            var html = new Html_1.Html();
            var t = html.tagMaker();
            var form = t('form');
            var input = t('input');
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
        Auth2.prototype.revokeToken = function (token, tokenid) {
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'DELETE',
                header: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                },
                url: this.config.baseUrl + '/' + this.config.endpoints.logout
            })
                .then(function (result) {
                switch (result.status) {
                    case 204:
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
        Auth2.prototype.logout = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'DELETE',
                header: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                },
                url: this.config.baseUrl + '/' + this.config.endpoints.logout
            })
                .then(function (result) {
                switch (result.status) {
                    case 204:
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
        Auth2.prototype.getIntrospection = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'GET',
                url: this.config.baseUrl + '/' + this.config.endpoints.introspect,
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
        Auth2.prototype.getAccount = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
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
                }
                catch (ex) {
                    console.error('ERROR getting user account info', result);
                    throw new Error('Cannot parse "me" result:' + ex.message);
                }
            });
        };
        Auth2.prototype.getLoginChoice = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
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
        Auth2.prototype.loginPick = function (token, identityId) {
            var data = {
                id: identityId
            };
            var httpClient = new HttpClient_1.HttpClient();
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
