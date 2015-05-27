// database setup
var stackdb = require( './db' );
var routes  = require( './routes' );
var mail = require('./mail');
var http = require('http'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    jade = require('jade');
var app = express();
var stdio = require('stdio');

// setup express and the environment
app.set('port', process.env.PORT || 3000);
app.use(favicon(path.join(__dirname, 'static', 'images', 'favicon.png')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({
  extended: true
}));
// css, js and other public assets are under the public folder
app.use(express.static(__dirname +'/public'));
app.use('/rank', express.static(__dirname +'/public'));
app.use('/viewvotes', express.static(__dirname +'/public'));
app.use('/showall', express.static(__dirname +'/public'));
app.disable('etag');

// Routes
app.get('/', routes.index);
app.get('/extra', routes.extra);
app.post('/create', routes.create);
app.get('/showall', routes.showall);
app.get('/rank/:id', routes.rank);
app.post('/vote/:id', routes.vote);
app.get('/viewvotes/:id', routes.viewvotes);
app.use(function(req, res) {
  console.log('Unable to find URI ' + req.url + ' redirecting back home');
  res.redirect('/');
});

var ops = stdio.getopt({
    'port':
        {key: 'p', args: 1, description: 'Port to run the app on'},
    'mailgun_api':
        {key: 'm', args: 1, description: 'The mailgun API key'},
    'email_domain':
        {key: 'e', args: 1, description: 'The deckrank email domain'},
    'db':
        {key: 'd', args: 1, description: 'The stackrank db' /*, mandatory: true */},
    'reset_db':
        {key: 'r', args: 1, description: 'Reset stackrank db'},
    'rank_id_salt':
        {key: 's', args: 1, description: 'The salt for encoding/decoding rank ID'/*, mandatory: true */},
    'vote_id_salt':
        {key: 'v', args: 1, description: 'The salt for encoding/decoding viewvotes ID'/*, mandatory: true */},
    'mixpanel_tracking_code':
        {key: 't', args: 1, description: 'The tracking code for logging events to mixpanel'}
});

var api_key = 0;
var email_domain = 0;
var db = "";
var rank_id_salt = 0;
var vote_id_salt = 0;
var mixpanel_tracking_code = 0;

if (ops.port) {
    app.set('port', ops.port);
}

if (ops.mailgun_api && ops.email_domain) {
    api_key = ops.mailgun_api;
    email_domain = ops.email_domain;
};

if (ops.db) {
    db_name = ops.db;
}

if (ops.reset_db) {
    stackdb.StackRankModel.collection.remove();
}

if (ops.rank_id_salt) {
    rank_id_salt = ops.rank_id_salt;
}

if (ops.vote_id_salt) {
    vote_id_salt = ops.vote_id_salt;
}

if (ops.mixpanel_tracking_code) {
    mixpanel_tracking_code = ops.mixpanel_tracking_code;
}

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});

exports.api_key = api_key;
exports.email_domain = email_domain;
exports.db_name = db;
exports.rank_id_salt = rank_id_salt;
exports.vote_id_salt = vote_id_salt;
exports.mixpanel_tracking_code = mixpanel_tracking_code;
