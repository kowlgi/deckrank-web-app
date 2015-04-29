// database setup
require( './db' );

var routes  = require( './routes' );
var http = require('http'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    jade = require('jade');
var app = express();

// setup express and the environment
app.set('port', process.env.PORT || 3000);
app.use(favicon(path.join(__dirname, 'static', 'images', 'favicon.ico')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Routes
app.get('/', routes.index);
app.post('/create', routes.create);
app.get('/showall', routes.showall);
app.get( '/showone/:id', routes.showone);
app.use(function(req, res) { res.render('404', {url:req.url}); });

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});
