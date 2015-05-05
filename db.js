var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;
var Vote = new Schema({
    voter: {type: String, unique: true, required: true},
    rankings: [String]
});

var StackRank = new Schema({
  title:      String,
  options:    [{type: String, required: true}],
  created_at: Date,
  votes: [Vote]
});

mongoose.model('StackRank', StackRank);
mongoose.connect( 'mongodb://localhost/stackrank' );
