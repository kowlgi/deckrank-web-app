/*!
 * db.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

var mongoose = require( 'mongoose' );
var Shortid = require('shortid');
var Schema   = mongoose.Schema;

exports.init = function(stackrank_db_name) {
    var StackRank = new Schema({
        title          : String,
        options        : [String],
        created_on     : Date,
        poll_type      : String,
        rankid         : String,
        voteid         : String,
        email          : String,
        description    : String,
        votes: [{
            voter      : String,
            email      : String,
            created_on : Date,
            rankings   : [String]
        }],
        overall: [{
            option     : String,
            score      : Number
        }]
    });

    mongoose.model('StackRank', StackRank);
    mongoose.connect( 'mongodb://localhost/' + stackrank_db_name );
    StackRank.pre('save', function(next) {
        // https://github.com/dylang/shortid/issues/36
        if (!this.rankid) this.rankid = Shortid.generate();
        if (!this.voteid) this.voteid = Shortid.generate();

        next();
    });

    return exports;
};
