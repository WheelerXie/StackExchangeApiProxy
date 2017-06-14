const express   = require('express'),
const Proxy     = require('./lib/proxy.js'),

//// 3 calls pre second, and max waiting time is 1 minute.
const proxy     = new Proxy(3, 1, 60);
const app       = express();
const port      = 8005;

app.get('/remaining', function (req, res) {
    var remaining = proxy.getRemaining();
    if (remaining && remaining.quota > 0) {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(JSON.stringify(remaining));
    } else {
        res.status(429).send('Quota has run out.');
    }
});
app.get('*', function (req, res) {
    proxy.get(req, res);
});

var server = app.listen(port, function () {
    var addr = server.address();
    console.log('Stack Exchange api proxy start on http://%s:%s',
        addr.address,
        addr.port);
});