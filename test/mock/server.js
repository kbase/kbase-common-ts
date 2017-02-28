'use strict';

var http = require('http');

var PORT = 8099;

function enableCors(response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
}

function handleTrigger(args, request, response) {
    var responseCode = parseInt(args[0]);
    console.log('Mocking ' + String(responseCode));
    response.writeHead(responseCode, 'MOCK of ' + String(responseCode));
    response.end();
}

function handleWait(args, request, response) {
    var timeToWait = parseInt(args[0]);
    console.log('Mocking a wait of ' + timeToWait + ' ms');
    setTimeout(function () {
        response.writeHead(200, 'Mock of waiting for ' + timeToWait);
        response.end();
    }, timeToWait);
}

function handleRequest(request, response) {
    // console.log('got request', request);
    var path = request.url.split('/').slice(1);
    var action = path[0];
    enableCors(response);
    switch (action) {
    case 'trigger':
        handleTrigger(path.slice(1), request, response);
        break;
    case 'wait': 
        handleWait(path.slice(1), request, response);
        break;
    default:
        response.writeHead(400, 'Invalid request: ' + request.url);
        response.end();
    }
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log('Mock server started on ' + PORT);
});