var Uber = require('node-uber');
var Q = require('q');
var _ = require('underscore');
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

var PREFERRED_UBER_TYPE = 'uberX';


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


var timeEstimatePromise = function(params) {

	console.log('making time estimate.... params='+JSON.stringify(params));

	var deferred = Q.defer();

	uber.estimates.time(params, function (err, res) {

	  console.log('[SKILL] time estimate done.');

	  if (err) {
	  	console.error(err);
	  	deferred.reject(err);
	  } else {
	  	console.log('time estimate says'+ JSON.stringify(res));
  		deferred.resolve(res);
  	  }
	});

	return deferred.promise;
};

// var requestDetailsPromise = function(params) {

// 	console.log('making ride-request details request.... params='+JSON.stringify(params));

// 	var deferred = Q.defer();

// 	uber.resources.details(params, function (err, res) {

// 	  console.log('[SKILL] ride-request details done.');

// 	  if (err) {
// 	  	console.error(err);
// 	  	deferred.reject(err);
// 	  } else {
// 	  	console.log('ride-request details says'+ JSON.stringify(res));
//   		deferred.resolve(res);
//   	  }
// 	});

// 	return deferred.promise;
// };

var requestEstimatePromise = function(params) {

	console.log('requesting ride estimate....');

	var deferred = Q.defer();

	uber.requests.estimate(params, function (err, res) {

	  console.log('[SKILL] request estimate done.');

	  if (err) {
	  	console.error(err);
	  	deferred.reject(err);
	  } else {
	  	console.log('request estimate says'+ JSON.stringify(res));
  		deferred.resolve(res);
  	  }
	});

	return deferred.promise;

};

var getBestTimeEstimate = function(times) {
	
	for ( var i = 0; i < times.length; i++ ) {

		var product_estimate = times[i];
		if ( product_estimate.display_name == PREFERRED_UBER_TYPE ) {
			var mins = (product_estimate.estimate / 60).toFixed(0);
			var timeString;
			if ( mins == 1 ) {
				timeString = '1 minute';
			} else if ( mins > 1 ) {
				timeString = mins + ' minutes';
			} else {
				timeString = 'less than a minute';
			}
			return {
				pronouncable_time : timeString,
				pronouncable_name : makePronouncableName(product_estimate)
			};
		}
	}

	console.log('no time estimate to use');
	return {
		pronouncable_time : 'thirty or forty years',
		pronouncable_name :  'Uber'
	};
};

var getBestRide = function(res) {

	for ( var i = 0; i < res.products.length; i++ ) {
		var ride = res.products[i];
		if ( ride.display_name == PREFERRED_UBER_TYPE ) {
			return ride;
		}
	}
};

var makePronouncableName = function(ride) {
	switch(ride.display_name) {
		case 'uberX':
			return 'Uber ex';
		case 'uberXL':
			return 'Uber excel';
		case 'UberBLACK':
			return 'Uber Black';
		case 'UberSUV':
			return 'Uber SUV';
		case 'uberTAXI':
			return 'Uber Taxi';
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
			console.log(res);
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

var howLongForARide = function(parameters, callback) {

	console.log('Time estimate request.');

	timeEstimatePromise(parameters)
	.then(function(estimate) {

		var best = getBestTimeEstimate(estimate.times);

		try {
			callback(undefined, best);
		} 
		catch(e) {
			console.log('callback error in confirmRideRequest. Err='+e);
		}	// catch so catch() below doesnt get any errors and call the callback a second time
	})
	.catch(function(err) {
		callback(err, undefined);
	});

};

var whatIsTheStatusOfMyRide = function(parameters, callback) {

	uber.resources.details(params, callback);

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
	confirmRideRequest : confirmRideRequest,
	howLongForARide : howLongForARide,
	whatIsTheStatusOfMyRide : whatIsTheStatusOfMyRide
};

