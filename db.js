var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;
var StackRank = new Schema({
  title:      String,
  options:    [String],
  created_at: Date
});

mongoose.model('StackRank', StackRank);
mongoose.connect( 'mongodb://localhost/stackrank' );
