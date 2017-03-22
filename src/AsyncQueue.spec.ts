import {AsyncQueue} from './AsyncQueue'

describe('Async Queue Tests', () => {
    it('add item and have it run ', (done) => {
        let queue = new AsyncQueue(100);
        queue.addItem(() => {
            expect(true).toEqual(true);
            done();
        }, (err) => {
            done.fail('Error running queue item');
        });        
    });

     it('add item and have it run with error ', (done) => {
        let queue = new AsyncQueue(100);
        queue.addItem(() => {
            throw new Error('hi');
        }, (err) => {
            expect(true).toEqual(true);
            done();
        });
     });

     it('add item and have it run with error without handler', (done) => {
        let queue = new AsyncQueue(100);
        spyOn(console, 'error');
        queue.addItem(() => {
            throw new Error('hi');
        });
        queue.addItem(() => {
            expect(console.error).toHaveBeenCalled();
            done();
        })
     });

     it('add item and have it run with error and erroneous handler', (done) => {
        let queue = new AsyncQueue(100);
        spyOn(console, 'error');
        queue.addItem(() => {
            throw new Error('hi');
        }, (err) => {
            throw new Error('bad handler');
        });
        queue.addItem(() => {
            expect(console.error).toHaveBeenCalled();
            done();
        })
     });

    it('create, run, stop ', (done) => {
        let queue = new AsyncQueue(100);
        queue.addItem(() => {
            // noop
        }, (err) => {
            done.fail('Error running queue item');
        });
        queue.stop(() => {
            expect(true).toEqual(true);
            done();
        });
    });
});