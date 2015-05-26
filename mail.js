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
