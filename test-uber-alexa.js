var skill = require('./skill.js');
var config = require('config');
var UberSkillHandler = require('./uber-skill-handler.js');

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

// Tests the entire skill as defined by skill.js
// skill.test(i, undefined, function(foo, text) {
// 	console.log('Alexa says: '+text.outputSpeech.text);
// });

// Tests purchase flow w/o alexa logic
UberSkillHandler.testRequestFlow();