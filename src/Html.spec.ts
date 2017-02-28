import {Html, AttributeMap} from './Html';

describe('Unit testing of html builder', () => {
    it('Should build a simple query of one field', () => {
        let html = new Html();

        let div = html.tag('div');
        let result = div({}, 'a div tag');

        expect(result).toEqual('<div>a div tag</div>');        
    });
    it('Should build a simple query of one field one attribute', () => {
        let html = new Html();

        let div = html.tag('div');
        let result = div({class: 'hi'}, 'a div tag');

        expect(result).toEqual('<div class="hi">a div tag</div>');        
    });
    it('Should build a simple query of one field one attribute, convert attrib key camelCase to hyphen', () => {
        let html = new Html();

        let div = html.tag('div');
        let result = div({myAttrib: 'hi'}, 'a div tag');

        expect(result).toEqual('<div my-attrib="hi">a div tag</div>');        
    });

    it('Should build a simple query of one field multiple attributes', () => {
        let html = new Html();

        let div = html.tag('div');
        let result = div({
            class: 'hi',
            name: 'alfred'
        }, 'a div tag');

        expect(result).toEqual('<div class="hi" name="alfred">a div tag</div>');        
    });

    it('Should build a simple query of one field style nested attribute', () => {
        let html = new Html();

        let div = html.tag('div');
        let result = div({
            style: {
                width: '100px'
            }
        }, 'a div tag');

        expect(result).toEqual('<div style="width: 100px">a div tag</div>');        
    });

    it('Should build a more complex structure', () => {
        let html = new Html();

        let div = html.tag('div');
        let span = html.tag('span');
        let result = div({
            style: {
                width: '100px'
            }
        }, [
            div({}, span({}, 'I am a span!')),
            div({}, 'And I am not :(')
        ]);

        expect(result).toEqual('<div style="width: 100px"><div><span>I am a span!</span></div><div>And I am not :(</div></div>');        
    });
     it('Should generate a random string id', () => {
        let html = new Html();

        let id = html.genId();

        expect(typeof id).toEqual('string');
    });
});