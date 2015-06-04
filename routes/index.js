/*!
 * index.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');
var App = require('../app');
var Mail = require('../mail');
var jade = require('jade');
var fs = require('fs');
var MAX_INPUT_LENGTH = 100;
var MAX_DESCRIPTION_LENGTH = 200;

// Global variable for the email object. We'd like to initialize it once
var mg = 0;

exports.index = function(req, res, next) {
    res.render('index', {mixpanel_tracking_code : App.mixpanel_tracking_code});
};

exports.extra = function(req, res, next) {
    res.render('extra', {mixpanel_tracking_code : App.mixpanel_tracking_code,
        feedback_done:req.query.feedback});
};

exports.showall = function(req, res, next) {
    StackRank.
        find().
        exec(function(err, stackranks) {
            res.render('showall', {
                title                  : 'All stackranks in the db',
                stackranks             : stackranks,
                mixpanel_tracking_code : App.mixpanel_tracking_code
            });
        });
};

function isEmpty(str) {
    return (!str || 0 === str.length);
}

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
    title       : req.body.title.substring(0, MAX_INPUT_LENGTH),
    email       : email_,
    description : req.body.description.substring(0, MAX_DESCRIPTION_LENGTH),
    options     : getOptionsArray(req.body).splice(0,10),
    created_on  : Date.now()
  }).save(function(err, stackrank) {
        if (err) {
            console.log(err);
            return next(err);
        }

        // And redirect the user to home...
        res.redirect('/r/' + stackrank.rankid + '?email=1');
        if (isEmpty(email_)) {
          console.log('No email was specified in create. Returning ...');
          return;
        }
        // Create the mail object if it doesn't exist
        if (!mg) {
            console.log('Creating the mailgun object for the first time')
            mg = Mail.mailgun(App.api_key, App.email_domain);
        }
        var subject = "You created a new poll: " + stackrank.title;
        var body_html = jade.renderFile('views/email_template.jade', stackrank);
        Mail.sendHtmlEmail(mg, stackrank.email, "", subject, body_html, body_html);
    });
};

exports.feedback = function(req, res, next) {
    res.redirect('/extra?feedback=1');

    // Create the mail object if it doesn't exist
    if (!mg) {
        console.log('Creating the mailgun object for the first time')
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
                mixpanel_tracking_code : App.mixpanel_tracking_code
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
        console.log('Inside vote for id: ' + req.params.id);
        if (err) {
            res.render('404', {url:req.url});
            return;
        }

        var voterrankings = getOptionsArray(req.body);
        var email_ = req.body['email'] ? req.body['email'].substring(0, MAX_INPUT_LENGTH) : stackrank.email;
        stackrank.votes.push({
          voter      : req.body['voter'].substring(0, MAX_INPUT_LENGTH),
          email      : email_,
          created_on : Date.now(),
          rankings   : voterrankings});

        if (stackrank.overall.length == 0) {
            var rank = voterrankings.length - 1;
            for (i = 0; i < voterrankings.length; i++) {
                stackrank.overall.push(
                    {option: voterrankings[i], score: rank--});
            }
        }
        else {
            for (i = 0; i < stackrank.overall.length; i++) {
                var new_score = stackrank.overall.length -
                    voterrankings.indexOf(stackrank.overall[i].option) - 1;
                stackrank.overall[i].score += new_score;
            }
        }
        stackrank.overall.sort(compareRankings);
        stackrank.save(function(err, stackrankvotes) {
            if (err) {
                return next(err);
            }
            res.redirect('/v/' + stackrank.voteid);

            if (isEmpty(email_)) {
              console.log('No email was specified in vote. Returning ...');
              return;
            }

            // Create the mail object if it doesn't exist
            if (!mg) {
                console.log('Creating the mailgun object for the first time')
                mg = Mail.mailgun(App.api_key, App.email_domain);
            }

            // we send an email only when there's an 'email' key in the request
            // header
            if (req.body['email']) {
                var subject = "Thanks for voting on: " + stackrank.title;
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
      console.log('Inside viewvotes for id: ' + req.params.id);
      if (err) {
        res.render('404', {url:req.url});
        return;
      }

      var overall_rankings = [];
      var total = 0;

      for (i=0; i < stackrank.overall.length; i++) {
          overall_rankings.push({'option':stackrank.overall[i].option, 'score': 0});
          total += stackrank.overall[i].score;
      }

      for (i=0; i < stackrank.overall.length; i++) {
          var score = Math.round(stackrank.overall[i].score * 100/total);
          overall_rankings[i].score = score;
      }

      if(stackrank.votes) {
            res.render('viewvotes', {
                title                  : stackrank.title,
                description            : stackrank.description,
                summary                : overall_rankings,
                total_votes            : stackrank.votes.length,
                votes                  : stackrank.votes.reverse(),
                rankid                 : stackrank.rankid,
                voteid                 : stackrank.voteid,
                mixpanel_tracking_code : App.mixpanel_tracking_code
            });
      }
      else {
          res.render('404', {url:req.url});
          return;
      }
  });
};
