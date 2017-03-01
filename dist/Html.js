define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AttributeMap = (function () {
        function AttributeMap() {
            this.map = {};
        }
        AttributeMap.prototype.addItem = function (key, value) {
            this.map[key] = value;
        };
        AttributeMap.prototype.removeItem = function (key) {
            delete this.map[key];
        };
        AttributeMap.prototype.toString = function () {
            var that = this;
            return Object.keys(this.map).map(function (key) {
                var value = that.map[key];
                var attribName = key.replace(/[A-Z]/g, function (m) {
                    return '-' + m.toLowerCase();
                });
            }).join(' ');
        };
        return AttributeMap;
    }());
    exports.AttributeMap = AttributeMap;
    ;
    var Html = (function () {
        function Html() {
            this.genIdSerial = 0;
        }
        Html.prototype.isArray = function (value) {
            if (value instanceof Array) {
                return true;
            }
            return false;
        };
        Html.prototype.isString = function (value) {
            if (typeof value === 'string') {
                return true;
            }
            return false;
        };
        Html.prototype.renderChildren = function (children) {
            if (children === null) {
                return '';
            }
            if (typeof children === 'string') {
                return children;
            }
            if (typeof children === 'number') {
                return String(children);
            }
            var that = this;
            return children.map(function (child) {
                return that.renderChildren(child);
            }).join('');
        };
        Html.prototype.styleAttribsToString = function (attribs) {
            var that = this;
            return Object.keys(attribs).map(function (key) {
                var value = attribs[key];
                var attribValue = value;
                var attribName = key.replace(/[A-Z]/g, function (m) {
                    return '-' + m.toLowerCase();
                });
                return [attribName, attribValue].join(': ');
            }).join('; ');
        };
        Html.prototype.attribsToString = function (attribs) {
            var that = this;
            return Object.keys(attribs).map(function (key) {
                var value = attribs[key];
                var attribValue;
                if (typeof value === 'string') {
                    attribValue = '"' + value.replace(/"/, '""') + '"';
                }
                else {
                    attribValue = '"' + that.styleAttribsToString(value) + '"';
                }
                var attribName = key.replace(/[A-Z]/g, function (m) {
                    return '-' + m.toLowerCase();
                });
                return [attribName, attribValue].join('=');
            }).join(' ');
        };
        Html.prototype.tagMaker = function () {
            var that = this;
            var maker = function (name) {
                var tagFun = function (attribs, children) {
                    var node = '<';
                    if (Object.keys(attribs).length === 0) {
                        node += name;
                    }
                    else {
                        var tagAttribs = that.attribsToString(attribs);
                        node += [name, tagAttribs].join(' ');
                    }
                    node += '>';
                    node += that.renderChildren(children);
                    node += '</' + name + '>';
                    return node;
                };
                return tagFun;
            };
            return maker;
        };
        Html.prototype.genId = function () {
            var random = Math.floor(Math.random() * 1000);
            var time = new Date().getTime();
            if (this.genIdSerial === 1000) {
                this.genIdSerial = 0;
            }
            this.genIdSerial += 1;
            return [random, time, this.genIdSerial].map(String).join('-');
        };
        return Html;
    }());
    exports.Html = Html;
});
