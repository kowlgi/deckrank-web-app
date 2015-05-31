/*!
 * index.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');
var App = require('../app');
var Mail = require('../mail');
var MailUtils = require('../mail_utils');
var jade = require('jade');
var fs = require('fs');

// Global variable for the email object. We'd like to initialize it once
var mg = 0;

exports.index = function(req, res, next) {
  res.render('index', {mixpanel_tracking_code : App.mixpanel_tracking_code});
};

exports.extra = function(req, res, next) {
  res.render('extra', {mixpanel_tracking_code : App.mixpanel_tracking_code, feedback_done:req.query.feedback});
};

exports.sendmail = function(req, res, next) {
  var to = req.params.mail;
  var options = {
    title: 'which restaurant should we go to for lunch?',
    voteid: 'test',
    rankid: 'test',
    description: 'dave is leaving the team. where do we go for lunch?',
  };
  res.render('email_template', options);
  if (to.indexOf("@") == -1) {
    console.log('Returning early as this does not look like an email address: ' + to);
    return;
  }
  // Create the mail object if it doesn't exist
  if (!mg) {
    console.log('Creating the mailgun object for the first time')
    mg = Mail.mailgun(App.api_key, App.email_domain);
  }
  var subject = MailUtils.createSubject(options['title']);
  var body_text =  MailUtils.createBodyText(options['title'], options['description'], '1', '2');
  var body_html = jade.renderFile('views/email_template.jade', options);
  Mail.sendHtmlEmail(mg, to, subject, body_html, body_html);
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
    options     : getOptionsArray(req.body)
  }).save(function(err, stackrank) {
        if (err) {
            console.log(err);
            return next(err);
        }

        // And redirect the user to home...
        res.redirect('/rank/' + stackrank.rankid + '?email=1');
        // Create the mail object if it doesn't exist
        if (!mg) {
            console.log('Creating the mailgun object for the first time')
            mg = Mail.mailgun(App.api_key, App.email_domain);
        }
        var subject = MailUtils.createSubject(stackrank.title);
        var body_text =  MailUtils.createBodyText(stackrank.title, stackrank.description, stackrank.rankid, stackrank.voteid);
        jade.render('email_template', stackrank);
        var body_html = jade.renderFile('views/email_template.jade', stackrank);
        Mail.sendHtmlEmail(mg, stackrank.email, subject, body_html, body_html);
    });
};

exports.feedback = function(req, res, next) {
    // TODO: send an email to person sending feedback and bcc deckrank@gmail.com.
    res.redirect('/extra?feedback=1');
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
        if (err) {
            res.render('404', {url:req.url});
            return;
        }

        var voterrankings = getOptionsArray(req.body);

        stackrank.votes.push({
          voter: req.body['voter'],
          email: req.body['email'],
          rankings: voterrankings});

        if (stackrank.overall.length == 0) {
            var rank = voterrankings.length;
            for (i = 0; i < voterrankings.length; i++) {
                stackrank.overall.push(
                    {option: voterrankings[i], score: rank--});
            }
        }
        else {
            for (i = 0; i < stackrank.overall.length; i++) {
                var new_score = stackrank.overall.length -
                    voterrankings.indexOf(stackrank.overall[i].option);
                stackrank.overall[i].score += new_score;
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

            // we send an email only when there's an 'email' key in the request
            // header
            if (req.body['email']) {
                var subject = MailUtils.thanksForVoting();
                var body_text =  MailUtils.createBodyTextVoter(stackrank.title, stackrank.description, stackrank.rankid, stackrank.voteid);
                jade.render('email_template_voter', stackrank);
                var body_html = jade.renderFile('views/email_template_voter.jade', stackrank);
                Mail.sendHtmlEmail(mg, req.body['email'], subject, body_html, body_html);
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
                host                   : req.headers.host,
                mixpanel_tracking_code : App.mixpanel_tracking_code
            });
      }
      else {
          res.render('404', {url:req.url});
          return;
      }
  });
};
