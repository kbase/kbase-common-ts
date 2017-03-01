define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var QueueItem = (function () {
        function QueueItem(id, run, error) {
            this.run = run;
            this.error = error;
            this.id = id;
        }
        return QueueItem;
    }());
    exports.QueueItem = QueueItem;
    var AsyncQueue = (function () {
        function AsyncQueue(queuePauseTime) {
            this.queuePauseTime = queuePauseTime;
            this.queue = [];
        }
        AsyncQueue.prototype.processQueue = function () {
            var item = this.queue.shift();
            if (item) {
                try {
                    item.run();
                }
                catch (ex) {
                    if (item.error) {
                        try {
                            item.error(ex);
                        }
                        catch (ignore) {
                            console.error('ERROR running error fun', ex);
                        }
                    }
                    else {
                        console.error('Error processing queue item', ex);
                    }
                }
                finally {
                    this.start();
                }
            }
        };
        AsyncQueue.prototype.start = function () {
            var that = this;
            this.timer = window.setTimeout(function () {
                that.processQueue();
            }, this.queuePauseTime);
        };
        AsyncQueue.prototype.stop = function () {
            window.clearTimeout(this.timer);
            this.timer = null;
        };
        AsyncQueue.prototype.addItem = function (run, error) {
            this.itemId += 1;
            this.queue.push(new QueueItem(this.itemId, run, error));
            this.start();
        };
        return AsyncQueue;
    }());
    exports.AsyncQueue = AsyncQueue;
});
