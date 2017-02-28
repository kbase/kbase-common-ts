import {Utils} from './Utils'

describe('Utils', () => {
    let utils = new Utils();
    it('creates a random string', () => {
        let result = utils.genId();
        expect(typeof result).toEqual('string');        
    });
});