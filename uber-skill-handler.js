var Uber = require('node-uber');
var Q = require('q');
var _ = require('underscore');
var request = require('request');
var config = require('config');
var UberHelperClass = require('./uber-helper');

var UberHelper = new UberHelperClass();

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

var getProductListPromise = function(params) {

	var deferred = Q.defer();
	var myParams = JSON.parse(JSON.stringify(params));	// makes a copy so we can mutate

	if (!myParams.latitude) {
		myParams.latitude = myParams.start_latitude;
		delete myParams.start_latitude;
	}
	if (!myParams.longitude) {
		myParams.longitude = myParams.start_longitude;
		delete myParams.start_longitude;
	}

	console.log('[getProductListPromise] myParams='+JSON.stringify(myParams));

	uber.products.list(myParams, function (err, res) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(res.products);
		}
	});
	return deferred.promise;
};

var getEstimatePromise = function(params) {

	var deferred = Q.defer();

	console.log('[getEstimatePromise] params='+JSON.stringify(params));

	uber.requests.estimate(params, function (err, res) {
		if (err) {
			console.log('[getEstimatePromise] err='+JSON.stringify(err));
			deferred.reject(err);
		} else {
			console.log('[getEstimatePromise] res='+JSON.stringify(res));
			deferred.resolve(res);
		}
	});
	return deferred.promise;
};


var findBestRideAndEstimate = function(params) {

	var deferred = Q.defer();

	console.log('[findBestRideAndEstimate] params='+JSON.stringify(params));
	var ride;

	getProductListPromise(params)
	.then(function(rides) {
		console.log('[findBestRideAndEstimate] rides='+JSON.stringify(rides));

		ride = UberHelper.getPreferredRide(rides);
		console.log('[findBestRideAndEstimate] preferred ride='+JSON.stringify(ride));

		if ( !ride ) {
			throw new Error('Could not find preferred ride');
		}

		ride.pronouncable_name = UberHelper.pronouncableName(ride);
		params.product_id = ride.product_id;
		console.log('[findBestRideAndEstimate] getting estimates for ride');
		return getEstimatePromise(params);
	})
	.then(function(estimate) {
		console.log('[findBestRideAndEstimate] estimate='+JSON.stringify(estimate));
		deferred.resolve({
			ride: ride,
			estimate: estimate
		});
	})
	.fail(function(err) {
		deferred.reject(err);
	});

	return deferred.promise;
};

var requestRidePromise = function(params) {

	console.log('requesting ride....');

	var deferred = Q.defer();

	uber.requests.requestRide(params, function (err, res) {

	  console.log('[SKILL] requestRide() done. Res='+JSON.stringify(res) + 'err='+JSON.stringify(err));

	  if (err) {
	  	console.error(err);
	  	deferred.reject(err);
	  } else {
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
		if ( params.surge_confirmation_id ) {
			requestParams.surge_confirmation_id = params.surge_confirmation_id;
		}
		console.log('Will request ride:'+JSON.stringify(ride,null,'\t')+' with params: '+JSON.stringify(requestParams));
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

// var requestEstimatePromise = function(params) {

// 	console.log('requesting ride estimate....');

// 	var deferred = Q.defer();

// 	uber.requests.estimate(params, function (err, res) {

// 	  console.log('[SKILL] request estimate done.');

// 	  if (err) {
// 	  	console.error(err);
// 	  	deferred.reject(err);
// 	  } else {
// 	  	console.log('request estimate says'+ JSON.stringify(res));
//   		deferred.resolve(res);
//   	  }
// 	});

// 	return deferred.promise;

// };

var getBestTimeEstimate = function(times) {

	var ride = UberHelper.getPreferredRide(times);
	var timePronounced;
	var namePronounced;

	if ( !ride ) {
		console.log('no time estimate to use');
		timePronounced = 'thirty or forty years. Just kidding. Uber responded with an error';
		namePronounced = 'Uber';

	} else {

		console.log('Preferred Ride is '+JSON.stringify(ride));

		var mins = (ride.estimate / 60).toFixed(0);

		if ( mins == 1 ) {
			timePronounced = '1 minute';
		} else if ( mins > 1 ) {
			timePronounced = mins + ' minutes';
		} else {
			timePronounced = 'less than a minute';
		}
		namePronounced = UberHelper.pronouncableName(ride);
	}

	return {
		pronouncable_time : timePronounced,
		pronouncable_name :  namePronounced
	};
};

// used for testing
var getARide = function(params) {

	return findBestRideAndEstimate(params)
	.then(function(res) {
		console.log('Making ride request now');
		return makeRideConfirmationRequest(res.ride, params);
	});

};

/**
Public Methods
*/

var findMeARide = function(parameters, callback) {

	findBestRideAndEstimate(parameters)
	.fail(function(error) {
		callback(error);
	})
	.done(function(res) {
		console.log('[findMeARide] res='+JSON.stringify(res));
		if ( !res.ride || !res.estimate ) {
			throw new Error('Missing ride or estimate in findMeARide');
		}
		callback(undefined, res.ride, res.estimate);
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

var confirmRideRequest = function(ride, params, callback) {

	console.log('Confirming ride request');

	makeRideConfirmationRequest(ride, params)
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
var testRequestFlow = function() {
	console.log('[testRequestFlow] Begin');
	var myLocation = config.get('Alexa.location');
	getARide(myLocation)
	.then(function(request) {
		console.log('[testRequestFlow] Done! Request='+JSON.stringify(request));
	});	
}


module.exports = {

	whatIsMyName : getUsername,
	findMeARide : findMeARide,
	confirmRideRequest : confirmRideRequest,
	howLongForARide : howLongForARide,
	whatIsTheStatusOfMyRide : whatIsTheStatusOfMyRide,
	testRequestFlow : testRequestFlow
};

