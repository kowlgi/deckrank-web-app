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
app.use('/e', express.static(__dirname +'/public'));
app.use('/vote', express.static(__dirname +'/public'));
app.use('/showall', express.static(__dirname +'/public'));
app.use('/pin', express.static(__dirname +'/public'));
app.use('/unpin', express.static(__dirname +'/public'));
app.use('/explore', express.static(__dirname +'/public'));
app.disable('etag');
app.locals.moment = require('moment');

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
        {key: 't', args: 1, description: 'The tracking code for mixpanel. Invalid code = no mixpanel tracking'},
    'google_tracking_code':
        {key: 'g', args: 1, description: 'The tracking code for google analytics. Invalid code = no google analytics tracking'},
    'port':
        {key: 'p', args: 1, description: 'Port to run the app on'}
});

var db_name = "";
if (ops.db) {
    db_name = ops.db;
}

// database setup
require( './db' ).init(db_name);
var routes  = require( './index' );
var mail = require('./mail');

// Routes
app.get('/', routes.index);
app.get('/extra', routes.extra);
app.post('/create', routes.create);
app.post('/feedback', routes.feedback);
app.get('/r/:id', routes.rank);
app.post('/vote/:id', routes.vote);
app.get('/v/:id', routes.viewvotes);
app.get('/e/:id', routes.edit);
app.get('/how', routes.how);
app.get('/dashboard', routes.dashboard);
app.get('/privacy', routes.privacy);
app.get('/tos', routes.tos);
app.get('/pin/:id', routes.pin);
app.get('/unpin/:id', routes.unpin);
app.get('/featured', routes.featuredpolls);
if(ops.activate_showall_url) {
    app.get('/showall', routes.showall);
}
app.use(function(req, res) {
    console.log('Unable to find URI ' + req.url + ' redirecting back home');
    res.redirect('/');
});

if (ops.port) {
    app.set('port', ops.port);
}

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});

exports.api_key = ops.mailgun_api;
exports.email_domain = ops.email_domain;
exports.mixpanel_tracking_code = ops.mixpanel_tracking_code;
exports.google_tracking_code = ops.google_tracking_code;
