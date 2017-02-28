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
});