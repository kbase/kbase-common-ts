define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    var Html = (function () {
        function Html() {
            this.genIdSerial = 0;
        }
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
            if (!(children instanceof Array)) {
                throw new Error('hmm, not an array? ' + typeof children);
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
        Html.prototype.mergeAttribs = function (a, b) {
            if (typeof a === 'undefined') {
                a = {};
            }
            var merger = function (x, y) {
                if (typeof y === 'object' && y !== null) {
                    Object.keys(y).forEach(function (key) {
                        var xval = x[key];
                        var yval = y[key];
                        if (typeof xval === 'undefined') {
                            x[key] = yval;
                        }
                        else if (typeof xval === 'object' && xval !== null) {
                            if (typeof yval === 'object' && yval !== null) {
                                merger(xval, yval);
                            }
                            else {
                                x[key] = yval;
                            }
                        }
                        else {
                            x[key] = yval;
                        }
                    });
                }
            };
            merger(a, b);
            return a;
        };
        Html.prototype.tagMaker = function () {
            var _this = this;
            var isHtmlNode = function (val) {
                return true;
            };
            var isAttribMap = function (val) {
                return true;
            };
            var notEmpty = function (x) {
                if ((typeof x === 'undefined') ||
                    (x === null) ||
                    x.length === 0) {
                    return false;
                }
                return true;
            };
            var maker = function (name, defaultAttribs) {
                if (defaultAttribs === void 0) { defaultAttribs = {}; }
                var tagFun = function (attribs, children) {
                    var node = '<';
                    if (typeof children === 'undefined') {
                        if (typeof attribs === 'object' &&
                            !(attribs instanceof Array) &&
                            isAttribMap(attribs)) {
                            if (Object.keys(attribs).length === 0) {
                                node += name;
                            }
                            else {
                                var tagAttribs = _this.attribsToString(_this.mergeAttribs(attribs, defaultAttribs));
                                node += [name, tagAttribs].filter(notEmpty).join(' ');
                            }
                            node += '>';
                        }
                        else if (typeof attribs === 'undefined') {
                            var tagAttribs = _this.attribsToString(defaultAttribs);
                            node += [name, tagAttribs].filter(notEmpty).join(' ');
                            node += '>';
                        }
                        else if (isHtmlNode(attribs)) {
                            var tagAttribs = _this.attribsToString(defaultAttribs);
                            node += [name, tagAttribs].filter(notEmpty).join(' ');
                            node += '>' + _this.renderChildren(attribs);
                        }
                    }
                    else if (isAttribMap(attribs) && isHtmlNode(children)) {
                        if (Object.keys(attribs).length === 0) {
                            node += name;
                        }
                        else {
                            var tagAttribs = _this.attribsToString(_this.mergeAttribs(attribs, defaultAttribs));
                            node += [name, tagAttribs].filter(notEmpty).join(' ');
                        }
                        node += '>' + _this.renderChildren(children);
                    }
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
