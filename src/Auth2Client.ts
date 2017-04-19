import { HttpClient, GeneralError, TimeoutError, AbortError, Response, RequestOptions } from './HttpClient'
import { AuthError, AuthErrorInfo } from './Auth2Error';
import * as Promise from 'bluebird';

export class AuthClient extends HttpClient{
    constructor() {
        super();
    }

    isGeneralError(error: GeneralError) {
        return (error instanceof GeneralError)
    }

    request(options: RequestOptions) : Promise<any> {
        console.log('requesting....', options);
        return super.request(options)
            .catch(GeneralError, (err) => {
                throw new AuthError({
                    code: 'connection-error',
                    message: err.message,
                    detail: 'An error was encountered communicating with the Auth Service',
                    data: {}
                });
            })
            .catch(TimeoutError, (err) => {
                throw new AuthError({
                    code: 'timeout-error',
                    message: err.message,
                    detail: 'There was a timeout communicating with the Auth Service',
                    data: {}
                });
            })
            .catch(AbortError, (err) => {
                throw new AuthError({
                    code: 'abort-error',
                    message: err.message,
                    detail: 'The connection was aborted while communicating with the Auth Service',
                    data: {}
                });
            });

    }

}