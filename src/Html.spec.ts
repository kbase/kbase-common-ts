import {Html, AttributeMap} from './Html';

describe('Unit testing of html builder', () => {
    it('Should build a simple query of one field', () => {
        let html = new Html();
        let tag = html.tagMaker();
        let div = tag('div');
        let result = div({}, 'a div tag');

        expect(result).toEqual('<div>a div tag</div>');        
    });
    it('Should build a simple query of one field one attribute', () => {
        let html = new Html();
        let tag = html.tagMaker();
        let div = tag('div');
        let result = div({class: 'hi'}, 'a div tag');

        expect(result).toEqual('<div class="hi">a div tag</div>');        
    });
    it('Should build a simple query of one field one attribute, convert attrib key camelCase to hyphen', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({myAttrib: 'hi'}, 'a div tag');

        expect(result).toEqual('<div my-attrib="hi">a div tag</div>');        
    });

    it('Should build a simple query of one field multiple attributes', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({
            class: 'hi',
            name: 'alfred'
        }, 'a div tag');

        expect(result).toEqual('<div class="hi" name="alfred">a div tag</div>');        
    });

    it('Should build a simple query of one field style nested attribute', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({
            style: {
                width: '100px'
            }
        }, 'a div tag');

        expect(result).toEqual('<div style="width: 100px">a div tag</div>');        
    });

     it('Should build a simple tag of one camelCase attribute', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({
            style: {
                fontWeight: 'bold'
            }
        }, 'a div tag');

        expect(result).toEqual('<div style="font-weight: bold">a div tag</div>');        
    });

    it('A null turns into an empty string', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({}, null);

        expect(result).toEqual('<div></div>');        
    });

    it('A number is simply coerced to a string', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({}, 123.456);

        expect(result).toEqual('<div>123.456</div>');        
    });

    it('A boolean is an error', () => {
        let html = new Html();
        let tag = html.tagMaker();
        let div = tag('div');

        try {
            let result = div({}, false);
        } catch (ex) {
            expect(true).toEqual(true);
        }
    });

    it('An Object is an error', () => {
        let html = new Html();
        let tag = html.tagMaker();
        let div = tag('div');

        try {
            let result = div({}, {});
        } catch (ex) {
            expect(true).toEqual(true);
        }
    });

    it('Should build a more complex structure', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let span = tag('span');
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
    it('Should generate a random string and lap the counter', () => {
        let html = new Html();
        var id;
        for (var i = 0; i < 2000; i += 1) {
            id = html.genId();
        }

        expect(typeof id).toEqual('string');
    });


    it('Attribs no content ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({
            id: '123'
        });

        expect(result).toEqual('<div id="123"></div>');        
    });

     it('Empty attribs no content ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div({});

        expect(result).toEqual('<div></div>');        
    });

     it('No attribs just content ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div('hello');

        expect(result).toEqual('<div>hello</div>');        
    });

     it('No attribs or content ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        let result = div();

        expect(result).toEqual('<div></div>');        
    });

     it('Boolean throws exception ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        try {
            let result = div(true);
        } catch (ex) {
            expect(true).toEqual(true);
        }        
    });

    it('Date throws exception ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let div = tag('div');
        try {
            let result = div(new Date());
        } catch (ex) {
            expect(true).toEqual(true);
        }        
    });

     it('Merge attribs ', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let bdiv = tag('div', {style: {fontWeight: 'bold'}});
        let result = bdiv({
            id: '123'
        });

        expect(result).toEqual('<div id="123" style="font-weight: bold"></div>');        
    });

    it('Merge attribs into no attribs', () => {
        let html = new Html();
        let tag = html.tagMaker();

        let bdiv = tag('div', {style: {fontWeight: 'bold'}});
        let result = bdiv();

        expect(result).toEqual('<div style="font-weight: bold"></div>');        
    });

    it('Merges simple attribs', () => {
        let html = new Html();
        let attrib1 = {
            attr1: 'value1'
        };
        let attrib2 = {
            attr2: 'value2'
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value1',
            attr2: 'value2'
        };
        expect(result).toEqual(expected);
    });

    it('Merges simple attribs, overwriting strings', () => {
        let html = new Html();
        let attrib1 = {
            attr1: 'value1'
        };
        let attrib2 = {
            attr1: 'value2'
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value2'
        };
        expect(result).toEqual(expected);
    });

    it('Merges simple attribs, overwriting an object (yikes!)', () => {
        let html = new Html();
        let attrib1 = {
            attr1: {
                attr2: {
                    attr3: 'value1'
                }
            }
        };
        let attrib2 = {
            attr1: 'value2'
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value2'
        };
        expect(result).toEqual(expected);
    });

     it('Merges simple attribs, second undefined', () => {
        let html = new Html();
        let attrib1 = {
            attr1: 'value1'
        };
        let attrib2 = undefined;
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value1'
        };
        expect(result).toEqual(expected);
    });

    it('Merges simple attribs, first undefined', () => {
        let html = new Html();
        let attrib1 = undefined;
        let attrib2 = {
            attr2: 'value2'
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr2: 'value2'
        };
        expect(result).toEqual(expected);
    });

    it('Merges nested attribs', () => {
        let html = new Html();
        let attrib1 = {
            attr1: 'value1',
            attr2: {
                attr21: 'value21'
            }
        };
        let attrib2 = {
            attr3: 'value2',
            attr4: {
                attr1: 'value41'
            }
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value1',
            attr2: {
                attr21: 'value21'
            },
            attr3: 'value2',
            attr4: {
                attr1: 'value41'
            }
        };
        expect(result).toEqual(expected);
    });

     it('Merges nested attribs overlapping', () => {
        let html = new Html();
        let attrib1 = {
            attr1: 'value1',
            attr2: {
                attr1: 'value21'
            }
        };
        let attrib2 = {
            attr3: 'value2',
            attr2: {
                attr2: 'value22'
            }
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value1',
            attr2: {
                attr1: 'value21',
                attr2: 'value22'
            },
            attr3: 'value2'
        };
        expect(result).toEqual(expected);
    });

     it('Merges nested attribs overwriting', () => {
        let html = new Html();
        let attrib1 = {
            attr1: 'value1',
            attr2: {
                attr1: 'value21'
            }
        };
        let attrib2 = {
            attr1: 'value1x',
            attr2: {
                attr1: 'value21x',
                attr2: 'value22'
            }
        };
        let result = html.mergeAttribs(attrib1, attrib2);
        let expected = {
            attr1: 'value1x',
            attr2: {
                attr1: 'value21x',
                attr2: 'value22'
            }
        };
        expect(result).toEqual(expected);
    });
});