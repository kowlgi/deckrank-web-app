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
    jade = require('jade'),
    config = require('./config');
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

// database setup
require( './db' ).init(config.db);
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
if(config.activate_showall_url) {
    app.get('/showall', routes.showall);
}
app.use(function(req, res) {
    console.log('Unable to find URI ' + req.url + ' redirecting back home');
    res.redirect('/');
});

app.set('port', config.port);

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});

exports.api_key = config.mailgun_api;
exports.email_domain = config.email_domain;
exports.mixpanel_tracking_code = config.mixpanel_tracking_code;
exports.google_tracking_code = config.google_tracking_code;
exports.recaptcha_key = config.recaptcha_key;
