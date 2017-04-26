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
define(["require", "exports", "./HttpClient"], function (require, exports, HttpClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KBaseJsonRpcError = (function (_super) {
        __extends(KBaseJsonRpcError, _super);
        function KBaseJsonRpcError(errorInfo) {
            var _this = _super.call(this, errorInfo.message) || this;
            Object.setPrototypeOf(_this, KBaseJsonRpcError.prototype);
            _this.name = 'JsonRpcError';
            _this.code = errorInfo.code;
            _this.message = errorInfo.message;
            _this.detail = errorInfo.detail;
            _this.data = errorInfo.data;
            _this.stack = new Error().stack;
            return _this;
        }
        return KBaseJsonRpcError;
    }(Error));
    exports.KBaseJsonRpcError = KBaseJsonRpcError;
    var KBaseJsonRpcClient = (function () {
        function KBaseJsonRpcClient() {
        }
        KBaseJsonRpcClient.prototype.isGeneralError = function (error) {
            return (error instanceof HttpClient_1.GeneralError);
        };
        KBaseJsonRpcClient.prototype.request = function (options) {
            var rpc = {
                version: '1.1',
                method: options.module + '.' + options.func,
                id: String(Math.random()).slice(2),
                params: options.params,
            };
            if (options.rpcContext) {
                rpc.context = options.rpcContext;
            }
            var header = new HttpClient_1.HttpHeader();
            if (options.authorization) {
                header.setHeader('authorization', options.authorization);
            }
            var requestOptions = {
                method: 'POST',
                url: options.url,
                timeout: options.timeout,
                data: JSON.stringify(rpc),
                header: header
            };
            var httpClient = new HttpClient_1.HttpClient();
            return httpClient.request(requestOptions)
                .then(function (result) {
                try {
                    return JSON.parse(result.response);
                }
                catch (ex) {
                    throw new KBaseJsonRpcError({
                        code: 'parse-error',
                        message: ex.message,
                        detail: 'The response from the service could not be parsed',
                        data: {
                            responseText: result.response
                        }
                    });
                }
            })
                .catch(HttpClient_1.GeneralError, function (err) {
                throw new KBaseJsonRpcError({
                    code: 'connection-error',
                    message: err.message,
                    detail: 'An error was encountered communicating with the service',
                    data: {}
                });
            })
                .catch(HttpClient_1.TimeoutError, function (err) {
                throw new KBaseJsonRpcError({
                    code: 'timeout-error',
                    message: err.message,
                    detail: 'There was a timeout communicating with the service',
                    data: {}
                });
            })
                .catch(HttpClient_1.AbortError, function (err) {
                throw new KBaseJsonRpcError({
                    code: 'abort-error',
                    message: err.message,
                    detail: 'The connection was aborted while communicating with the s ervice',
                    data: {}
                });
            });
        };
        return KBaseJsonRpcClient;
    }());
    exports.KBaseJsonRpcClient = KBaseJsonRpcClient;
});
