var http = require('http'),
    express = require('express'),
    path = require('path'),
    mongojs = require('mongojs'),
    favicon = require('serve-favicon');
    jade = require('jade');

var dbx = mongojs('db', ['rozinah']);
var app = express();
app.set('port', process.env.PORT || 3000);
app.use(favicon(path.join(__dirname,'static','images','favicon.ico')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('index');
});

app.use(function(req, res) {
    // Pass the requested invalid url to the 404 jade template
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express listening on port ' + app.get('port'));
});
