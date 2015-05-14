var mongoose = require( 'mongoose' );
var Hash     = require('./hash');
var Schema   = mongoose.Schema;
var StackRank = new Schema({
  title:      String,
  options:    [{type: String, required: true}],
  created_at: Date,
  rankid: String,
  voteid: String,
  votes: [{
      voter: {type: String, unique: true, required: true},
      rankings: [String]
  }]
});


StackRank.pre('save', function(next) {
    // DOCS: https://github.com/ivanakimov/hashids.node.js
    if (!this.rankid)
        this.rankid = Hash.Rankid.encodeHex(this.id);

    if (!this.voteid)
        this.voteid = Hash.Voteid.encodeHex(this.id);

    next();
});

mongoose.model('StackRank', StackRank);
mongoose.connect( 'mongodb://localhost/stackrank' );
