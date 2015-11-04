/*!
 * index.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var mongoose = require( 'mongoose' );
var StackRank = mongoose.model('StackRank');
var Request = require('request');

// TODO(hnag): app.js includes index.js and index.js includes app. Fix that.
var App = require('./app');
var Mail = require('./mail');
var jade = require('jade');
var fs = require('fs');
var MAX_TITLE_LENGTH = 256;
var EMAIL_TITLE_LENGTH = 60;
var MAX_INPUT_LENGTH = 100;
var MAX_DESCRIPTION_LENGTH = 200;

/* checks and errors to throttle votes from same ip */
var MAX_VOTES_PER_IP = 7;
var SUCCESS_VOTE_IS_ALLOWED = 100;
var ERR_ONLY_UNIQUE_VOTES_ALLOWED = 101;
var ERR_GREATER_THAN_MAX_ALLOWED_VOTES_FROM_SAME_IP = 102;

var placeholdertitle = "What's your favorite show on TV today? Rank in order of preference.";
var placeholderoption = ["Game of Thrones", "Silicon Valley", "Veep",
                          "House of Cards", "True Detective", "Downton Abbey",
                          "Entourage", "Orange Is The New Black", "Modern Family",
                          "Mad Men"];

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
    var defaultOptions = ["", ""];
    res.render('edit', {
        pagetitle              : "Create A Poll - deckrank",
        headline               : "deckrank makes rank-based polls easy",
        subheadline            : "It's free and no signup required",
        title                  : "",
        options                : defaultOptions,
        placeholdertitle       : placeholdertitle,
        placeholderoption      : placeholderoption,
        email                  : false,
        unique_voter           : false,
        mixpanel_tracking_code : App.mixpanel_tracking_code,
        google_tracking_code   : App.google_tracking_code
    });
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

exports.privacy = function(req, res, next) {
    res.render('privacy');
};

exports.tos = function(req, res, next) {
    res.render('tos');
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
    Request.post(
        'https://www.google.com/recaptcha/api/siteverify',
        {
            form: {
                secret: App.recaptcha_key,
                response: req.body['g-recaptcha-response'],
                remoteip: req.connection.remoteAddress
            }
        },
        function (error, response, body) {
            var parsedBody = JSON.parse(body);
            if (error || response.statusCode != 200) {
                res.render('failed_captcha');
                return;
            } else if (parsedBody.success){
                var email_ = req.body.email.substring(0, MAX_INPUT_LENGTH);
                var stackrank = new StackRank({
                  title        : req.body.title.substring(0, MAX_TITLE_LENGTH),
                  email        : email_,
                  options      : getOptionsArray(req.body).splice(0,10),
                  unique_voter : req.body['unique_voter'] == "on" ? true : false,
                  creator_ip   : req.connection.remoteAddress,
                  created_on   : Date.now()
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
                      var body_html = jade.renderFile('views/email/email_template_edit_viewresults.jade', stackrank);
                      Mail.sendHtmlEmail(mg, stackrank.email, "", subject, body_html, body_html);

                      var subject_vote = "Vote on this poll: " + stackrank.title.truncate(EMAIL_TITLE_LENGTH);
                      var body_html_vote = jade.renderFile('views/email/email_template_vote.jade', stackrank);
                      Mail.sendHtmlEmail(mg, stackrank.email, "", subject_vote, body_html_vote, body_html_vote);
                  });
                  return;
            }
            else {
                res.render('failed_captcha');
                return;
            }
    });
};

exports.feedback = function(req, res, next) {
    res.redirect('/extra?feedback=1');

    // Create the mail object if it doesn't exist
    if (!mg) {
        mg = Mail.mailgun(App.api_key, App.email_domain);
    }
    var subject = "Thanks for your feedback";
    var bcc = "sunil.srinivasan@gmail.com, hareesh.nagarajan@gmail.com, deckrank@gmail.com";
    var body_html = jade.renderFile('views/email/email_feedback_template.jade',
        {description: req.body.description.substring(0, MAX_DESCRIPTION_LENGTH)});
    Mail.sendHtmlEmail(mg, req.body.email.substring(0, MAX_INPUT_LENGTH),
        bcc, subject, body_html, body_html);
};

exports.edit = function(req, res, next) {
    StackRank.findOne({editid : req.params.id}, function(err, stackrank) {
      if(stackrank && stackrank.options) {
            res.render('edit', {
                pagetitle              : "Edit Your Poll - deckrank",
                headline               : "Edit your poll",
                subheadline            : "We'll create a new link for you to share",
                title                  : stackrank.title,
                options                : stackrank.options,
                placeholdertitle       : placeholdertitle,
                placeholderoption      : placeholderoption,
                email                  : stackrank.email,
                unique_voter           : stackrank.unique_voter,
                mixpanel_tracking_code : App.mixpanel_tracking_code,
                google_tracking_code   : App.google_tracking_code
            });
      }
      else {
          res.render('404', {url:req.url});
          return;
      }
    });
}

function allowVote(stackrank, voter_ip) {
    var count = 0;
    for (i = 0; i < stackrank.votes.length; i++) {
        if(voter_ip == stackrank.votes[i].voter_ip) {
            count++;
        }
    }

    if(count >= 1 && stackrank.unique_voter) {
        return ERR_ONLY_UNIQUE_VOTES_ALLOWED;
    } else if (count >= MAX_VOTES_PER_IP) {
        return ERR_GREATER_THAN_MAX_ALLOWED_VOTES_FROM_SAME_IP;
    }

    return SUCCESS_VOTE_IS_ALLOWED;
}

exports.rank = function(req, res, next) {
    StackRank.findOne({rankid : req.params.id}, function(err, stackrank) {
      if(stackrank && stackrank.options) {
            var allowVoteResult = allowVote(stackrank, req.connection.remoteAddress);
            if( allowVoteResult == ERR_ONLY_UNIQUE_VOTES_ALLOWED) {
                // Redirect the user to results page..
                res.redirect('/v/' + stackrank.voteid + '?dupvote=1');
                return;
            } else if (allowVoteResult == ERR_GREATER_THAN_MAX_ALLOWED_VOTES_FROM_SAME_IP) {
                // Redirect the user to the results page..
                res.redirect('/v/' + stackrank.voteid + '?votesmaxed=1');
                return;
            }

            res.render('rank', {
                title                  : stackrank.title,
                created_on             : stackrank.created_on,
                options                : stackrank.options,
                email                  : req.query.email,
                rankid                 : stackrank.rankid,
                voteid                 : stackrank.voteid,
                mixpanel_tracking_code : App.mixpanel_tracking_code,
                google_tracking_code   : App.google_tracking_code
            });
            return;
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

        var allowVoteResult = allowVote(stackrank, req.connection.remoteAddress);
        if( allowVoteResult == ERR_ONLY_UNIQUE_VOTES_ALLOWED) {
            // Redirect the user to results page..
            res.redirect('/v/' + stackrank.voteid + '?dupvote=1');
            return;
        } else if (allowVoteResult == ERR_GREATER_THAN_MAX_ALLOWED_VOTES_FROM_SAME_IP) {
            // Redirect the user to the results page..
            res.redirect('/v/' + stackrank.voteid + '?votesmaxed=1');
            return;
        }

        var voterrankings = getOptionsArray(req.body);
        var email_ = req.body['email'] ? req.body['email'].substring(0, MAX_INPUT_LENGTH) : stackrank.email;
        var voter_ = req.body['voter'].substring(0, MAX_INPUT_LENGTH);
        if (isEmpty(voter_)) {
          voter_ = getRandomVoterName();
        }

        stackrank.votes.push({
          voter        : voter_,
          email        : email_,
          created_on   : Date.now(),
          voter_ip     : req.connection.remoteAddress,
          rankings     : voterrankings});

        stackrank.save(function(err, stackrank) {
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
                var body_html = jade.renderFile('views/email/email_template_voter.jade', stackrank);
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

      // normalize scores only if there's at least one vote i.e. total > 0
      if (total > 0) {
          for (ii = 0; ii < overall_rankings.length; ii++) {
              overall_rankings[ii].score = Math.round((overall_rankings[ii].score * 100) / total);
          }
      }

      overall_rankings.sort(compareRankings);

      if(stackrank.votes) {
            res.render('viewvotes', {
                title                  : stackrank.title,
                created_on             : stackrank.created_on,
                summary                : overall_rankings,
                total_votes            : stackrank.votes.length,
                votes                  : stackrank.votes.reverse(),
                rankid                 : stackrank.rankid,
                voteid                 : stackrank.voteid,
                mixpanel_tracking_code : App.mixpanel_tracking_code,
                google_tracking_code   : App.google_tracking_code,
                dupvote                : req.query.dupvote,
                votesmaxed             : req.query.votesmaxed
            });
      }
      else {
          res.render('404', {url:req.url});
          return;
      }
  });
};

exports.featuredpolls = function(req, res, next) {
    StackRank.find({poll_type:"pinned"}, function(err, stackrank) {
        if (err) {
            return next(err);
        }

        if(stackrank.length) {
            res.render('featuredpolls', {headline: "Featured polls", stackrank: stackrank});
        }
        else {
            res.render('generic', {headline: "There're no featured polls yet."});
        }
    });
}

/* PRIVATE URL for overall deckrank stats*/
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

/* PRIVATE URL to pin polls to Featured Polls page */
exports.pin = function(req, res, next) {
    StackRank.findOne({rankid : req.params.id}, function(err, stackrank) {
        if (err) {
          res.render('404', {url:req.url});
          return;
        }

        var index = stackrank.poll_type.indexOf("pinned");
        if (index == -1) {
            stackrank.poll_type.push("pinned");
            stackrank.save(function(err, stackrank){
                if (err) {
                    return next(err);
                }

                res.render('generic', {headline: "This poll is now pinned to Featured Polls.", title:stackrank.title});
            });
        }
        else {
            res.render('generic', {headline: "This poll was previously pinned to Featured Polls, no point in pinning again.", title:stackrank.title});
        }
    });
};

/* PRIVATE URL to unpin polls from Featured Polls page */
exports.unpin = function(req, res, next) {
    StackRank.findOne({rankid : req.params.id}, function(err, stackrank) {
        if (err) {
          res.render('404', {url:req.url});
          return;
        }

        var index = stackrank.poll_type.indexOf("pinned");
        if (index > -1) {
            stackrank.poll_type.splice(index, 1);
            stackrank.save(function(err, stackrank){
                if (err) {
                    return next(err);
                }
                res.render('generic', {headline: "This poll is now unpinned from Featured Polls.", title:stackrank.title});
            });
        }
        else {
            res.render('generic', {headline: "This poll is not pinned to Featured Polls, why bother unpinning.", title:stackrank.title});
        }
    });
};

/* PRIVATE PAGE to show all polls. */
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
