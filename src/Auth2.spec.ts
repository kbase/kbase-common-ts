import {Auth2} from './Auth2';

describe('Auth2', () => {
    it('Build an auth2 object and get back the configuration', () => {
        let auth2 = new Auth2({
            cookieName: 'mycookie',
            baseUrl: 'https://authdev.kbase.us',
            endpoints: {
                introspect: '/api/V2/token',
                profile: '/api/V2/me',
                loginStart: '/login/start',
                logout: '/logout',
                loginChoice: '/login/choice',
                loginCreate: '/login/create',
                loginPick: '/login/pick'
            },
            providers: [{
                    id: 'Globus',
                    label: 'Globus'
                },
                {
                    id: 'Google',
                    label: 'Google'
                }
            ]
        });

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
});