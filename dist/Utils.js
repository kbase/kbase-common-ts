define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Utils = (function () {
        function Utils() {
            this.genIdSerial = 0;
        }
        Utils.prototype.genId = function () {
            var random = Math.floor(Math.random() * 1000);
            var time = new Date().getTime();
            if (this.genIdSerial === 1000) {
                this.genIdSerial = 0;
            }
            this.genIdSerial += 1;
            return [random, time, this.genIdSerial].map(String).join('-');
        };
        return Utils;
    }());
    exports.Utils = Utils;
});
