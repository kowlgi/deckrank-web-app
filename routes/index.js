var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');
var Hash = require('../hash');
var App = require('../app');
var Mail = require('../mail');

// Global variable for the email object. We'd like to initialize it once
var mg = 0;
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
    res.redirect('/rank/' + stackrank.rankid + '?email=1');
    // Create the mail object if it doesn't exist
    if (!mg) {
      console.log('Creating the mailgun object for the first time')
      mg = Mail.mailgun(App.api_key, App.email_domain);
    }
    var subject = 'You created a new poll: ' + stackrank.title;
    var body = 'You created a new poll: ' + stackrank.title
      + '\nDescription: ' + stackrank.description
      + '\n\nShare the poll with your friends (or simply forward them this email): '
      + 'http://deckrank.co/rank/' + stackrank.rankid
      + '\n\nView the results: http://deckrank.co/viewvotes/' + stackrank.voteid;
    Mail.sendEmail(mg, stackrank.email, subject, body);
  });
};

exports.rank = function(req, res, next) {
    StackRank.findById(Hash.Rankid.decodeHex(req.params.id), function(err, stackrank) {
      if(stackrank && stackrank.options) {
            res.render('rank', {
                title       : stackrank.title,
                description : stackrank.description,
                options     : stackrank.options,
                email       : req.query.email,
                rankid      : stackrank.rankid,
                voteid      : stackrank.voteid
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

        stackrank.votes.push({
          voter: req.body['voter'],
          email: req.body['email'],
          rankings: voterrankings});

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
        stackrank.save(function(err, stackrankvotes) {
          if (err) {
            return next(err);
          }
          res.redirect('/viewvotes/' + stackrank.voteid);
          // Create the mail object if it doesn't exist
          if (!mg) {
            console.log('Creating the mailgun object for the first time')
            mg = Mail.mailgun(App.api_key, App.email_domain);
          }
          var subject = 'You voted on a poll!';
          var body = 'You voted on a poll!  ' + stackrank.title
            + '\nDescription: ' + stackrank.description
            + '\n\nShare the poll with your friends (or simply forward them this email): '
            + 'http://deckrank.co/rank/' + stackrank.rankid
            + '\n\nView the results: http://deckrank.co/viewvotes/' + stackrank.voteid;
          Mail.sendEmail(mg, stackrank.email, subject, body);
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

      if(stackrank.votes) {
            res.render('viewvotes', {
                title       : stackrank.title,
                description : stackrank.description,
                summary     : overall_rankings,
                total_votes : stackrank.votes.length,
                votes       : stackrank.votes.reverse(),
                rankid      : stackrank.rankid,
                voteid      : stackrank.voteid,
                host        : req.headers.host
            });
      }
      else {
          res.render('404', {url:req.url});
      }
  });
};
