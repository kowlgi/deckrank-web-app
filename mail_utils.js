/*!
 * mail_uitls.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

function createSubject(title) {
  return 'You created a new poll: ' + title;
};

function createBodyText(title, description, rankid, voteid) {
  return 'You created a new poll: ' + title
    + '\nDescription: ' + description
    + '\n\nShare the poll with your friends (or simply forward them this email): '
    + 'http://deckrank.co/rank/' + rankid
    + '\n\nView the results: http://deckrank.co/viewvotes/' + voteid;
}

function thanksForVoting() {
  return 'Thanks for voting on a deckrank poll';
}

function createBodyTextVoter(title, description, rankid, voteid) {
  return 'You voted on: ' + title
    + '\nDescription: ' + description
    + '\n\nShare the poll with your friends (or simply forward them this email): '
    + 'http://deckrank.co/rank/' + rankid
    + '\n\nView the results: http://deckrank.co/viewvotes/' + voteid;
}

exports.createSubject = createSubject;
exports.createBodyText = createBodyText;
exports.thanksForVoting = thanksForVoting;
exports.createBodyTextVoter = createBodyTextVoter;
