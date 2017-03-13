define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Cookie = (function () {
        function Cookie(name) {
            this.reservedKeys = [
                'expires',
                'max-age',
                'path',
                'domain',
                'secure'
            ];
            this.noEncode = false;
            if (this.reservedKeys.indexOf(name.toLowerCase()) >= 0) {
                throw new Error('Cookie key invalid, must not be one of ' + this.reservedKeys.join(', '));
            }
            if (name.match(/;/) || name.match(/=/)) {
                throw new Error('Cookie name may not contain a ; or =');
            }
            this.name = name;
        }
        Cookie.prototype.setValue = function (value) {
            if (value.match(/;/) || value.match(/=/)) {
                throw new Error('Cookie value may not contain a ; or =');
            }
            this.value = value;
            return this;
        };
        Cookie.prototype.setExpires = function (expires) {
            if (expires.match(/;/)) {
                throw new Error('Cookie parameter value may not contain a ;');
            }
            this.expires = expires;
            return this;
        };
        Cookie.prototype.setDomain = function (domain) {
            if (domain.match(/;/)) {
                throw new Error('Cookie parameter value may not contain a ;');
            }
            this.domain = domain;
            return this;
        };
        Cookie.prototype.setMaxAge = function (maxAge) {
            this.maxAge = maxAge;
            return this;
        };
        Cookie.prototype.setPath = function (path) {
            if (path.match(/;/)) {
                throw new Error('Cookie parameter value may not contain a ;');
            }
            this.path = path;
            return this;
        };
        Cookie.prototype.setSecure = function (secure) {
            this.secure = secure;
            return this;
        };
        Cookie.prototype.setNoEncode = function (noEncode) {
            this.noEncode = noEncode;
            return this;
        };
        Cookie.prototype.toString = function () {
            var cookieProps = [];
            if (typeof this.domain !== 'undefined') {
                cookieProps.push({
                    key: 'domain',
                    value: this.domain
                });
            }
            if (typeof this.path !== 'undefined') {
                cookieProps.push({
                    key: 'path',
                    value: this.path
                });
            }
            if (typeof this.expires !== 'undefined') {
                cookieProps.push({
                    key: 'expires',
                    value: this.expires
                });
                if (typeof this.maxAge !== 'undefined') {
                    var maxAgeValue;
                    if (this.maxAge === Infinity) {
                        cookieProps.push({
                            key: 'expires',
                            value: new Date('9999-12-31T23:59:59Z').toUTCString()
                        });
                    }
                    else {
                        cookieProps.push({
                            key: 'max-age',
                            value: String(this.maxAge)
                        });
                    }
                }
            }
            else {
                if (typeof this.maxAge !== 'undefined') {
                    var maxAgeValue;
                    if (this.maxAge === Infinity) {
                        cookieProps.push({
                            key: 'expires',
                            value: new Date('9999-12-31T23:59:59Z').toUTCString()
                        });
                    }
                    else {
                        cookieProps.push({
                            key: 'expires',
                            value: new Date(new Date().getTime() + this.maxAge * 1000).toUTCString()
                        });
                        cookieProps.push({
                            key: 'max-age',
                            value: String(this.maxAge)
                        });
                    }
                }
            }
            if (typeof this.secure !== 'undefined') {
                cookieProps.push({
                    key: 'secure'
                });
            }
            var cookieString = [[
                    this.name,
                    this.value
                ].join('=')]
                .concat(cookieProps.map(function (prop) {
                return [prop.key, prop.value].filter(function (item) {
                    return typeof item === 'undefined' ? false : true;
                })
                    .join('=');
            }))
                .join(';');
            return cookieString;
        };
        return Cookie;
    }());
    exports.Cookie = Cookie;
    var CookieManager = (function () {
        function CookieManager() {
            this.global = document;
        }
        CookieManager.prototype.importCookies = function () {
            var cookieString = this.global.cookie;
            if (cookieString.length > 0) {
                return cookieString.split(/;/)
                    .map(function (cookie) {
                    var pieces = cookie.split('=');
                    var name = pieces[0].trim();
                    var value = pieces[1].trim();
                    return {
                        name: name,
                        value: decodeURIComponent(value)
                    };
                });
            }
            else {
                return [];
            }
        };
        CookieManager.prototype.getCookies = function () {
            return this.importCookies();
        };
        CookieManager.prototype.findCookies = function (key) {
            var cookies = this.importCookies();
            return cookies.filter(function (cookie) {
                if (cookie.name === key) {
                    return true;
                }
            });
        };
        CookieManager.prototype.getItem = function (key) {
            if (!key) {
                return null;
            }
            var cookie = this.findCookies(key);
            if (cookie.length > 1) {
                throw new Error('Too many cookies returned, expected 1');
            }
            if (cookie.length === 0) {
                return null;
            }
            return cookie[0].value;
        };
        CookieManager.prototype.newCookie = function (key) {
            return new Cookie(key);
        };
        CookieManager.prototype.setItem = function (item) {
            document.cookie = item.toString();
        };
        CookieManager.prototype.removeItem = function (item) {
            var deletionCookie = new Cookie(item.name)
                .setPath(item.path)
                .setValue('*')
                .setExpires(new Date('1970-01-01T00:00:00Z').toUTCString());
            if (item.domain) {
                deletionCookie.setDomain(item.domain);
            }
            this.setItem(deletionCookie);
        };
        return CookieManager;
    }());
    exports.CookieManager = CookieManager;
});
