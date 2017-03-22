import * as Promise from 'bluebird'

export class QueueItem {
    run : Function;
    error: Function;
    id: number;

    constructor(id: number, run: Function, error: Function) {
        this.run = run;
        this.error = error;
        this.id = id;
    }
}

export class AsyncQueue {
    queue : Array<QueueItem>;
    queuePauseTime : number;
    itemId : number;
    timer : any;

    constructor(queuePauseTime : number) {
        this.queuePauseTime = queuePauseTime;
        this.queue = [];
    }

    processQueue() {
        var item : QueueItem = this.queue.shift();
        if (item) {
            try {
                item.run();
            } catch (ex) {
                if (item.error) {
                    try {
                        item.error(ex);
                    } catch (ignore) {
                        console.error('ERROR running error fun', ex);
                    }
                } else {
                    console.error('Error processing queue item', ex)
                }
            } finally {
                this.start();
            }
        }
    }

    start() {
        let that = this;
        this.timer = window.setTimeout(() => {
            that.processQueue();
        }, this.queuePauseTime);
    }

    stop(fun : Function) {
        this.addItem(() => {            
            window.clearTimeout(this.timer);
            this.timer = null;
            fun();
        });
    }

    addItem(run : Function, error? : Function) {
        this.itemId += 1;
        this.queue.push(new QueueItem(this.itemId, run, error));
        this.start();
    }


}