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
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuthError = (function (_super) {
        __extends(AuthError, _super);
        function AuthError(errorInfo) {
            var _this = _super.call(this, errorInfo.message) || this;
            Object.setPrototypeOf(_this, AuthError.prototype);
            _this.name = 'AuthError';
            _this.code = errorInfo.code;
            _this.detail = errorInfo.detail;
            _this.data = errorInfo.data;
            _this.stack = new Error().stack;
            return _this;
        }
        return AuthError;
    }(Error));
    exports.AuthError = AuthError;
});
