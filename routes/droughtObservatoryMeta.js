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
const ModelSummaryByDate = require('../models/doSummaryDataByDate')
const ModelSummaryByDateDescription =
	'Data summary by date.\n\n' +
	'The returned data is grouped as follows:\n\n' +
	'- `count`: Number of measurements.\n' +
	'- `std_date_start`: Date range start.\n' +
	'- `std_date_end`: Date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n' +
	'- `geometry_point_radius`: List of observation area radius.\n' +
	'- `geometry_point`: List of observation area GeoJSON centroids.\n' +
	'- `geometry_bounds`: List of observation area  GeoJSON polygons.\n'
const ModelSummaryByGeometry = require('../models/doSummaryDataByGeometry')
const ModelSummaryByGeometryDescription =
	'Data summary by measurement bounding box.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `count`: Number of measurements.\n' +
	'- `std_date_start`: Date range start.\n' +
	'- `std_date_end`: Date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n' +
	'- `geometry_point_radius`: The radius of the observation area from the centroid.\n' +
	'- `geometry_point`: GeoJSON centroid of the observation area.\n' +
	'- `geometry_bounds`: The GeoJSON polygon describing the area from which the data was extracted.\n'
const ModelSelectionSummary = require('../models/doSelectionSummaryData')
const ModelSelectionSummaryDescription =
	'Summary data selection.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n'
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
router.tag('Drought Observatory Metadata')


/**
 * Get data summary for provided coordinates and data selection.
 *
 * This service will return the data summary for the
 * provided coordinates and the provided data filters.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post(function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.EDOMetadata(
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
	if(result.length > 0) {
		if(result[0].std_terms.length > 0) {
			res.send(result)
		} else {
			res.send([])
		}
	} else {
		res.send([])
	}

}, 'SummaryForCoordinates')

	///
	// Path parameters schemas.
	///
	.queryParam('lat', latSchema)
	.queryParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionSummary, ModelSelectionSummaryDescription)

	///
	// Response schema.
	///
	.response([ModelSummaryByDate], ModelSummaryByDateDescription)

	///
	// Summary.
	///
	.summary('Metadata for coordinates')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data will not grouped.
	`);

/**
 * Get data summary for provided coordinates and data selection by area.
 *
 * This service will return the data summary for the
 * provided coordinates and the provided data filters
 * grouping the results by observation bounding boxes.
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
		queries.EDOMetadataByGeometry(
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
	if(result.length > 0) {
		if(result[0].std_terms.length > 0) {
			res.send(result)
		} else {
			res.send([])
		}
	} else {
		res.send([])
	}

}, 'SummaryForCoordinatesByArea')

	///
	// Path parameters schemas.
	///
	.queryParam('lat', latSchema)
	.queryParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionSummary, ModelSelectionSummaryDescription)

	///
	// Response schema.
	///
	.response([ModelSummaryByGeometry], ModelSummaryByGeometryDescription)

	///
	// Summary.
	///
	.summary('Metadata by geometry for coordinates')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data will be grouped by observation resolution.
	`);
