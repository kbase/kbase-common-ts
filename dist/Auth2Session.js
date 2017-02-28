define(["require", "exports", "./Cookie", "./Auth2", "./Utils", "bluebird"], function (require, exports, Cookie_1, Auth2_1, Utils_1, Promise) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Auth2Session = (function () {
        function Auth2Session(config) {
            this.cookieName = config.cookieName;
            this.baseUrl = config.baseUrl;
            this.cookieManager = new Cookie_1.CookieManager();
            this.auth2Client = new Auth2_1.Auth2(config);
            this.serviceLoopActive = false;
            this.sessionTtl = 300000;
            this.cookieMaxAge = 300000;
        }
        Auth2Session.prototype.getToken = function () {
            if (this.session) {
                return this.session.token;
            }
            return null;
        };
        Auth2Session.prototype.getUsername = function () {
            if (this.session) {
                return this.session.tokenInfo.user;
            }
            return null;
        };
        Auth2Session.prototype.getRealname = function () {
            if (this.session) {
                return this.session.tokenInfo.name;
            }
            return null;
        };
        Auth2Session.prototype.isAuthorized = function () {
            if (this.session) {
                return true;
            }
            return false;
        };
        Auth2Session.prototype.isLoggedIn = function () {
            return this.isAuthorized();
        };
        Auth2Session.prototype.setLastProvider = function (providerId) {
            this.cookieManager.setItem(new Cookie_1.Cookie('last-provider-used')
                .setValue(providerId)
                .setMaxAge(Infinity)
                .setPath('/'));
        };
        Auth2Session.prototype.getLastProvider = function () {
            return this.cookieManager.getItem('last-provider-used');
        };
        Auth2Session.prototype.getClient = function () {
            return this.auth2Client;
        };
        Auth2Session.prototype.pickAccount = function (token, identityId) {
            var _this = this;
            return this.auth2Client.pickAccount(token, identityId)
                .then(function (result) {
                _this.setSessionCookie(result.data.token);
                return _this.evaluateSession()
                    .then(function () {
                    return result;
                });
            });
        };
        Auth2Session.prototype.logout = function () {
            return this.auth2Client.logout(this.getToken());
        };
        Auth2Session.prototype.onChange = function (listener) {
            var utils = new Utils_1.Utils();
            var id = utils.genId();
            this.changeListeners[id] = listener;
            return id;
        };
        Auth2Session.prototype.offChange = function (id) {
            delete this.changeListeners[id];
        };
        Auth2Session.prototype.notifyListeners = function (change) {
            var _this = this;
            if (change === null) {
                return;
            }
            Object.keys(this.changeListeners).forEach(function (key) {
                var listener = _this.changeListeners[key];
                try {
                    listener(change);
                }
                catch (ex) {
                    console.error('Error running change listener', key, ex);
                }
            });
        };
        Auth2Session.prototype.evaluateSession = function () {
            var _this = this;
            var token = this.auth2Client.getAuthCookie();
            var hadSession = this.session ? true : false;
            var change = null;
            return Promise.try(function () {
                if (!token) {
                    if (_this.session) {
                        change = 'loggedout';
                    }
                    _this.session = null;
                }
                else {
                    var now = new Date().getTime();
                    if (_this.session) {
                        if (now - _this.session.fetchedAt > _this.sessionTtl) {
                            change = 'loggedout';
                            _this.session = null;
                        }
                        else if (token !== _this.session.token) {
                            change = 'newuser';
                            _this.session = null;
                        }
                    }
                    if (!_this.session) {
                        return _this.auth2Client.introspectToken(token)
                            .then(function (tokenInfo) {
                            if (!tokenInfo) {
                                if (hadSession) {
                                    change = 'loggedout';
                                    _this.session = null;
                                }
                            }
                            else {
                                if (!_this.session) {
                                    change = 'loggedin';
                                }
                                else {
                                    if (_this.session.token !== token) {
                                        change = 'newuser';
                                    }
                                }
                                _this.session = {
                                    token: token,
                                    fetchedAt: new Date().getTime(),
                                    tokenInfo: tokenInfo
                                };
                            }
                        })
                            .catch(function (err) {
                            console.error('ERROR', err);
                            if (_this.session) {
                                change = 'loggedout';
                                _this.session = null;
                            }
                        });
                    }
                }
            })
                .then(function () {
                _this.notifyListeners(change);
            });
        };
        Auth2Session.prototype.start = function () {
            var _this = this;
            var nextLoop = function () {
                if (!_this.serviceLoopActive) {
                    return;
                }
                _this.loopTimer = window.setTimeout(serviceLoop, 1000);
            };
            var serviceLoop = function () {
                return _this.evaluateSession()
                    .then(function () {
                    nextLoop();
                });
            };
            this.serviceLoopActive = true;
            serviceLoop();
            return;
        };
        Auth2Session.prototype.stop = function () {
            this.serviceLoopActive = false;
            if (this.loopTimer) {
                window.clearTimeout(this.loopTimer);
                this.loopTimer = null;
            }
        };
        Auth2Session.prototype.setSessionCookie = function (token) {
            this.cookieManager.setItem(new Cookie_1.Cookie(this.cookieName)
                .setValue(token)
                .setPath('/')
                .setMaxAge(this.cookieMaxAge));
        };
        Auth2Session.prototype.removeSessionCookie = function () {
            this.cookieManager.removeItem(new Cookie_1.Cookie(this.cookieName)
                .setPath('/'));
        };
        return Auth2Session;
    }());
    exports.Auth2Session = Auth2Session;
});
//# sourceMappingURL=Auth2Session.js.map