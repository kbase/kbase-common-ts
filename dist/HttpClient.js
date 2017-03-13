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
define(["require", "exports", "./HttpUtils", "bluebird"], function (require, exports, HttpUtils_1, Promise) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Promise.config({
        cancellation: true
    });
    var TimeoutError = (function (_super) {
        __extends(TimeoutError, _super);
        function TimeoutError(timeout, elapsed, message, xhr) {
            var _this = _super.call(this, message) || this;
            Object.setPrototypeOf(_this, TimeoutError.prototype);
            _this.name = 'TimeoutError';
            _this.stack = new Error().stack;
            _this.timeout = timeout;
            _this.elapsed = elapsed;
            _this.xhr = xhr;
            return _this;
        }
        TimeoutError.prototype.toString = function () {
            if (this.message) {
                return this.message;
            }
        };
        return TimeoutError;
    }(Error));
    exports.TimeoutError = TimeoutError;
    var GeneralError = (function (_super) {
        __extends(GeneralError, _super);
        function GeneralError(message, xhr) {
            var _this = _super.call(this, message) || this;
            Object.setPrototypeOf(_this, GeneralError.prototype);
            _this.name = 'GeneralError';
            _this.stack = new Error().stack;
            _this.xhr = xhr;
            return _this;
        }
        GeneralError.prototype.toString = function () {
            return this.message;
        };
        return GeneralError;
    }(Error));
    exports.GeneralError = GeneralError;
    var AbortError = (function (_super) {
        __extends(AbortError, _super);
        function AbortError(message, xhr) {
            var _this = _super.call(this, message) || this;
            Object.setPrototypeOf(_this, AbortError.prototype);
            _this.name = 'AbortError';
            _this.stack = new Error().stack;
            _this.xhr = xhr;
            return _this;
        }
        AbortError.prototype.toString = function () {
            return this.message;
        };
        return AbortError;
    }(Error));
    exports.AbortError = AbortError;
    var HttpClient = (function () {
        function HttpClient() {
        }
        HttpClient.prototype.getHeader = function (xhr) {
            var header = {};
            var headerString = xhr.getAllResponseHeaders();
            if (!headerString) {
                return header;
            }
            var headerFields = headerString.split(/\n/);
            headerFields.pop();
            headerFields.forEach(function (field) {
                var firstColon = field.indexOf(':', 0);
                var name = field.substr(0, firstColon).trim();
                var value = field.substr(firstColon + 1).trim();
                header[name] = value;
            });
            return header;
        };
        HttpClient.prototype.request = function (options) {
            var startTime = new Date().getTime();
            var that = this;
            return new Promise(function (resolve, reject, onCancel) {
                var xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve({
                        status: xhr.status,
                        response: xhr.response,
                        header: that.getHeader(xhr)
                    });
                };
                xhr.ontimeout = function () {
                    var elapsed = (new Date().getTime()) - startTime;
                    reject(new TimeoutError(options.timeout, elapsed, 'Request timeout', xhr));
                };
                xhr.onerror = function () {
                    reject(new GeneralError('General request error ' + options.url, xhr));
                };
                xhr.onabort = function () {
                    reject(new AbortError('Request was aborted', xhr));
                };
                var url = new URL(options.url);
                if (options.query) {
                    url.search = new HttpUtils_1.HttpQuery(options.query).toString();
                }
                if (options.timeout) {
                    xhr.timeout = options.timeout;
                }
                try {
                    xhr.open(options.method, url.toString(), true);
                }
                catch (ex) {
                    reject(new GeneralError('Error opening request', xhr));
                }
                xhr.withCredentials = options.withCredentials || false;
                try {
                    if (options.header) {
                        Object.keys(options.header)
                            .filter(function (key) {
                            if (options.header[key] === undefined ||
                                options.header[key] === null) {
                                return false;
                            }
                            return true;
                        })
                            .forEach(function (key) {
                            var stringValue = (function (value) {
                                switch (typeof value) {
                                    case 'string': return value;
                                    case 'number': return String(value);
                                    case 'boolean': return String(value);
                                    default:
                                        throw new Error('Invalid type for header value: ' + typeof value);
                                }
                            }(options.header[key]));
                            xhr.setRequestHeader(key, stringValue);
                        });
                    }
                    if (typeof options.data === 'string') {
                        xhr.send(options.data);
                        if (onCancel) {
                            onCancel(function () {
                                xhr.abort();
                            });
                        }
                    }
                    else if (options.data instanceof Array) {
                        xhr.send(new Uint8Array(options.data));
                    }
                    else if (typeof options.data === 'undefined') {
                        xhr.send();
                    }
                    else if (options.data === null) {
                        xhr.send();
                    }
                    else {
                        reject(new Error('Invalid type of data to send: ' + typeof options.data));
                    }
                }
                catch (ex) {
                    reject(new GeneralError('Error sending data in request', xhr));
                }
            });
        };
        return HttpClient;
    }());
    exports.HttpClient = HttpClient;
});
