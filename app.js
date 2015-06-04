/*!
 * app.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */
var http = require('http'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    jade = require('jade');
var app = express();

// setup express and the environment
app.set('port', process.env.PORT || 3000);
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.png')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({
  extended: true
}));

// css, js and other public assets are under the public folder
app.use(express.static(__dirname +'/public'));
app.use('/r', express.static(__dirname +'/public'));
app.use('/v', express.static(__dirname +'/public'));
app.use('/showall', express.static(__dirname +'/public'));
app.disable('etag');

var stdio = require('stdio');
var ops = stdio.getopt({
    'db':
        {key: 'd', args: 1, description: 'The deckrank db name', mandatory: true},
    'mailgun_api':
        {key: 'm', args: 1, description: 'The mailgun API key. Invalid API = no email notifications'},
    'activate_showall_url':
        {key: 's', args: 0, description: 'Make the showall url active. DO NOT USE THIS IN PRODUCTION'},
    'email_domain':
        {key: 'e', args: 1, description: 'The deckrank email domain. Invalid domain = no email notifications'},
    'mixpanel_tracking_code':
        {key: 't', args: 1, description: 'The tracking code for logging events to mixpanel. Invalid code = no mixpanel tracking'},
    'port':
        {key: 'p', args: 1, description: 'Port to run the app on'}
});

var db_name = "";
if (ops.db) {
    db_name = ops.db;
}

// database setup
require( './db' ).init(db_name);
var routes  = require( './routes' );
var mail = require('./mail');

// Routes
app.get('/', routes.index);
app.get('/extra', routes.extra);
app.post('/create', routes.create);
app.post('/feedback', routes.feedback);
app.get('/r/:id', routes.rank);
app.post('/vote/:id', routes.vote);
app.get('/v/:id', routes.viewvotes);
if(ops.activate_showall_url) {
    app.get('/showall', routes.showall);
}
app.use(function(req, res) {
    console.log('Unable to find URI ' + req.url + ' redirecting back home');
    res.redirect('/');
});

var api_key = "";
var email_domain = "";
if (ops.mailgun_api && ops.email_domain) {
    api_key = ops.mailgun_api;
    email_domain = ops.email_domain;
};

var mixpanel_tracking_code = "";
if (ops.mixpanel_tracking_code) {
    mixpanel_tracking_code = ops.mixpanel_tracking_code;
}

if (ops.port) {
    app.set('port', ops.port);
}

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});

exports.api_key = api_key;
exports.email_domain = email_domain;
exports.mixpanel_tracking_code = mixpanel_tracking_code;
