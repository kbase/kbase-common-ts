import { Auth2 } from './Auth2';

function makeClient() {
    return new Auth2({
        cookieName: 'kbase_session',
        extraCookies: [{
            name: 'kbase_session_backup',
            domain: 'authdev.kbase.us'
        }],
        baseUrl: 'https://authdev.kbase.us/services/auth',
        providers: [
            {
                id: 'Globus',
                label: 'Globus'
            },
            {
                id: 'Google',
                label: 'Google'
            }
        ]
    });
}

function makeMockClient() {
    return new Auth2({
        cookieName: 'kbase_session',
        extraCookies: [{
            name: 'kbase_session_backup',
            domain: 'localhost'
        }],
        baseUrl: 'http://localhost:3000',
        providers: [
            {
                id: 'Globus',
                label: 'Globus'
            },
            {
                id: 'Google',
                label: 'Google'
            }
        ]
    });
}

describe('Auth2', () => {
    it('Build an auth2 object and get back the configuration', () => {
        let auth2 = makeClient();

        let providers = auth2.getProviders();
        let expected = [{
            id: 'Globus',
            label: 'Globus'
        },
        {
            id: 'Google',
            label: 'Google'
        }
        ];
        expect(providers).toEqual(expected);
    });

    it('Gets the token info for a valid token', (done) => {
        let auth2 = makeClient();
        let token = 'TZZEWGHJ6BT7ECOBJZUFHJSRZEZ7SBAK';
        auth2.getTokenInfo(token)
            .then(function (info) {
                expect(true).toEqual(true);
                done();
                return null;
            })
            .catch(function (err) {
                done.fail(err.message);
                return null;
            });
    });

    it('Gets the token info for a valid token (mock)', (done) => {
        let auth2 = makeMockClient();
        // a simple valid base32 string
        let token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        auth2.getTokenInfo(token)
            .then(function (info) {
                expect(true).toEqual(true);
                done();
                return null;
            })
            .catch(function (err) {                
                done.fail(err.message);
                return null;
            });
    }); 

    it('Gets the token info for an invalid token (mock)', (done) => {
        let auth2 = makeMockClient();
        // a simple valid base32 string with the final character swapped to 0,
        // an invalid character
        let token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234560';
        auth2.getTokenInfo(token)
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                if (err.code === '10011') {
                    done();
                } else {
                    done.fail('Unexpected error ' + err.code + ':' + err.message);
                }
                return null;
            });
    });

     it('Gets the token info without token (mock)', (done) => {
        let auth2 = makeMockClient();
        let token = undefined;
        auth2.getTokenInfo(token)
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                if (err.code === '10010') {
                    done();
                } else {
                    done.fail('Unexpected error ' + err.code + ':' + err.message);
                }
                return null;
            });
    });

    it('Gets the token info without matching user (mock)', (done) => {
        let auth2 = makeMockClient();
        let token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234566';
        auth2.getTokenInfo(token)
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                if (err.code === '50000') {
                    done();
                } else {
                    done.fail('Unexpected error ' + err.code + ':' + err.message);
                }
                return null;
            });
    });

    it('Gets the token linked to a disabled account (mock)', (done) => {
        let auth2 = makeMockClient();
        let token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234565';
        auth2.getTokenInfo(token)
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                if (err.code === '20010') {
                    done();
                } else {
                    done.fail('Unexpected error ' + err.code + ':' + err.message);
                }
                return null; 
            });
    });

    it('Unlinks an identity from a token (mock)', (done) => {
        let auth2 = makeMockClient();

        auth2.removeLink('VALIDTOKEN', {
            identityId: 'VALIDID'
        })
            .then(function (info) {
                done();
                return null;
            })
            .catch(function (err) {
                done.fail(err.message);
                return null;
            });
    });
});