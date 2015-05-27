var MailComposer = require("mailcomposer").MailComposer;

// Pass a valid mg
function sendHtmlEmail(mg, to, subject, body_html, body_text) {
  var mailcomposer = new MailComposer();
  mailcomposer.setMessageOption({
    from: 'no-reply@mg.deckrank.co',
    to: to,
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
        console.log(sendError);
        return;
      }
    });
  });
  console.log('Mail has been sent');
};

var mailgun = function(api_key, email_domain) {
  mailgun = require('mailgun-js')({
    apiKey: api_key, domain: email_domain
    });
  console.log('Mail has been initialized');
  return mailgun;
};

function sendEmail(mg, to, subject, body) {
  var data = {
    from: 'deckrank.co <no-reply@mg.deckrank.co>',
    to: to,
    subject: subject,
    text: body
  }
  mg.messages().send(data, function(error, body) {
    console.log(body);
  });
};

exports.mailgun = mailgun;
exports.sendEmail = sendEmail;
exports.sendHtmlEmail = sendHtmlEmail;
