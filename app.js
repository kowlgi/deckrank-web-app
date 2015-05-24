// database setup
var stackdb = require( './db' );
var routes  = require( './routes' );
var http = require('http'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    jade = require('jade');
var app = express();
var stdio = require('stdio');
var mailgun;

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
app.post('/create', routes.create);
app.get('/showall', routes.showall);
app.get('/rank/:id', routes.rank);
app.post('/vote/:id', routes.vote);
app.get('/viewvotes/:id', routes.viewvotes);
app.use(function(req, res) {
  res.redirect('/');
});

var ops = stdio.getopt({
    'reset_db':
        {key: 'r', args: 1, description: 'Reset stackrank db'},
    'port':
        {key: 'p', args: 1, description: 'Port to run the app on'},
    'mailgun_api':
        {key: 'm', args: 1, description: 'The mailgun API key'}
});

if (ops.reset_db) {
    stackdb.StackRankModel.collection.remove();
}

if (ops.port) {
  app.set('port', ops.port);
}
if (ops.mailgun_api) {
  console.log('Successfully setup mail');
  var api_key = ops.mailgun_api;
  var domain = 'mg.deckrank.co';
  mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
  var data = {
    from: 'deckrank.co <postmaster@mg.deckrank.co>',
    to: 'hareesh.nagarajan@gmail.com',
    subject: 'Hello',
    text: 'Testing some Mailgun awesomness!'
  };
  /*
  // Uncomment to send email ...
  mailgun.messages().send(data, function (error, body) {
    console.log(body);
  });
  */
} else {
  console.log('Running without mail support');
}

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});
