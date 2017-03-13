import { Cookie } from './Cookie';

describe('Cookie', () => {
    it('Should build a simple cookie', () => {
        let builder = new Cookie('test');
        builder.setValue('test')
        let cookie = builder.toString();
        expect(cookie).toEqual('test=test');
    });
    it('Should build a simple cookie with a domain set', () => {
        let builder = new Cookie('test');
        builder.setValue('test');
        builder.setDomain('my.domain.com');
        let cookie = builder.toString();
        expect(cookie).toEqual('test=test;domain=my.domain.com');
    });
    // disable for now ... this also sets the expires, as per mdn 
    // recommendations, but makes it impossible to deterministically match
    // the resulting cookie since the precise time will be set when 
    // the cookie is built.
    // it('Should build a simple cookie with a maxAge set', () => {
    //     let builder = new Cookie('test');
    //     builder.setValue('test');
    //     builder.setMaxAge(1000);
    //     let cookie = builder.toString();
    //     expect(cookie).toEqual('test=test;max-age=1000');
    // });
    it('Should build a simple cookie with expires set', () => {
        let builder = new Cookie('test');
        builder.setValue('test');
        builder.setExpires('Wed, 21 Oct 2015 07:28:00 GMT');
        let cookie = builder.toString();
        expect(cookie).toEqual('test=test;expires=Wed, 21 Oct 2015 07:28:00 GMT');
    });
    it('Should build a simple cookie with a path set to /my/path', () => {
        let builder = new Cookie('test');
        builder.setValue('test');
        builder.setPath('/my/path');
        let cookie = builder.toString();
        expect(cookie).toEqual('test=test;path=/my/path');
    });
    it('Should build a simple cookie with the secure flag', () => {
        let builder = new Cookie('test');
        builder.setValue('test');
        builder.setSecure(true);
        let cookie = builder.toString();
        expect(cookie).toEqual('test=test;secure');
    });
    it('Should build a cookie with all options', () => {
        let builder = new Cookie('test');
        builder.setValue('test');
        builder.setDomain('my.domain.com');
        builder.setExpires('Wed, 21 Oct 2015 07:28:00 GMT');
        builder.setMaxAge(1000);
        builder.setPath('/my/path');
        builder.setSecure(true);
        let cookie = builder.toString();
        expect(cookie).toEqual('test=test;domain=my.domain.com;path=/my/path;expires=Wed, 21 Oct 2015 07:28:00 GMT;max-age=1000;secure');
    });
});