/*!
 * db.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var mongoose = require( 'mongoose' );
var Shortid = require('shortid');

var Schema   = mongoose.Schema;

var model = {};
var RankID = {};
var VoteID = {};
exports.init = function(db_name) {
    var StackRank = new Schema({
        title:      String,
        options:    [{type: String}],
        rankid: String,
        voteid: String,
        email: String,
        description: String,
        votes: [{
            voter: {type: String},
            email: {type: String},
            rankings: [String]
        }],
        overall: [{
            option: {type: String},
            score: {type: Number}
        }]
    });

    model = mongoose.model('StackRank', StackRank);
    mongoose.connect( 'mongodb://localhost/' + db_name );

    StackRank.pre('save', function(next) {
        // https://github.com/dylang/shortid/issues/36
        if (!this.rankid) this.rankid = Shortid.generate();
        if (!this.voteid) this.voteid = Shortid.generate();

        next();
    });

    return exports;
};
