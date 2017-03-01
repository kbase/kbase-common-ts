export class Cookie {
    name: string;

    reservedKeys: string[] = [
        'expires',
        'max-age',
        'path',
        'domain',
        'secure'
    ];

    value: string;
    expires?: string;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    noEncode: boolean = false;

    constructor(name: string) {
        if (this.reservedKeys.indexOf(name.toLowerCase()) >= 0) {
            throw new Error('Cookie key invalid, must not be one of ' + this.reservedKeys.join(', '));
        }
        if (name.match(/;/) || name.match(/=/)) {
            throw new Error('Cookie name may not contain a ; or =');
        }
        this.name = name;
    }

    setValue(value: string) : Cookie{
        if (value.match(/;/) || value.match(/=/)) {
            throw new Error('Cookie value may not contain a ; or =');
        }
        this.value = value;
        return this;
    }

    setExpires(expires: string) : Cookie{
        if (expires.match(/;/)) {
            throw new Error('Cookie parameter value may not contain a ;');
        }
        this.expires = expires;
        return this;
    }

    setDomain(domain: string) : Cookie{
        if (domain.match(/;/)) {
            throw new Error('Cookie parameter value may not contain a ;');
        }
        this.domain = domain;
        return this;
    }

    setMaxAge(maxAge: number) : Cookie {
        this.maxAge = maxAge;
        return this;
    }

    setPath(path: string) : Cookie {
        if (path.match(/;/)) {
            throw new Error('Cookie parameter value may not contain a ;');
        }
        this.path = path;
        return this;
    }

    setSecure(secure: boolean) : Cookie {
        this.secure = secure;
        return this;
    }

    setNoEncode(noEncode: boolean) : Cookie {
        this.noEncode = noEncode;
        return this;
    }

    toString(): string {
        var cookieProps: any[] = [];

        if (typeof this.domain !== 'undefined') {
            cookieProps.push({
                key: 'domain',
                value: this.domain
            });
        }
        if (typeof this.path !== 'undefined') {
            cookieProps.push({
                key: 'path',
                value: this.path
            });
        }
        if (typeof this.expires !== 'undefined') {
            cookieProps.push({
                key: 'expires',
                value: this.expires
            });
        }
        if (typeof this.maxAge !== 'undefined') {
            cookieProps.push({
                key: 'max-age',
                value: String(this.maxAge)
            });
        }
        if (typeof this.secure !== 'undefined') {
            cookieProps.push({
                key: 'secure'
            });
        }

        var cookieString = [[
            this.name,
            this.value
        ].join('=')]
            .concat(cookieProps.map(function (prop) {
                return [prop.key, prop.value]
                    .filter((item) => {
                        return typeof item === 'undefined' ? false : true;
                    })
                    .join('=');
            }))
            .join(';');
        return cookieString;
    }

}


export class CookieManager {
    // fields
    global: Document;

    // constructor(s)
    constructor() {
        this.global = document;
    }

    // methods
    importCookies() {
        var cookieString = this.global.cookie;
        if (cookieString.length > 0) {
            return cookieString.split(/;/)
                .map(function (cookie) {
                    var pieces = cookie.split('=');
                    var name = pieces[0].trim();
                    var value = pieces[1].trim();
                    return {
                        name: name,
                        value: decodeURIComponent(value)
                    };
                });
        } else {
            return [];
        }
    }

    getCookies() {
        return this.importCookies();
    }

    findCookies(key: string) {
        var cookies = this.importCookies();
        return cookies.filter(function (cookie) {
            if (cookie.name === key) {
                return true;
            }
        });
    }

    getItem(key: string): string | null {
        if (!key) {
            return null;
        }
        var cookie = this.findCookies(key);
        // console.log('cookie???', cookie);
        if (cookie.length > 1) {
            throw new Error('Too many cookies returned, expected 1');
        }
        if (cookie.length === 0) {
            return null;
        }
        return cookie[0].value;
    }

    newCookie(key: string) {
        return new Cookie(key);
    }

    setItem(item: Cookie): void {
        document.cookie = item.toString();
    }

    removeItem(item: Cookie) : void {
        let deletionCookie = new Cookie(item.name)
            .setPath(item.path)
            .setValue('*')
            .setExpires(new Date('1970-01-01T00:00:00Z').toUTCString());
        if (item.domain) {
            deletionCookie.setDomain(item.domain);
        }
        this.setItem(deletionCookie);
    }

}