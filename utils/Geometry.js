'use strict'

/**
 * Return bounding box given a center point and an area.
 *
 * Given a point and an area, return the bounding
 * box of that area centered at the provided point.
 * Copied and adapted from this page:
 * https://stackoverflow.com/questions/238260/how-to-calculate-the-bounding-box-for-a-given-lat-lng-location
 *
 * The function will not check for errors in parameters, it is expected to run fast.
 *
 * @param {Array} theCenter - The center point of the bounding box, expressed as a GeoJSON geometry
 * @param {Number} theArea - The area of the bounding box in square kilometers, defaults to 30 seconds arc.
 * @returns {Object} - The bounding box as a GeoJSON polygon.
 */
function centerToBoundingBox(theCenter, theArea = 0.9266243887) {

	///
	// Conversion helpers.
	///
	Number.prototype.degreeToRadius = function () {
		return this * (Math.PI / 180)
	}
	Number.prototype.radiusToDegree = function () {
		return (180 * this) / Math.PI
	}

	// coordinate limits
	const MIN_LAT = (-90).degreeToRadius();
	const MAX_LAT = (90).degreeToRadius();
	const MIN_LON = (-180).degreeToRadius();
	const MAX_LON = (180).degreeToRadius();

	// Earth's radius (km)
	const ldEarthRadius = 6378.1;

	// angular distance in radians on a great circle
	const ldDistanceInRadius = theArea / ldEarthRadius;

	// center point coordinates (rad)
	const lsLatitudeInRadius = theCenter.coordinates[1].degreeToRadius();
	const lsLongitudeInRadius = theCenter.coordinates[0].degreeToRadius();

	// define deltaLon to help determine min and max longitudes
	const deltaLon = Math.asin(Math.sin(ldDistanceInRadius) / Math.cos(lsLatitudeInRadius));

	// minimum and maximum latitudes for given distance
	let lsMinLatitude = lsLatitudeInRadius - ldDistanceInRadius;
	let lsMaxLatitude = lsLatitudeInRadius + ldDistanceInRadius;

	// minimum and maximum longitudes for given distance
	let lsMinLongitude
	let lsMaxLongitude

	///
	// Latitude in limits.
	///
	if (lsMinLatitude > MIN_LAT && lsMaxLatitude < MAX_LAT) {
		lsMinLongitude = lsLongitudeInRadius - deltaLon;
		lsMaxLongitude = lsLongitudeInRadius + deltaLon;
		if (lsMinLongitude < MIN_LON) {
			lsMinLongitude = lsMinLongitude + 2 * Math.PI;
		}
		if (lsMaxLongitude > MAX_LON) {
			lsMaxLongitude = lsMaxLongitude - 2 * Math.PI;
		}
	}

	///
	// A pole is within the given distance.
	///
	else {
		lsMinLatitude = Math.max(lsMinLatitude, MIN_LAT);
		lsMaxLatitude = Math.min(lsMaxLatitude, MAX_LAT);
		lsMinLongitude = MIN_LON;
		lsMaxLongitude = MAX_LON;
	}

	// set bounding box coordinates.
	const latMin = lsMinLatitude.radiusToDegree()
	const latMax = lsMaxLatitude.radiusToDegree()
	const lonMin = lsMinLongitude.radiusToDegree()
	const lonMax = lsMaxLongitude.radiusToDegree()

	return {
		"type": "Polygon",
		"coordinates": [
			[
				[ lonMin, latMin ],
				[ lonMax, latMin ],
				[ lonMax, latMax ],
				[ lonMin, latMax ],
				[ lonMin, latMin ]
			]
		]
	}

}


module.exports = {
	centerToBoundingBox
}
