define(["require", "exports", "./Cookie", "./Auth2", "./Utils", "bluebird"], function (require, exports, Cookie_1, Auth2_1, Utils_1, Promise) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Auth2Session = (function () {
        function Auth2Session(config) {
            this.cookieName = config.cookieName;
            this.extraCookies = config.extraCookies;
            this.baseUrl = config.baseUrl;
            this.cookieManager = new Cookie_1.CookieManager();
            this.auth2Client = new Auth2_1.Auth2(config);
            this.serviceLoopActive = false;
            this.cookieMaxAge = 300000;
            this.changeListeners = {};
            this.session = null;
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
        Auth2Session.prototype.getKbaseSession = function () {
            if (!this.session) {
                return null;
            }
            var info = this.session.tokenInfo;
            return {
                un: info.user,
                user_id: info.user,
                name: info.name,
                token: this.session.token,
                kbase_sessionid: null
            };
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
        Auth2Session.prototype.loginPick = function (token, identityId) {
            var that = this;
            return that.auth2Client.loginPick(token, identityId)
                .then(function (result) {
                that.setSessionCookie(result.data.token.token, result.data.token.expires);
                return that.evaluateSession()
                    .then(function () {
                    return result;
                });
            });
        };
        Auth2Session.prototype.loginCreate = function (data) {
            var _this = this;
            return this.auth2Client.loginCreate(data)
                .then(function (result) {
                _this.setSessionCookie(result.data.token.token, result.data.token.expires);
                return _this.evaluateSession()
                    .then(function () {
                    return result;
                });
            });
        };
        Auth2Session.prototype.getAccount = function () {
            return this.auth2Client.getAccount(this.getToken());
        };
        Auth2Session.prototype.getTokens = function () {
            return this.auth2Client.getTokens(this.getToken());
        };
        Auth2Session.prototype.getIntrospection = function () {
            return this.auth2Client.getIntrospection(this.getToken());
        };
        Auth2Session.prototype.getLoginCoice = function () {
            return this.auth2Client.getLoginChoice();
        };
        Auth2Session.prototype.login = function (config) {
            this.setLastProvider(config.provider);
            return this.auth2Client.login(config);
        };
        Auth2Session.prototype.link = function (config) {
            return this.auth2Client.linkPost(config);
        };
        Auth2Session.prototype.removeLink = function (config) {
            return this.auth2Client.removeLink(this.getToken(), config);
        };
        Auth2Session.prototype.getLinkChoice = function (token) {
            return this.auth2Client.getLinkChoice(this.getToken());
        };
        Auth2Session.prototype.linkPick = function (identityId) {
            return this.auth2Client.linkPick(this.getToken(), identityId)
                .then(function (result) {
                return result;
            });
        };
        Auth2Session.prototype.logout = function () {
            var that = this;
            return this.getIntrospection()
                .then(function (tokenInfo) {
                return that.auth2Client.revokeToken(that.getToken(), tokenInfo.id);
            })
                .then(function () {
                that.removeSessionCookie();
                return that.evaluateSession();
            });
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
        Auth2Session.prototype.checkSession = function () {
            var cookieToken = this.auth2Client.getAuthCookie();
            var currentSession = this.session;
            var hadSession = this.session ? true : false;
            var result = null;
            var now = new Date().getTime();
            if (!cookieToken) {
                this.removeSessionCookie();
                if (this.session) {
                    this.session = null;
                    return 'loggedout';
                }
                else {
                    return 'nosession';
                }
            }
            if (this.session === null) {
                return 'nosession';
            }
            if (cookieToken !== currentSession.token) {
                this.session = null;
                return 'newtoken';
            }
            var expiresIn = this.session.tokenInfo.expires - now;
            if (expiresIn <= 0) {
                this.session = null;
                this.removeSessionCookie();
                return 'loggedout';
            }
            else if (expiresIn <= 300000) {
            }
            var sessionAge = now - this.session.fetchedAt;
            if (sessionAge > this.session.tokenInfo.cachefor) {
                this.session = null;
                return 'cacheexpired';
            }
            return 'ok';
        };
        Auth2Session.prototype.evaluateSession = function () {
            var _this = this;
            return Promise.try(function () {
                var change = null;
                var sessionState = _this.checkSession();
                switch (sessionState) {
                    case 'loggedout':
                        _this.notifyListeners('loggedout');
                        return;
                    case 'ok':
                        return;
                    case 'nosession':
                    case 'newtoken':
                    case 'cacheexpired':
                        break;
                    default: throw new Error('Unexpected session state: ' + sessionState);
                }
                var cookieToken = _this.auth2Client.getAuthCookie();
                if (!cookieToken) {
                    return;
                }
                return _this.auth2Client.getIntrospection(cookieToken)
                    .then(function (tokenInfo) {
                    _this.session = {
                        token: cookieToken,
                        fetchedAt: new Date().getTime(),
                        tokenInfo: tokenInfo
                    };
                    switch (sessionState) {
                        case 'nosession':
                            _this.notifyListeners('loggedin');
                            break;
                        case 'newtoken':
                            _this.notifyListeners('loggedin');
                            break;
                        case 'cacheexpired':
                    }
                })
                    .catch(function (err) {
                    console.error('ERROR', err);
                    _this.session = null;
                    _this.removeSessionCookie();
                    if (sessionState === 'newtoken') {
                        _this.notifyListeners('loggedout');
                    }
                });
            });
        };
        Auth2Session.prototype.start = function () {
            var _this = this;
            return Promise.try(function () {
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
                _this.serviceLoopActive = true;
                serviceLoop();
                return;
            });
        };
        Auth2Session.prototype.stop = function () {
            var _this = this;
            return Promise.try(function () {
                _this.serviceLoopActive = false;
                if (_this.loopTimer) {
                    window.clearTimeout(_this.loopTimer);
                    _this.loopTimer = null;
                }
            });
        };
        Auth2Session.prototype.setSessionCookie = function (token, expiration) {
            var _this = this;
            var sessionCookie = new Cookie_1.Cookie(this.cookieName)
                .setValue(token)
                .setPath('/');
            if (this.isSessionPersistent()) {
                sessionCookie.setExpires(new Date(expiration).toUTCString());
            }
            this.cookieManager.setItem(sessionCookie);
            var that = this;
            if (this.extraCookies) {
                this.extraCookies.forEach(function (cookieConfig) {
                    var extraCookie = new Cookie_1.Cookie(cookieConfig.name)
                        .setValue(token)
                        .setPath('/')
                        .setDomain(cookieConfig.domain);
                    if (_this.isSessionPersistent()) {
                        extraCookie.setExpires(new Date(expiration).toUTCString());
                    }
                    ;
                    that.cookieManager.setItem(extraCookie);
                });
            }
        };
        Auth2Session.prototype.removeSessionCookie = function () {
            var _this = this;
            this.cookieManager.removeItem(new Cookie_1.Cookie(this.cookieName)
                .setPath('/'));
            if (this.extraCookies) {
                this.extraCookies.forEach(function (cookieConfig) {
                    _this.cookieManager.removeItem(new Cookie_1.Cookie(cookieConfig.name)
                        .setPath('/')
                        .setDomain(cookieConfig.domain));
                });
            }
        };
        Auth2Session.prototype.setSessionPersistent = function (isPersistent) {
            var cookie = new Cookie_1.Cookie('sessionpersist')
                .setPath('/');
            if (isPersistent) {
                this.cookieManager.setItem(cookie
                    .setValue('t')
                    .setMaxAge(Infinity));
            }
            else {
                this.cookieManager.removeItem(cookie);
            }
        };
        Auth2Session.prototype.isSessionPersistent = function () {
            var persist = this.cookieManager.getItem('sessionpersist');
            if (persist === 't') {
                return true;
            }
            return false;
        };
        return Auth2Session;
    }());
    exports.Auth2Session = Auth2Session;
});
