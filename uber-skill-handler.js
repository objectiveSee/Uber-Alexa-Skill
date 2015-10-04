var Uber = require('node-uber');
global.Q = require('q');
global._ = require('underscore');
var request = require('request');
var config = require('config');

var uber = new Uber({
  client_id: config.get('Uber.client_id'),
  client_secret: config.get('Uber.client_secret'),
  server_token: config.get('Uber.server_token'),
  redirect_uri: config.get('Uber.redirect_uri'),
  name: 'Alexa Uber',
  sandbox: config.get('Uber.sandbox'),
  access_token: config.get('Uber.access_token')
});

if (! config.has('Uber.sandbox')) {
	console.log('WARNING: No sandbox flag defined. Cannot continue');
	process.exit(1);
}


var findRidesAndSelectBest = function(params) {
	var deferred = Q.defer();
	uber.products.list(params, function (err, res) {
	  if (err) {
	  	console.error(err);
	  	deferred.reject(err);
	  } else {
	  	// console.log('Ride List='+JSON.stringify(res,undefined,'\t'));
	  	var ride = getBestRide(res);
	  	ride.pronouncable_name = makePronouncableName(ride);
	  	if ( !ride ) {
	  		console.error('no ride found');
	  		deferred.reject(new Error('none found'));
	  	} else {
	  }
	  		console.log('Found ride.');
	  		deferred.resolve(ride);
	  	}
	});
	return deferred.promise;
};

var requestRidePromise = function(params) {

	console.log('requesting ride....');

	var deferred = Q.defer();

	uber.requests.requestRide(params, function (err, res) {

	  console.log('[SKILL] requestRide() done.');

	  if (err) {
	  	console.error(err);
	  	deferred.reject(err);
	  } else {
	  	console.log('requestRidePromise says'+ JSON.stringify(res));
  		deferred.resolve(res);
  	  }
	});

	return deferred.promise;

};

var makeRideConfirmationRequest = function(ride, params) {

	if ( !params.longitude || !params.latitude || !ride.product_id ) {

		throw new Error('Missing required parameters');

	} else {

		var product_id = ride.product_id;
		var requestParams = {
			product_id : product_id,
			start_longitude: params.longitude,
			start_latitude: params.latitude,
		};
		console.log('Will request ride:'+JSON.stringify(ride,null,'\t'));
		return requestRidePromise(requestParams);
	}
};

var requestEstimatePromise = function(params) {

	console.log('requesting ride estimate....');

	var deferred = Q.defer();

	uber.requests.estimate(params, function (err, res) {

	  console.log('[SKILL] estimate() done.');

	  if (err) {
	  	console.error(err);
	  	deferred.reject(err);
	  } else {
	  	console.log('estimate says'+ JSON.stringify(res));
  		deferred.resolve(res);
  	  }
	});

	return deferred.promise;

};

var getBestRide = function(res) {

	for ( var i = 0; i < res.products.length; i++ ) {
		var ride = res.products[i];
		if ( ride.display_name == 'uberX' ) {
			return ride;
		}
	}
};

var makePronouncableName = function(ride) {
	switch(ride.display_name) {
		case 'uberX':
			return 'Uber ex';
			break;
		case 'uberXL':
			return 'Uber ex el';
			break;
		case 'UberBLACK':
			return 'Uber Black';
			break;
		case 'UberSUV':
			return 'Uber SUV';
			break;
		case 'uberTAXI':
			return 'Uber Taxi'
			break;
	}
	console.log('no pronouncement for '+ride.display_name);
	return ride.display_name;
};

// used for testing
var getARide = function(params) {

	return findRidesAndSelectBest(params)
	.then(function(ride) {
		console.log('Making ride request now');
		return makeRideConfirmationRequest(ride, params);
	});

};

/**
Public Methods
*/

var findMeARide = function(parameters, callback) {
	findRidesAndSelectBest(parameters)
	.fail(function(error) {
		callback(error);
	})
	.done(function(ride) {
		console.log('done!'+JSON.stringify(ride,null,'\t'));
		callback(undefined, ride);
	});
};

var getUsername = function(callback) {
	uber.user.profile(uber.access_token, function (err, res) {
		if (err) {
			console.error(err);
			callback(err);
		} else {
			console.log(res)
			callback(undefined, 'Your usename name is' + res.first_name + ' ' + res.last_name);
		// deferred.resolve(ride);
		}

	});
};

var confirmRideRequest = function(ride, location, callback) {

	console.log('Confirming ride request');

	makeRideConfirmationRequest(ride, location)
	.then(function(riderequest) {
		try {
			callback(undefined, riderequest);
		} 
		catch(e) {
			console.log('callback error in confirmRideRequest. Err='+e);
		}	// catch so catch() below doesnt get any errors and call the callback a second time
	})
	.catch(function(err) {
		callback(err, undefined);
	});

};

/** 
	TESTING ONLY
**/
// var myLocation = { latitude: 37.775, longitude: -122.42 };
// getARide(myLocation)
// .then(function(request) {
// 	console.log('done! Request='+JSON.stringify(request));
// });

module.exports = {

	whatIsMyName : getUsername,
	findMeARide : findMeARide,
	confirmRideRequest : confirmRideRequest

};

