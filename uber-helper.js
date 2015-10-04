// 

var PREFERRED_UBER_TYPE = 'uberX';

function UberHelper(options) {
	this.preferred_ride_type = PREFERRED_UBER_TYPE;
}

module.exports = UberHelper;

UberHelper.prototype.getPreferredRide = function (rides) {

	for ( var i = 0; i < rides.length; i++ ) {
		var ride = rides[i];
		if ( ride.display_name == this.preferred_ride_type ) {
			return ride;
		}
	}

};

UberHelper.prototype.pronouncableName = function (ride) {

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