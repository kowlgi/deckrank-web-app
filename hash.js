var Hashids = require("hashids");
var Rankid = new Hashids("random rank salt");
var Voteid = new Hashids("random vote salt");

exports.Rankid = Rankid;
exports.Voteid = Voteid;
