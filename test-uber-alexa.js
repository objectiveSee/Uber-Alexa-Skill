var uberAlex = require('./uber-alexa.js');

var e = {
	session : {
		applicationId : '123'
	}
};

var c = {
	fail : function(e) {
		console.log('fail'+e);
	}
};

console.log('Event = '+JSON.stringify(e));

var i = {
	name: 'danny'
};

uberAlex.test(i, undefined, function(foo, text) {
	console.log('Alexa says: '+text.outputSpeech.text);
});