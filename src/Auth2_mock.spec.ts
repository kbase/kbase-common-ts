import { Auth2 } from './Auth2';
import { HttpClient } from './HttpClient'


function makeMockClient() {
    return new Auth2({
        baseUrl: 'http://localhost:4000'
    });
}

function setup(setups) {
    let http = new HttpClient();

    return http.request({
        method: 'POST',
        url: 'http://localhost:4000/setup',
        withCredentials: true,
        data: JSON.stringify(setups)
    });
}

describe('Auth2', () => {

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
                console.error('ERR', err);
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
                if (err.code === '10020') {
                    done();
                } else {
                    console.warn('error data', err.data);
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

    // // REMOVE LINK

    it('Unlinks an identity from a token (mock)', (done) => {
        let auth2 = makeMockClient();

        auth2.removeLink('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', {
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

    it('Unlinks an identity with a bad token (mock)', (done) => {
        let auth2 = makeMockClient();

        auth2.removeLink('ABCDEFGHIJKLMNOPQRSTUVWXYZ234560', {
            identityId: 'VALIDID'
        })
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                expect(err.code).toEqual('10020');
                done();
                return null;
            });
    });

    it('Unlinks an identity with a token not linked to any account (mock)', (done) => {
        let auth2 = makeMockClient();
        auth2.removeLink('ABCDEFGHIJKLMNOPQRSTUVWXYZ234566', {
            identityId: 'VALIDID'
        })
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                expect(err.code).toEqual('50000');
                done();
                return null;
            });
    });

    it('Unlinks an identity with a token linked to a disabled account (mock)', (done) => {
        let auth2 = makeMockClient();
        auth2.removeLink('ABCDEFGHIJKLMNOPQRSTUVWXYZ234565', {
            identityId: 'VALIDID'
        })
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                expect(err.code).toEqual('20010');
                done();
                return null;
            });
    });

    it('Unlinks an identity with a bad id - not linked (mock)', (done) => {
        let auth2 = makeMockClient();
        auth2.removeLink('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', {
            identityId: 'NOTLINKED'
        })
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                expect(err.code).toEqual('60010');
                done();
                return null;
            });
    });

    it('Unlinks an identity with a bad id - not linked (mock)', (done) => {
        let auth2 = makeMockClient();
        auth2.removeLink('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', {
            identityId: 'LASTID'
        })
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                expect(err.code).toEqual('60010');
                done();
                return null;
            });
    });



    // Linking
    it('Link an ext auth to an account', (done) => {
        let auth2 = makeMockClient();
        // a simple valid base32 string
        let token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let id = 'VALIDID';

        let http = new HttpClient();

        let setups = [
            ['set-cookie', 'in-process-token=VALIDTOKEN;path=/']
        ];

        http.request({
            method: 'POST',
            url: 'http://localhost:4000/setup',
            withCredentials: true,
            data: JSON.stringify(setups)
        })
            .then(function (result) {
                return auth2.linkPick(token, id)
            })
            .then(function (info) {
                expect(true).toEqual(true);
                done();
                return null;
            })
            .catch(function (err) {

                console.error('ERR', JSON.stringify(err));
                done.fail(err.message);
                return null;
            });
    });

    // Linking
    it('Login pick', (done) => {
        let auth2 = makeMockClient();

        let data = {
            identityId: 'VALIDID',
            linkAll: true,
            agreements: [{
                id: 'some-policy',
                version: 1
            }, {
                id: 'another-policy',
                version: 3
            }]
        };

        let setups = [
            ['set-cookie', 'in-process-token=ABCDEFGHIJKLMNOPQRSTUVWXYZ234567;path=/']
        ];

        let http = new HttpClient();
        setup(setups)
            .then(function (result) {
                return auth2.loginPick(data);
            })
            .then(function (info) {
                expect(true).toEqual(true);
                done();
                return null;
            })
            .catch(function (err) {
                console.error('ERR', JSON.stringify(err));
                done.fail(err.message);
                return null;
            });
    });

    it('Login pick 2', (done) => {
        let auth2 = makeMockClient();

        let data = {
            identityId: 'VALIDID',
            linkAll: true,
            agreements: [{
                id: 'some-policy',
                version: 1
            }, {
                id: 'another-policy',
                version: 3
            }]
        }

        let setups = [
            ['set-cookie', 'in-process-token=ABCDEFGHIJKLMNOPQRSTUVWXYZ234560;path=/']
        ];

        setup(setups)
            .then(function (result) {
                return auth2.loginPick(data);
            })
            .then(function (info) {
                done.fail('Should have failed');
                return null;
            })
            .catch(function (err) {
                console.error(err);
                expect(err.code).toEqual('10020');
                done();
                return null;
            });
    });

    // // It isn't possible to really test the login start flow, but we can
    // // simulate a POST and the mock server will ensure that we are sending the right info.
    // it('simulates login', (done) => {
    //     let auth2 = makeMockClient();
    //     auth2.loginStart({
    //         node: document.body,
    //         provider: 'Globus',
    //         redirectUrl: 'http://localhost:6666/valid/path',
    //         stayLoggedIn: false
    //     })
    //     .then(function (result) {
    //         done();
    //     })
    //     .catch(function (err) {
    //         done.fail(err.message);
    //     })
    // })
});