var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;
var StackRank = new Schema({
  title:      String,
  options:    [{type: String, required: true}],
  created_at: Date,
  votes: [{
      voter: {type: String, unique: true, required: true},
      rankings: [String]
  }]
});

mongoose.model('StackRank', StackRank);
mongoose.connect( 'mongodb://localhost/stackrank' );
