'use strict'

/**
 * droughtObservatoryData.js
 *
 * This script contains the routes for the drought observatory data services.
 * All routes expect a reference point and return observation data.
 */

///
// Load modules.
///
const dd = require('dedent')
const joi = require('joi')
const {aql, db} = require('@arangodb')
const createRouter = require('@arangodb/foxx/router')

///
// Queries.
///
const queries = require('../utils/servicesFiltersAQL')

///
// Models.
///
const ModelDataArea = require('../models/doDataByArea')
const ModelDataAreaDescription =
	'Data by measurement bounding box.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `geometry_point_radius`: The radius of the observation area from the centroid.\n' +
	'- `geometry_point`: GeoJSON centroid of the observation area.\n' +
	'- `geometry_bounds`: The GeoJSON polygon describing the area from which the data was extracted.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n' +
	'- `properties`: A set of records featuring the measurement date and observed variables for the current observation resolution.\n\n' +
	'There will be one record per measurement area.'
const ModelDataDate = require('../models/doDataByDate')
const ModelDataDateDescription =
	'Data by measurement date.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `std_date`: Measurement date.\n' +
	'- `properties`: The set of measurements on that date.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers..\n\n' +
	'There will be one record per date.'
const ModelSelectionData = require('../models/doSelectionData')
const ModelSelectionDataDescription =
	'Data selection criteria by area.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property'
const ModelSelectionDate = require('../models/doSelectionDate')
const ModelSelectionDateDescription =
	'Data selection criteria by date.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n' +
	'- `paging`: Paging: provide offset and limit properties, or omit the property to return all available data.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property.\n' +
	'Note that if you filter variables you will be returned only those variable ' +
	'values and the results will omit the list of datasets.'

///
// Schemas.
///
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Drought Observatory Data')


/**
 * Get all drought related data by area.
 *
 * This service will return all drought data associated
 * with the provided coordinates, grouped by area.
 *
 * Use this service with care, since it might return a large amount of data.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post('shape', function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.EDODataByGeometry(
			req.queryParams.lat,
			req.queryParams.lon,
			req.body
		)

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(query).toArray()
	} catch (error) {
		throw error
	}

	///
	// Return result.
	///
	res.send(result)

}, 'SelectDataByArea')

	///
	// Path parameter schemas.
	///
	.queryParam('lat', latSchema)
	.queryParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionData, ModelSelectionDataDescription)

	///
	// Summary.
	///
	.summary('Data by geometry')

	///
	// Response schema.
	///
	.response([ModelDataArea], ModelDataAreaDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the data covering the *provided* coordinates.
		The resulting data will be grouped by measurement bounding box.
		In the request body you can provide the selection criteria.
		*Note that there is no paging on the area sub-records, so use this service \
		to process or store the data, rather than using it for paging.*
	`);

/**
 * Get all drought related data by date.
 *
 * This service will return all drought data associated
 * with the provided coordinates, grouped by date.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post('date', function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.EDODataByDate(
			req.queryParams.lat,
			req.queryParams.lon,
			req.body
		)

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(query).toArray()
	} catch (error) {
		throw error
	}

	///
	// Return result.
	///
	res.send(result)

}, 'SelectDataByDate')

	///
	// Path parameter schemas.
	///
	.queryParam('lat', latSchema)
	.queryParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionDate, ModelSelectionDateDescription)

	///
	// Summary.
	///
	.summary('Data by date')

	///
	// Response schema.
	///
	.response([ModelDataDate], ModelDataDateDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the data covering the *provided* coordinates.
		The resulting data will be grouped by measurement bounding box.
		In the request body you can provide the selection criteria.
	`);
