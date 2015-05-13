var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');
var COUNT = 0;

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
    res.redirect('/rank/'+stackrank._id);
  });
};

exports.rank = function(req, res, next) {
  StackRank.findById(req.params.id, function(err, stackrank) {
      if(stackrank && stackrank.options) {
            res.render('rank', {
                options: stackrank.options,
                id : stackrank._id
            });
      }
      else {
          res.render('404', {url:req.url});
      }
  });
};

exports.vote = function(req, res, next) {
    StackRank.findById(req.params.id, function(err, stackrank) {
        if (err) {
          return next(err);
        }
        stackrank.votes.push({voter: req.body['voter'], rankings: getOptionsArray(req.body)});
        stackrank.save(function(err, stackrankvotes) {
          if (err) {
            return next(err);
          }
          res.redirect('/donevoting');
        });
    });
};

exports.donevoting = function(req, res, next) {
    res.render('donevoting');
};

exports.viewvotes = function(req, res, next) {
  StackRank.findById(req.params.id, function(err, stackrank) {
      if (err) {
        return next(err);
      }

      if(stackrank.votes) {
            res.render('viewvotes', {
                title: stackrank.title,
                votes: stackrank.votes
            });
      }
      else {
          res.render('404', {url:req.url});
      }
  });
};
