import {HttpQuery} from './HttpUtils';

describe('Unit testing of http query builder', () => {
    it('Should build a simple query of one field', () => {
        let query = new HttpQuery();
        query.addField('field1', 'value1');
        let result = query.toString();
        expect(result).toEqual('field1=value1');        
    });
     it('Should build a simple query of two fields', () => {
        let query = new HttpQuery();
        query.addField('field1', 'value1');
        query.addField('field2', 'value2');
        let result = query.toString();
        expect(result).toEqual('field1=value1&field2=value2');        
    });
    it('Should build a simple query of two fields and then delete one', () => {
        let query = new HttpQuery();
        query.addField('field1', 'value1');
        query.addField('field2', 'value2');
        let result1 = query.toString();
        query.removeField('field1');
        let result2 = query.toString();
        expect(result1).toEqual('field1=value1&field2=value2')
        expect(result2).toEqual('field2=value2');        
    });
});
