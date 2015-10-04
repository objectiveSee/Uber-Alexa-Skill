var request = require('request');
var UberSkillHandler = require('./uber-skill-handler.js');
var config = require('config');

/**
 * For additional samples, visit the Alexa Skills Kit developer documentation at
 * https://developer.amazon.com/appsandservices/solutions/alexa/alexa-skills-kit/getting-started-guide
 */

var myLocation = config.get('Alexa.location');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log('Event is '+JSON.stringify(event));
    	if ( event && event.session && event.session.application && event.session.application.applicationId ) {
        	console.log("event.session.application.applicationId=" + event.session.application.applicationId);
    	}

    	if ( event.event_type == 'requests.status_changed' ) {
    		console.log('Uber signaled an event status change.');
    		context.succeed({'thank you':true});
    		return;
    	}

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
         }
        */

        /**
        Amazon Echo Commands
        */
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        } else {
        	console.log('Unrecognized event.');
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("UberPickupIntent" === intentName) {
        uberPickupIntentStart(intent, session, callback);
    } else if ("UberPickupConfirmIntent" === intentName) {
    	UberPickupConfirmIntent(intent, session, callback);
    } else if ("UberTimeEstimateIntent" === intentName) {
        UberTimeEstimateIntent(intent, session, callback);
    } else if ("UberRequestDetailsIntent" === intentName) {
        UberRequestDetailsIntent(intent, session, callback);
    } else if ("WeatherRain" === intentName) {
        getWeatherRain(intent, session, callback);
    } else if ("HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

// TODO: untested
function getWelcomeResponse(intent, session, callback) {

    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "Uber is ready";

	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getWeatherRain(intent, session, callback) {

    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var apikey = config.get('Weather.api-key');
    if  (!apikey ) { 
    	return callback(new Error ('No weather API key'));
    }

    var options = {
    	url: 'https://api.forecast.io/forecast/'+apikey+'/'+myLocation.latitude+','+myLocation.longitude,
    	qs: {
    		exclude: 'daily,flags,alerts'
    	}
    };

    request(options, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
  			var json = JSON.parse(body);
    		// console.log(JSON.stringify(json,null,'\t'));

	        // speechOutput = json.hourly.summary;
	        // var timeUntilChange = json.minutesUntilChange;
	        var summary = json.minutely.summary;

	        if ( json.isPrecipitating ) {

	        	speechOutput = summary + '. Do you have an umbrella?';

	        } else {

				speechOutput = summary;
	        }


  		} else {
  			console.log('err');
  			speechOutput = 'error sorry dannny'
  		}

  		callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
	});

}

exports.test = function(a,b,c) {
	//getWeatherRain(a,b,c);
	// uberPickupIntentStart(a,b,c);
	UberTimeEstimateIntent(a,b,c);
};

/**
 * Begin Uber request
 */
function uberPickupIntentStart(intent, session, callback) {

    var cardTitle = intent.name;
    // var pickupDateSlot = intent.slots.MyPickupDate;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    console.log('Received Uber intent. Intent='+JSON.stringify(intent));

    UberSkillHandler.findMeARide(myLocation, function(err,ride) {
    	if ( err ) {
    		speechOutput = 'I had issues talking to Uber.';
    		shouldEndSession = true;
    	} else {
    
    		sessionAttributes['ride'] = ride;
    		sessionAttributes['waiting_user_confirmation'] = true;
	
			speechOutput = 'Do you want me to call a '+ride.pronouncable_name+'?';
        	repromptText = 'Ill ask again. '+speechOutput;
    	}

    	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
};

function UberPickupConfirmIntent(intent, session, callback) {

    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var respond = true;

    console.log('Received Uber intent. Intent='+JSON.stringify(intent) +', Session='+JSON.stringify(session));

    if ( session.attributes.waiting_user_confirmation && session.attributes.ride ) {
	    var userConfirmation = intent.slots.UserResponse;
	    if ( userConfirmation ) {

	    	if ( userConfirmation.value == 'yes' ) {

	    		respond = false;
	    		UberSkillHandler.confirmRideRequest(session.attributes.ride, myLocation, function(err,riderequest) {

	    			if ( err || !riderequest ) {
	    				console.log('Error confirming ride: '+err);
			    		speechOutput = 'There was an error confirming your ride with Uber.';	    				
	    			} else {
	    				speechOutput = 'Called an '+session.attributes.ride.pronouncable_name;
	    				if ( riderequest.surge_multiplier > 1 ) {
	    					speechOutput = speechOutput + ' There is a surge of '+riderequest.surge_multiplier+'.';
	    				}
	    			}
	    			callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

	    		});

	    	} else {
	    		speechOutput = 'ok. I wont call an Uber then.';
	    	}

	    } else {
	    	speechOutput = "I dont know how to respond. Say yes or no next time";
	    }
	} else {
		speechOutput = "Developer error. Confirm Intent Failed.";
	}

	if ( respond ) {
	    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
	}
}

function UberRequestDetailsIntent(intent, session, callback) {

    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var respond = true;

    console.log('Received Uber request details intent. Intent='+JSON.stringify(intent) +', Session='+JSON.stringify(session));

    speechOutput = "This feature is not yet complete. DynamoDB is not setup";

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

    // TODO: need persistent storage to get the latest request_id. Use DynamoDB (used in Scorekeeper Echo example from Amazon)
    // clever trick to use session || db depending on whether session has the data we need
    // var params = {
    // 	request_id : 
    // }

	// UberSkillHandler.whatIsTheStatusOfMyRide(params, function(err,estimate) {
	// ... and so on. copied from another function
	// 	if ( err || !estimate ) {
	// 		console.log('Error w/ time estimate: '+err);
 //    		speechOutput = 'There was an error estimating the time.';	    				
	// 	} else {
	// 		speechOutput = 'An '+estimate.pronouncable_name+' can be here in '+estimate.pronouncable_time;
	// 	}
	// 	callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
	// });	
}

function UberTimeEstimateIntent(intent, session, callback) {

    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";
    var respond = true;

    console.log('Received Uber time estimate intent. Intent='+JSON.stringify(intent) +', Session='+JSON.stringify(session));

    var myStartLocation = function(l) {
    	return {
    		start_longitude : l.longitude,
    		start_latitude : l.latitude
    	};
    };

	UberSkillHandler.howLongForARide(myStartLocation(myLocation), function(err,estimate) {

		if ( err || !estimate ) {
			console.log('Error w/ time estimate: '+err);
    		speechOutput = 'There was an error estimating the time.';	    				
		} else {
			speechOutput = 'An '+estimate.pronouncable_name+' can be here in '+estimate.pronouncable_time;
		}
		callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
	});	
}

function createPickupAttributes(date) {
    return {
        pickupDate: date
    };
}

function getColorFromSession(intent, session, callback) {
    var cardTitle = intent.name;
    var favoriteColor;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(session.attributes) {
        favoriteColor = session.attributes.favoriteColor;
    }

    if(favoriteColor) {
        speechOutput = "Your favorite color is " + favoriteColor + ", goodbye";
        shouldEndSession = true;
    }
    else {
        speechOutput = "I'm not sure what your favorite color is, you can say, my favorite color "
                + " is red";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
             buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}