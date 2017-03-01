define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CookieItemBuilder = (function () {
        function CookieItemBuilder(key) {
            this.reservedKeys = [
                'expires',
                'max-age',
                'path',
                'domain',
                'secure'
            ];
            this.noEncode = false;
            if (this.reservedKeys.indexOf(key.toLowerCase()) < 0) {
                throw new Error('Cookie key invalid, must not be one of ' + this.reservedKeys.join(', '));
            }
        }
        CookieItemBuilder.prototype.setValue = function (value) {
            this.value = value;
        };
        CookieItemBuilder.prototype.setExpires = function (expires) {
            this.expires = expires;
        };
        CookieItemBuilder.prototype.setMaxAge = function (maxAge) {
            this.maxAge = maxAge;
        };
        CookieItemBuilder.prototype.setPath = function (path) {
            this.path = path;
        };
        CookieItemBuilder.prototype.setSecure = function (secure) {
            this.secure = secure;
        };
        CookieItemBuilder.prototype.toString = function () {
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
            if (typeof this.secure !== 'undefined') {
                cookieProps.push({
                    key: 'secure',
                    value: this.secure ? 'true' : 'false'
                });
            }
            if (typeof this.expires !== 'undefined') {
                cookieProps.push({
                    key: 'expires',
                    value: this.expires
                });
            }
            if (typeof this.maxAge !== 'undefined') {
                cookieProps.push({
                    key: 'max-age',
                    value: String(this.maxAge)
                });
            }
            var cookieString = [
                    this.key,
                    [
                        this.value,
                        cookieProps.map(function (prop) {
                            return [prop.key, prop.value]
                                .filter((item) => {
                                    return typeof item === 'undefined' ? false : true;
                                })
                                .join('=');
                        })
                    ].join(';')
                ].join('=');
            }
            return cookieString;
        };
        return CookieItemBuilder;
    }());
    exports.CookieItemBuilder = CookieItemBuilder;
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
            var cookie = this.findCookies(key), value;
            if (cookie.length > 1) {
                throw new Error('Too many cookies returned, expected 1');
            }
            if (cookie.length === 0) {
                return null;
            }
            return cookie[0].value;
        };
        CookieManager.prototype.itemBuilder = function (key) {
            return new CookieItemBuilder(key);
        };
        CookieManager.prototype.setItem = function (item) {
            document.cookie = item.toString();
        };
        return CookieManager;
    }());
    exports.CookieManager = CookieManager;
});
//# sourceMappingURL=CookieManager.js.map