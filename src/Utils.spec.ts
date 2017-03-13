import {Utils} from './Utils'

describe('Utils', () => {
    let utils = new Utils();
    it('creates a random string', () => {
        let result = utils.genId();
        expect(typeof result).toEqual('string');        
    });

     it('generates a random string many times', () => {
        let result;
        for (var i = 0; i < 10000; i += 1) {
             result = utils.genId();
        }
        expect(typeof result).toEqual('string');        
    });
});