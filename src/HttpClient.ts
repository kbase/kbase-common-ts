import {HttpQuery, QueryMap} from './HttpUtils';

import * as Promise from 'bluebird';

Promise.config({
    cancellation: true
});

type HttpHeader = {[key: string] : string};

// interface HttpHeaderField {
//     name: string;
//     value: string;
// }


export class TimeoutError extends Error {
    timeout : number;
    elapsed : number;
    xhr : XMLHttpRequest;

    constructor(timeout : number, elapsed: number, message: string, xhr: XMLHttpRequest) {
        super(message);

        // A terrible hack,thanks TypeScript.
        Object.setPrototypeOf(this, TimeoutError.prototype);

        this.name = 'TimeoutError';
        this.stack = (<any> new Error()).stack;

        this.timeout = timeout;
        this.elapsed = elapsed;
        this.xhr = xhr;
    }

    toString() : string {
        if (this.message) {
            return this.message;
        }
    }
}

export class GeneralError extends Error {
    xhr : XMLHttpRequest;
    constructor(message : string, xhr: XMLHttpRequest) {
        super(message);
        
        // A terrible hack,thanks TypeScript.
        Object.setPrototypeOf(this, GeneralError.prototype);

        this.name = 'GeneralError';
        this.stack = (<any> new Error()).stack;
        
        this.xhr = xhr;
    }
    toString() : string {
        return this.message;
    }
}

export class AbortError extends Error {
    xhr : XMLHttpRequest;
    constructor(message : string, xhr: XMLHttpRequest) {
        super(message);
        Object.setPrototypeOf(this, AbortError.prototype);

        this.name = 'AbortError';
        this.stack = (<any> new Error()).stack;

        this.xhr = xhr;
    }
    toString() : string {
        return this.message;
    }
}

export interface RequestOptions {
    url: string,
    method: string,
    query?: QueryMap,
    timeout? : number,
    header?: HttpHeader,
    responseType?: string,
    withCredentials?: boolean,
    data?: null | string | Array<number>
}

export interface Response {
    status: number,
    response: string,
    header: HttpHeader
}

export class HttpClient {

    constructor() {

    }

    getHeader(xhr : XMLHttpRequest) : HttpHeader {
        let header : HttpHeader = {};
        let headerString = xhr.getAllResponseHeaders();
        if (!headerString) {
            return header;
        }
        let headerFields = headerString.split(/\n/);
        headerFields.pop();
        headerFields.forEach((field) => {
            let firstColon = field.indexOf(':', 0);
            let name = field.substr(0, firstColon).trim();
            let value = field.substr(firstColon + 1).trim();
            header[name] = value;
        });
        return header;
    }

    request(options: RequestOptions) : Promise<any> {
        let startTime = new Date().getTime();
        let that = this;
        return new Promise((resolve, reject, onCancel) => {
            let xhr = new XMLHttpRequest();
            xhr.onload = () => {
                resolve(<Response>{
                    status: xhr.status,
                    response: xhr.response,
                    header: that.getHeader(xhr)
                });
            };
            xhr.ontimeout = () => {
                var elapsed = (new Date().getTime()) - startTime;
                reject(new TimeoutError(options.timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = () => {
                reject(new GeneralError('General request error ' + options.url, xhr));
            };
            xhr.onabort = () => {
                reject(new AbortError('Request was aborted', xhr))
            };

            let url = new URL(options.url);
            if (options.query) {
                url.search = new HttpQuery(options.query).toString();
            }

            if (options.timeout) {
                xhr.timeout = options.timeout;
            }

            try {
                xhr.open(options.method, url.toString(), true);
            } catch (ex) {
                reject(new GeneralError('Error opening request', xhr));
            }

            xhr.withCredentials = options.withCredentials || false;

            try {
                if (options.header) {
                    Object.keys(options.header)
                    .filter((key) => {
                        if (options.header[key] === undefined ||
                            options.header[key] === null) {
                            return false;
                        }
                        return true;
                    })
                    .forEach((key) => {
                        // normalize value?
                        var stringValue = (function (value) {
                            switch (typeof value) {
                            case 'string': return value;
                            case 'number': return String(value);
                            case 'boolean': return String(value);
                            default:
                                throw new Error('Invalid type for header value: ' + typeof value);
                            }
                        }(options.header[key]));
                        xhr.setRequestHeader(key, stringValue);
                    });
                }

                if (typeof options.data === 'string') {
                    xhr.send(options.data);
                    if (onCancel) {
                        onCancel(() => {
                            xhr.abort();
                        });
                    }
                } else if (options.data instanceof Array) {
                    xhr.send(new Uint8Array(options.data)); 
                } else if (typeof options.data === 'undefined') {
                    xhr.send();
                } else if (options.data === null) {
                    xhr.send();
                } else {
                    reject(new Error('Invalid type of data to send: ' + typeof options.data));
                }
            } catch (ex) {
                reject(new GeneralError('Error sending data in request', xhr));
            }
        });
    }
}