define(["require", "exports", "./Cookie", "./Auth2", "./Auth2Error", "./Utils", "bluebird"], function (require, exports, Cookie_1, Auth2_1, Auth2Error_1, Utils_1, Promise) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CacheState;
    (function (CacheState) {
        CacheState[CacheState["New"] = 1] = "New";
        CacheState[CacheState["Ok"] = 2] = "Ok";
        CacheState[CacheState["Stale"] = 3] = "Stale";
        CacheState[CacheState["Syncing"] = 4] = "Syncing";
        CacheState[CacheState["Error"] = 5] = "Error";
        CacheState[CacheState["Interrupted"] = 6] = "Interrupted";
        CacheState[CacheState["None"] = 7] = "None";
    })(CacheState || (CacheState = {}));
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
            this.sessionCache = {
                session: null,
                fetchedAt: 0,
                state: CacheState.New
            };
        }
        Auth2Session.prototype.getSession = function () {
            if (this.sessionCache.state === CacheState.Ok) {
                return this.sessionCache.session;
            }
            return null;
        };
        Auth2Session.prototype.getToken = function () {
            var session = this.getSession();
            if (session) {
                return session.token;
            }
            return null;
        };
        Auth2Session.prototype.getUsername = function () {
            var session = this.getSession();
            if (session) {
                return session.tokenInfo.user;
            }
            return null;
        };
        Auth2Session.prototype.getEmail = function () {
            var session = this.getSession();
            if (session) {
                return session.me.email;
            }
            return null;
        };
        Auth2Session.prototype.getRealname = function () {
            var session = this.getSession();
            if (session) {
                return session.tokenInfo.name;
            }
            return null;
        };
        Auth2Session.prototype.getKbaseSession = function () {
            var session = this.getSession();
            if (!session) {
                return null;
            }
            var info = session.tokenInfo;
            return {
                un: info.user,
                user_id: info.user,
                name: info.name,
                token: session.token,
                kbase_sessionid: null
            };
        };
        Auth2Session.prototype.isAuthorized = function () {
            var session = this.getSession();
            if (session) {
                return true;
            }
            return false;
        };
        Auth2Session.prototype.isLoggedIn = function () {
            return this.isAuthorized();
        };
        Auth2Session.prototype.getClient = function () {
            return this.auth2Client;
        };
        Auth2Session.prototype.loginPick = function (arg) {
            var _this = this;
            return this.auth2Client.loginPick(arg)
                .then(function (result) {
                _this.setSessionCookie(result.token.token, result.token.expires);
                return _this.evaluateSession()
                    .then(function () {
                    return result;
                });
            });
        };
        Auth2Session.prototype.loginCreate = function (data) {
            return this.auth2Client.loginCreate(data);
        };
        Auth2Session.prototype.initializeSession = function (tokenInfo) {
            this.setSessionCookie(tokenInfo.token, tokenInfo.expires);
            return this.evaluateSession();
        };
        Auth2Session.prototype.loginUsernameSuggest = function (username) {
            return this.auth2Client.loginUsernameSuggest(username);
        };
        Auth2Session.prototype.loginCancel = function () {
            return this.auth2Client.loginCancel();
        };
        Auth2Session.prototype.linkCancel = function () {
            return this.auth2Client.linkCancel();
        };
        Auth2Session.prototype.getMe = function () {
            return this.auth2Client.getMe(this.getToken());
        };
        Auth2Session.prototype.putMe = function (data) {
            return this.auth2Client.putMe(this.getToken(), data);
        };
        Auth2Session.prototype.getTokens = function () {
            return this.auth2Client.getTokens(this.getToken());
        };
        Auth2Session.prototype.createToken = function (data) {
            return this.auth2Client.createToken(this.getToken(), data);
        };
        Auth2Session.prototype.getTokenInfo = function () {
            return this.auth2Client.getTokenInfo(this.getToken());
        };
        Auth2Session.prototype.getLoginCoice = function () {
            return this.auth2Client.getLoginChoice();
        };
        Auth2Session.prototype.loginStart = function (config) {
            this.auth2Client.loginStart(config);
        };
        Auth2Session.prototype.linkStart = function (config) {
            return this.auth2Client.linkStart(this.getToken(), config);
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
        Auth2Session.prototype.logout = function (tokenId) {
            var _this = this;
            return this.getTokenInfo()
                .then(function (tokenInfo) {
                var session = _this.getSession();
                var currentTokenId = session ? session.tokenInfo.id : null;
                if (tokenId && tokenId !== currentTokenId) {
                    throw new Error('Supplied token id does not match the current token id, will not log out');
                }
                return _this.auth2Client.revokeToken(_this.getToken(), tokenInfo.id);
            })
                .then(function () {
                _this.removeSessionCookie();
                return _this.evaluateSession();
            });
        };
        Auth2Session.prototype.revokeToken = function (tokenId) {
            var _this = this;
            var that = this;
            return this.getTokenInfo()
                .then(function (tokenInfo) {
                return _this.auth2Client.revokeToken(_this.getToken(), tokenId);
            });
        };
        Auth2Session.prototype.revokeAllTokens = function () {
            var _this = this;
            var that = this;
            return this.getTokenInfo()
                .then(function (tokenInfo) {
                return _this.auth2Client.revokeAllTokens(_this.getToken());
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
            var cookieToken = this.getAuthCookie();
            var currentSession = this.getSession();
            var hadSession = currentSession ? true : false;
            var result = null;
            var now = new Date().getTime();
            if (!cookieToken) {
                if (this.sessionCache.session) {
                    this.sessionCache.session = null;
                    this.sessionCache.state = CacheState.None;
                    return 'loggedout';
                }
                else {
                    this.sessionCache.state = CacheState.None;
                    return 'nosession';
                }
            }
            if (this.sessionCache.session === null) {
                return 'newtoken';
            }
            if (cookieToken !== this.sessionCache.session.token) {
                this.sessionCache.session = null;
                return 'newtoken';
            }
            var expiresIn = this.sessionCache.session.tokenInfo.expires - now;
            if (expiresIn <= 0) {
                this.sessionCache.session = null;
                this.sessionCache.state = CacheState.None;
                this.removeSessionCookie();
                return 'loggedout';
            }
            else if (expiresIn <= 300000) {
            }
            if (this.sessionCache.state === CacheState.Interrupted) {
                var interruptedFor = now - this.sessionCache.interruptedAt;
                var checkedFor = now - this.sessionCache.lastCheckedAt;
                if (interruptedFor < 60000) {
                    if (checkedFor > 5000) {
                        return 'interrupted-retry';
                    }
                }
                else {
                    if (checkedFor > 60000) {
                        return 'interrupted-retry';
                    }
                }
                return 'ok';
            }
            var sessionAge = now - this.sessionCache.fetchedAt;
            if (sessionAge > this.sessionCache.session.tokenInfo.cachefor) {
                this.sessionCache.state = CacheState.Stale;
                return 'cacheexpired';
            }
            return 'ok';
        };
        Auth2Session.prototype.getAuthCookie = function () {
            return this.cookieManager.getItem(this.cookieName);
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
                        return;
                    case 'interrupted-retry':
                    case 'newtoken':
                    case 'cacheexpired':
                        break;
                    default: throw new Error('Unexpected session state: ' + sessionState);
                }
                var cookieToken = _this.getAuthCookie();
                _this.sessionCache.lastCheckedAt = new Date().getTime();
                var tokenInfo;
                var me;
                return _this.auth2Client.getTokenInfo(cookieToken)
                    .then(function (result) {
                    tokenInfo = result;
                    return _this.auth2Client.getMe(cookieToken);
                })
                    .then(function (result) {
                    me = result;
                    _this.sessionCache.fetchedAt = new Date().getTime();
                    _this.sessionCache.state = CacheState.Ok;
                    _this.sessionCache.interruptedAt = null;
                    _this.sessionCache.session = {
                        token: cookieToken,
                        tokenInfo: tokenInfo,
                        me: me
                    };
                    switch (sessionState) {
                        case 'newtoken':
                            _this.notifyListeners('loggedin');
                            break;
                        case 'interrupted-retry':
                            _this.notifyListeners('restored');
                            break;
                        case 'cacheexpired':
                    }
                })
                    .catch(Auth2Error_1.AuthError, function (err) {
                    switch (err.code) {
                        case '10020':
                            console.error('Invalid Session Cookie Detected', err);
                            _this.removeSessionCookie();
                            _this.notifyListeners('loggedout');
                        case 'connection-error':
                        case 'timeout-error':
                        case 'abort-error':
                            _this.sessionCache.state = CacheState.Interrupted;
                            _this.sessionCache.interruptedAt = new Date().getTime();
                            _this.notifyListeners('interrupted');
                            switch (sessionState) {
                                case 'cacheexpired':
                                case 'newtoken':
                                    _this.sessionCache.fetchedAt = new Date().getTime();
                                    _this.notifyListeners('interrupted');
                                    break;
                                case 'interrupted-retry':
                                    _this.notifyListeners('interrupted');
                                    break;
                            }
                            break;
                        default:
                            console.error('Unhandled AUTH ERROR', err);
                            _this.removeSessionCookie();
                            _this.notifyListeners('loggedout');
                    }
                })
                    .catch(function (err) {
                    console.error('ERROR', err, err instanceof Auth2Error_1.AuthError);
                    _this.session = null;
                    _this.removeSessionCookie();
                    if (sessionState === 'newtoken') {
                        _this.notifyListeners('loggedout');
                    }
                });
            });
        };
        Auth2Session.prototype.serverTimeOffset = function () {
            return this.now - this.root.servertime;
        };
        Auth2Session.prototype.start = function () {
            var _this = this;
            return this.auth2Client.root()
                .then(function (root) {
                _this.root = root;
                _this.now = new Date().getTime();
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
                    return serviceLoop();
                });
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
                .setPath('/')
                .setSecure(true);
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
            this.cookieManager.setItem(cookie
                .setValue(isPersistent ? 't' : 'f')
                .setMaxAge(Infinity));
        };
        Auth2Session.prototype.isSessionPersistent = function () {
            var persist = this.cookieManager.getItem('sessionpersist');
            if (persist === 't') {
                return true;
            }
            else if (persist === 'f') {
                return false;
            }
            else {
                return true;
            }
        };
        Auth2Session.prototype.userSearch = function (search) {
            return this.auth2Client.userSearch(this.getToken(), search);
        };
        Auth2Session.prototype.adminUserSearch = function (search) {
            return this.auth2Client.adminUserSearch(this.getToken(), search);
        };
        Auth2Session.prototype.getAdminUser = function (username) {
            return this.auth2Client.getAdminUser(this.getToken(), username);
        };
        return Auth2Session;
    }());
    exports.Auth2Session = Auth2Session;
});
