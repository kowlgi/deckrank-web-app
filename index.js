/*!
 * index.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');

// TODO(hnag): app.js includes index.js and index.js includes app. Fix that.
var App = require('./app');
var Mail = require('./mail');
var jade = require('jade');
var fs = require('fs');
var MAX_TITLE_LENGTH = 256;
var EMAIL_TITLE_LENGTH = 60;
var MAX_INPUT_LENGTH = 100;
var MAX_DESCRIPTION_LENGTH = 200;

// Some random voter names
var names = [ "A fan", "Gilfoyle", "The hero", "Erlich Bachman", "The great one",
              "Mrs. Anonymous", "Anonymouse", "They call me X", "Call me Mr. T",
              "Jazzy Jeff", "A Gilmore Girl", "Captain Jim", "A kitten", "A cat",
              "The Beast", "A Brown Bear", "RinTinTin the Dino", "A flamingo",
              "The Most Interesting Man", "A pizza"];

// Global variable for the email object. We'd like to initialize it once
var mg = 0;

// TODO(hnag): Buggy. Need to fix
// Helper to truncate strings at a word boundary
String.prototype.truncate = function(n, useWordBoundary) {
  var toLong = this.length > n, s_ = toLong ? this.substr(0, n-1) : this;
  s_ = useWordBoundary && toLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;
  return toLong ? s_ + '...' : s_;
};

exports.index = function(req, res, next) {
    res.render('index', {mixpanel_tracking_code : App.mixpanel_tracking_code,
        google_tracking_code   : App.google_tracking_code});
};

exports.extra = function(req, res, next) {
    res.render('extra', {mixpanel_tracking_code : App.mixpanel_tracking_code,
        feedback_done:req.query.feedback,
        google_tracking_code   : App.google_tracking_code});
};

exports.how = function(req, res, next) {
    res.render('how', {mixpanel_tracking_code : App.mixpanel_tracking_code,
        google_tracking_code   : App.google_tracking_code});
};

exports.showall = function(req, res, next) {
    StackRank.
        find().
        exec(function(err, stackranks) {
            res.render('showall', {
                title                  : 'All stackranks in the db',
                stackranks             : stackranks,
                mixpanel_tracking_code : App.mixpanel_tracking_code,
                google_tracking_code   : App.google_tracking_code
            });
        });
};

exports.dashboard = function(req, res, next) {
  var num_votes = 0;
  StackRank.find().exec(
    function(err, stackrank) {
      for (var i=0; i < stackrank.length; ++i) {
        num_votes += stackrank[i].votes.length;
      }

      res.render('dashboard', {
                  stackranks: stackrank,
                  vote_count: num_votes
      });
  });
};

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function getRandomVoterName() {
  return names[Math.floor(Math.random() * names.length)];
};

// Helper to extract options from the form and return an array
function getOptionsArray(d) {
    var options = [];
    for (var key in d) {
        if (key.indexOf('option') > -1) {
            if (d[key]) {
                options.push(d[key].substring(0, MAX_INPUT_LENGTH));
            }
        }
    }
    return options;
};

exports.create = function(req, res, next) {
  var email_ = req.body.email.substring(0, MAX_INPUT_LENGTH);
  var stackrank = new StackRank({
    title       : req.body.title.substring(0, MAX_TITLE_LENGTH),
    email       : email_,
    options     : getOptionsArray(req.body).splice(0,10),
    created_on  : Date.now()
  }).save(function(err, stackrank) {
        if (err) {
            return next(err);
        }

        // And redirect the user to home...
        res.redirect('/r/' + stackrank.rankid + '?email=1');
        if (isEmpty(email_)) {
          return;
        }

        // Create the mail object if it doesn't exist
        if (!mg) {
            mg = Mail.mailgun(App.api_key, App.email_domain);
        }
        var subject = "You created a new poll: " + stackrank.title.truncate(EMAIL_TITLE_LENGTH);
        var body_html = jade.renderFile('views/email_template.jade', stackrank);
        Mail.sendHtmlEmail(mg, stackrank.email, "", subject, body_html, body_html);
    });
};

exports.feedback = function(req, res, next) {
    res.redirect('/extra?feedback=1');

    // Create the mail object if it doesn't exist
    if (!mg) {
        mg = Mail.mailgun(App.api_key, App.email_domain);
    }
    var subject = "Thanks for your feedback";
    var body_html = jade.renderFile('views/email_feedback_template.jade',
        {description: req.body.description.substring(0, MAX_DESCRIPTION_LENGTH)});
    Mail.sendHtmlEmail(mg, req.body.email.substring(0, MAX_INPUT_LENGTH),
        "sunil.srinivasan@gmail.com, hareesh.nagarajan@gmail.com, deckrank@gmail.com", subject, body_html, body_html);
};

exports.rank = function(req, res, next) {
    StackRank.findOne({rankid : req.params.id}, function(err, stackrank) {
      if(stackrank && stackrank.options) {
            res.render('rank', {
                title                  : stackrank.title,
                description            : stackrank.description,
                options                : stackrank.options,
                email                  : req.query.email,
                rankid                 : stackrank.rankid,
                voteid                 : stackrank.voteid,
                mixpanel_tracking_code : App.mixpanel_tracking_code,
                google_tracking_code   : App.google_tracking_code
            });
      }
      else {
          res.render('404', {url:req.url});
          return;
      }
    });
};

var compareRankings = function(a, b) {
    if(a.score < b.score) {
        return 1;
    }
    else if(a.score > b.score) {
        return -1;
    }
    else {
        return 0;
    }
}

exports.vote = function(req, res, next) {
    StackRank.findOne({rankid : req.params.id}, function(err, stackrank) {
        if (err) {
            res.render('404', {url:req.url});
            return;
        }

        var voterrankings = getOptionsArray(req.body);
        var email_ = req.body['email'] ? req.body['email'].substring(0, MAX_INPUT_LENGTH) : stackrank.email;
        var voter_ = req.body['voter'].substring(0, MAX_INPUT_LENGTH);
        if (isEmpty(voter_)) {
          voter_ = getRandomVoterName();
        }

        stackrank.votes.push({
          voter      : voter_,
          email      : email_,
          created_on : Date.now(),
          rankings   : voterrankings});

        stackrank.save(function(err, stackrankvotes) {
            if (err) {
                return next(err);
            }
            res.redirect('/v/' + stackrank.voteid);

            if (isEmpty(email_)) {
              return;
            }

            // Create the mail object if it doesn't exist
            if (!mg) {
                mg = Mail.mailgun(App.api_key, App.email_domain);
            }

            // we send an email only when there's an 'email' key in the request
            // header
            if (req.body['email']) {
                var subject = "Thanks for voting on: " + stackrank.title.truncate(EMAIL_TITLE_LENGTH);
                var body_html = jade.renderFile('views/email_template_voter.jade', stackrank);
                Mail.sendHtmlEmail(mg,
                    req.body['email'].substring(0, MAX_INPUT_LENGTH),
                    "", subject, body_html, body_html);
            }
        });
    });
};

exports.viewvotes = function(req, res, next) {
  StackRank.findOne({voteid : req.params.id}, function(err, stackrank) {
      if (err) {
        res.render('404', {url:req.url});
        return;
      }

      var overall_rankings = [];
      var total = 0;
      for (ii = 0; ii < stackrank.options.length; ii++) {
          overall_rankings.push({'option':stackrank.options[ii], 'score': 0});
          var score = 0;
          for ( jj = 0; jj < stackrank.votes.length; jj++) {
              var rankings = stackrank.votes[jj].rankings;
              if (rankings) {
                  var rank = rankings.indexOf(stackrank.options[ii]);
                  score += rank > -1 ? stackrank.options.length - rank : 0;
              }
          }
          total += score;
          overall_rankings[ii].score += score;
      }
      console.log
      for (ii = 0; ii < overall_rankings.length; ii++) {
          overall_rankings[ii].score = Math.round((overall_rankings[ii].score * 100) / total);
      }
      overall_rankings.sort(compareRankings);

      if(stackrank.votes) {
            res.render('viewvotes', {
                title                  : stackrank.title,
                description            : stackrank.description,
                summary                : overall_rankings,
                total_votes            : stackrank.votes.length,
                votes                  : stackrank.votes.reverse(),
                rankid                 : stackrank.rankid,
                voteid                 : stackrank.voteid,
                mixpanel_tracking_code : App.mixpanel_tracking_code,
                google_tracking_code   : App.google_tracking_code
            });
      }
      else {
          res.render('404', {url:req.url});
          return;
      }
  });
};
