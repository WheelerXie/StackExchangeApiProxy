const zlib          = require("zlib");
const url           = require('url');
const request       = require('request');
const util          = require('./util');
const LeakyBucket   = require('leaky-bucket');

const API_HOST      = 'https://api.stackexchange.com/2.2';
const KEY           = 'U4DMV*8nvpm3EOpvf69Rxw((';
const FILTER        = '!2A0-v5UBDmmwxW7.bCa1B2(CRTvt)xgn3I(Bp_rXLmPvy*7lLbcWOD';

var remaining;

function getUTCDate() {
    var time = Math.floor(Date.now() / 1000);
    return parseInt(time / 3600 / 24) * 3600 * 24;
}
function initializeRemaining() {
    var orignal = remaining;
    remaining = {
        date: getUTCDate(),
        quota: 10000
    };
    console.log('initialized remaining',
        orignal || 'N/A',
        remaining);
}
function updateRemaining(quota) {
    if (quota) {
        var orignal = remaining;
        remaining = {
            date: getUTCDate(),
            quota: quota
        };
        console.log('updated remaining',
            orignal || 'N/A',
            remaining);
    }
}

module.exports = function (capacity, interval, maxWaitingTime) {
    var bucket = new LeakyBucket(capacity, interval, maxWaitingTime);
    initializeRemaining();

    this.get = function (req, res) {
        var path = url.parse(req.url).pathname;
        var parameters = util.generateQuestionFilter(req.query);

        if (parameters) {
            bucket.throttle(function (err) {
                if (err) {
                    res.status(429).send('too many requests!');
                }
                else {
                    parameters.key = parameters.key || KEY;
                    parameters.filter = parameters.filter || FILTER;
                    console.log('request', API_HOST + path, parameters);
                    request({
                        method: 'get',
                        url: API_HOST + path,
                        qs: parameters,
                        gzip: true
                    }, function (err, response, body) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            try {
                                var data = JSON.parse(body);
                                updateRemaining(data.quota_remaining);
                                res.setHeader('Content-Type', 'application/json');
                                res.status(200).send(body);
                            } catch (err) {
                                res.status(500).send(err);
                            }
                        }
                    });
                }
            });
        } else {
            res.status(500).send('invalid parameters');
        }
    };

    this.getRemaining = function () {
        var date = getUTCDate();
        if (date > remaining.date) {
            initializeRemaining();
        }
        return remaining;
    }
}