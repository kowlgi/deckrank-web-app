/*!
 * mail.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var MailComposer = require("mailcomposer").MailComposer;

// Pass a valid mg
function sendHtmlEmail(mg, to, bcc, subject, body_html, body_text) {
  var mailcomposer = new MailComposer();
  mailcomposer.setMessageOption({
    from: 'deckrank.co <no-reply@mg.deckrank.co>',
    to: to,
    bcc: bcc,
    subject: subject,
    body: body_text,
    html: body_html
  });

  mailcomposer.buildMessage(function(mailBuildError, messageSource) {
    var dataToSend = {
      to: to,
      message: messageSource
    };

    mg.messages().sendMime(dataToSend, function (sendError, body) {
      if (sendError) {
        return;
      }
    });
  });
};

var mailgun = function(api_key, email_domain) {
  mailgun = require('mailgun-js')({
    apiKey: api_key, domain: email_domain
    });
  return mailgun;
};

exports.mailgun = mailgun;
exports.sendHtmlEmail = sendHtmlEmail;
