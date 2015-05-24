var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');
var Hash = require('../hash');
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
            title: 'All stackranks in the db',
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
 var stackrank = new StackRank({
    title       : req.body.title,
    email       : req.body.email,
    description : req.body.description,
    options     : getOptionsArray(req.body),
    created_at  : Date.now()
  }).save(function(err, stackrank, count) {
    if (err) {
        console.log(err);
        return next(err);
    }

    res.redirect('/rank/' + stackrank.rankid);
  });

};

exports.rank = function(req, res, next) {
    StackRank.findById(Hash.Rankid.decodeHex(req.params.id), function(err, stackrank) {
      if(stackrank && stackrank.options) {
            res.render('rank', {
                title  : stackrank.title,
                options: stackrank.options,
                rankid : stackrank.rankid
            });
      }
      else {
          res.render('404', {url:req.url});
      }
    });
};

var compareRankings = function(a, b) {
    if(a.average_weight < b.average_weight) {
        return 1;
    }
    else if(a.average_weight > b.average_weight) {
        return -1;
    }
    else {
        return 0;
    }
}

exports.vote = function(req, res, next) {
    StackRank.findById(
            Hash.Rankid.decodeHex(req.params.id), function(err, stackrank) {
        if (err) {
          return next(err);
        }

        var voterrankings = getOptionsArray(req.body);

        stackrank.votes.push({voter: req.body['voter'], rankings: voterrankings});

        if (stackrank.overall.length == 0) {
            var avg_weight = voterrankings.length;
            for (i = 0; i < voterrankings.length; i++) {
                stackrank.overall.push(
                    {option: voterrankings[i], average_weight: avg_weight--});
            }
        }
        else {
            var num_voters = stackrank.votes.length;
            for (i = 0; i < stackrank.overall.length; i++) {
                var total_weight =
                    stackrank.overall[i].average_weight * (num_voters - 1);
                var new_rank = stackrank.overall.length -
                    voterrankings.indexOf(stackrank.overall[i].option);
                stackrank.overall[i].average_weight =
                    (total_weight + new_rank)/num_voters;
            }
        }
        stackrank.overall.sort(compareRankings);
        console.log(stackrank.overall);

        stackrank.save(function(err, stackrankvotes) {
          if (err) {
            return next(err);
          }
          res.redirect('/viewvotes/' + stackrank.voteid);
        });
    });
};

exports.viewvotes = function(req, res, next) {
  StackRank.findById(Hash.Voteid.decodeHex(req.params.id), function(err, stackrank) {
      if (err) {
        return next(err);
      }

      var overall_rankings = [];
      for (i=0; i < stackrank.overall.length; i++) {
          overall_rankings.push(stackrank.overall[i].option);
      }

      stackrank.votes.push({voter:"Overall results", rankings:overall_rankings});

      if(stackrank.votes) {
            res.render('viewvotes', {
                title : stackrank.title,
                votes : stackrank.votes.reverse(),
                rankid: stackrank.rankid,
                voteid: stackrank.voteid,
                host  : req.headers.host
            });
      }
      else {
          res.render('404', {url:req.url});
      }
  });
};
