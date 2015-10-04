var uberAlex = require('./skill.js');
var config = require('config');

var myLocation = config.get('Alexa.location');

// var e = {
// 	session : {
// 		applicationId : '123'
// 	}
// };

// console.log('Event = '+JSON.stringify(e));

var i = {
	name: 'danny'
};

uberAlex.test(i, undefined, function(foo, text) {
	console.log('Alexa says: '+text.outputSpeech.text);
});