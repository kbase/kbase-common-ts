import { HttpClient, TimeoutError, AbortError, GeneralError } from './HttpClient';

describe('Basic Test', () => {
    it('creates an httpclient object', () => {
        let client = new HttpClient();
        let valid = client instanceof HttpClient;
        expect(valid).toEqual(true);
    });
    it('Get a web page, it should be a string', (done) => {
        let client = new HttpClient();
        client.request({
            method: 'GET',
            url: 'http://localhost:8099/trigger/200'
        })
            .then((result) => {
                expect(result.status).toEqual(200);
                expect(typeof result.response).toEqual('string');
                done();
                return null;
            })
            .catch((err) => {
                console.error('error', err);
                done.fail(err);
            });
    });
    it('Get a web page which does not exist', (done) => {
        let client = new HttpClient();
        client.request({
            method: 'GET',
            url: 'http://localhost:8099/trigger/404'
        })
            .then((result) => {
                expect(result.status).toEqual(404);
                done();
                return null;
            })
            .catch((err) => {
                console.error('error', err);
                done.fail(err);
            });
    });
    it('Get a web page which does not exist', (done) => {
        let client = new HttpClient();
        client.request({
            method: 'GET',
            url: 'http://localhost:8099/trigger/400'
        })
            .then((result) => {
                expect(result.status).toEqual(400);
                done();
                return null;
            })
            .catch((err) => {
                console.error('error', err);
                done.fail(err);
            });
    });
    it('Get a web page which times out', (done) => {
        let client = new HttpClient();
        client.request({
            method: 'GET',
            url: 'http://localhost:8099/wait/2000',
            timeout: 1000
        })
            .then((result) => {
                done.fail('Should have timed out!');
                return null;
            })
            .catch(TimeoutError, (err) => {
                console.error('got timeout elapsed', err.elapsed);
                expect(err.elapsed).toBeGreaterThan(1000);
                done();
                return null;
            })
            .catch((err) => {
                console.error('error', err.message, err, err instanceof TimeoutError, TimeoutError);
                done.fail('Did not get a timeout error: ' + err.name);  
                return null;
            });
    });
     it('Request a from a non-existent host', (done) => {
        let client = new HttpClient();
        client.request({
            method: 'GET',
            url: 'http://localhost:8098'
        })
            .then((result) => {
                done.fail('Should have received a GeneralError');
                return null;
            })
            .catch(GeneralError, (err) => {
                done();
                return null;
            })
            .catch((err) => {
                done.fail('Did not get a general error: ' + err.name);  
                return null;
            });
    });
  
});