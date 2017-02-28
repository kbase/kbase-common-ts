interface AttributeValue {
    value: string | number | boolean;
}

export class AttributeMap {
    // The attrib map is simply a map of string
    // keys to a string, number, or boolean
    map : {[key : string] : any} = {};

    constructor() {
    }

    addItem(key: string, value: any) : void {
        this.map[key] = value;
    }

    removeItem(key: string) : void {
        delete this.map[key];
    }

    toString() : string {
        let that = this;
        return Object.keys(this.map).map((key) => {
            let value = that.map[key];
            let attribName =  key.replace(/[A-Z]/g, (m) => {
                return '-' + m.toLowerCase();
            });
        }).join(' ');
    }
}

type HtmlNode = null | string | number | HtmlNodeArray;

interface HtmlNodeArray extends Array<HtmlNode> {};

interface ITag {
    (attribs : AttribMap, children : HtmlNode) : string
}

// type AttribMap = {key:string, value: string | number | boolean}


interface StyleAttribMap {
    [key: string]: string
}

interface AttribMap {
    [key: string]: string | StyleAttribMap
}

export class Html {

    constructor() {        
    }

    isArray(value : any) : boolean {
        if (value instanceof Array) {
            return true;
        }
        return false;
    }
    isString(value: any) : boolean {
        if (typeof value === 'string') {
            return true;
        }
        return false;
    }

    renderChildren(children: HtmlNode) : string {
        if (children === null) {
            return '';
        }
        if (typeof children === 'string') {
            return children;
        }
        if (typeof children === 'number') {
            return String(children);
        }
        let that = this;
        return children.map((child) => {
            return that.renderChildren(child);
        }).join('');
    }

    styleAttribsToString(attribs: StyleAttribMap) : string {
        let that = this;
       
        return Object.keys(attribs).map((key) => {
            let value = attribs[key];
            let attribValue = value;
            let attribName =  key.replace(/[A-Z]/g, (m) => {
                return '-' + m.toLowerCase();
            });
            return [attribName, attribValue].join(': ');
        }).join('; ');
    }

    attribsToString(attribs: AttribMap) : string {
        let that = this;
       
        return Object.keys(attribs).map((key) => {
            let value = attribs[key];
            var attribValue;
            if (typeof value === 'string') {
                attribValue = '"' + value.replace(/"/, '""') + '"';
            } else {
                attribValue = '"' + that.styleAttribsToString(value) + '"';
            }
            let attribName =  key.replace(/[A-Z]/g, (m) => {
                return '-' + m.toLowerCase();
            });
            return [attribName, attribValue].join('=');
        }).join(' ');
    }

    // first port will only support strict arguments - attribs, children.
    tag(name: string) : ITag {
        let that = this;
        var tagFun : ITag = (attribs : AttribMap, children : HtmlNode) : string => {
            let node = '<';

            if (Object.keys(attribs).length === 0) {
                node += name;
            } else {
                let tagAttribs = that.attribsToString(attribs);
                node += [name, tagAttribs].join(' ');
            }

            node += '>';

            node += that.renderChildren(children);

            node += '</' + name + '>';

            return node;
        }
        return tagFun;
    }


    // todo: figure out how to get ts packages in here...
    genIdSerial : number = 0;
    genId() : string {
        let random = Math.floor(Math.random() * 1000);
        let time = new Date().getTime();
        if (this.genIdSerial === 1000) {
            this.genIdSerial = 0;
        }
        this.genIdSerial += 1;
        return [random, time, this.genIdSerial].map(String).join('-');
    }
}