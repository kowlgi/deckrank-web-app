var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');

exports.index = function(req, res, next) {
  res.render('index');
};

exports.showall = function(req, res, next) {
  StackRank.
    find().
    sort('-created_at').
    exec(function(err, stackranks) {
      res.render('showall', {
          title: 'all stackranks in the db',
          stackranks: stackranks
      });
    });
};

// Helper to extract options from the form and return an array
function getOptionsArray(d) {
  var options = [];
  for (var key in d) {
    if (key.indexOf('option') > -1) {
      if (d[key]) {
        options.push(d[key]);
      }
    }
  }
  return options;
};

exports.create = function(req, res, next) {
  new StackRank({
    title       : req.body.title,
    options     : getOptionsArray(req.body),
    created_at  : Date.now()
  }).save(function(err, stackrank, count) {
    if (err) {
      return next(err);
    }
    res.redirect('/showall');
  });
};

exports.showone = function(req, res, next) {
  StackRank.findById(req.params.id, function(err, stackrank) {
    res.render('showone', {
      stackrank: stackrank,
    })
  });
};
