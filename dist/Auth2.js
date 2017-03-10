define(["require", "exports", "./Cookie", "./Html", "./HttpClient"], function (require, exports, Cookie_1, Html_1, HttpClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var endpoints = {
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
    };
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
        Auth2.prototype.getProvider = function (providerId) {
            var providers = this.getProviders();
            return providers.filter(function (provider) {
                return (provider.id === providerId);
            })[0];
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
        Auth2.prototype.removeLink = function (token, config) {
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request({
                method: 'DELETE',
                withCredentials: true,
                header: {
                    Authorization: token,
                    'Content-Type': 'application/json'
                },
                url: [this.config.baseUrl, endpoints.linkRemove, config.identityId].join('/')
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
        Auth2.prototype.revokeToken = function (token, tokenid) {
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
                url: this.config.baseUrl + '/' + endpoints.introspect,
                header: {
                    Authorization: token
                }
            })
                .then(function (result) {
                switch (result.status) {
                    case 200:
                        return JSON.parse(result.response);
                    case 401:
                        console.error('Error in getIntrospection', result);
                        var errorData = JSON.parse(result.response).error;
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
        };
        Auth2.prototype.getAccount = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
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
                }
                catch (ex) {
                    console.error('ERROR getting user account info', result);
                    throw new Error('Cannot parse "me" result:' + ex.message);
                }
            });
        };
        Auth2.prototype.getTokens = function (token) {
            var httpClient = new HttpClient_1.HttpClient();
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
                }
                catch (ex) {
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
        };
        Auth2.prototype.getLoginChoice = function () {
            var httpClient = new HttpClient_1.HttpClient();
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
        Auth2.prototype.getLinkChoice = function (token) {
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
                    case 400:
                        return {
                            status: 'error',
                            code: result.status,
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
        Auth2.prototype.linkPick = function (token, identityId) {
            var data = {
                id: identityId
            };
            var httpClient = new HttpClient_1.HttpClient();
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
        return Auth2;
    }());
    exports.Auth2 = Auth2;
});
