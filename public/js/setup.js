/*!
 * setup.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */

//http://abhishek-tiwari.com/post/google-tag-manager-visitor-uuid-cookie-setter-tag
(function() {
  // UUID generator
 // Private array of chars to use
 var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

 // RFC4122v4 compliant uuid generator
 Math.uuid = function() {
   var chars = CHARS, uuid = new Array(36), rnd=0, r;
   for (var i = 0; i < 36; i++) {
     if (i==8 || i==13 ||  i==18 || i==23) {
       uuid[i] = '-';
     } else if (i==14) {
       uuid[i] = '4';
     } else {
       if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
       r = rnd & 0xf;
       rnd = rnd >> 4;
       uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
     }
   }
   return uuid.join('');
 };

})();

if(!docCookies.hasItem("rozinahUUID")) {
   docCookies.setItem("rozinahUUID", Math.uuid(), 31536e3 /*EOY expiration */);
}

mixpanel.identify(docCookies.getItem("rozinahUUID"));
