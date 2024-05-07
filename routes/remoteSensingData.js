'use strict'

/**
 * remoteSensingData.js
 *
 * This script contains the routes for the remote sensing data services.
 * All routes expect the Shapes _key as the key path parameter and return
 * observation data grouped by daily, monthly and yearly time spans.
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
// Collections and models.
///
const ModelSpanData = require('../models/rsDataBySpan')
const ModelSpanDataDescription =
	'Full data by time span.\n\n' +
	'The returned data is grouped by time span and within the span it is ' +
	'grouped by date. This is the data structure:\n\n' +
	'- `std_date_span`: Data measurements time span.\n' +
	'- `std_date_series`: The list of measurements in the current time span.\n' +
	'- `std_date`: Measurement date.\n' +
	'- `properties`: List of variables measured in that date.\n\n' +
	'There will be one record per time span.'
const ModelSelectionData = require('../models/rsSelectionData')
const ModelSelectionDataDescription =
	'Data selection criteria.\n\n' +
	'The selection data is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property.\n' +
	'Note that if you filter variables you will be returned only those variable ' +
	'values and the results will omit the list of datasets.'
const geometrySchema = joi.string()
	.regex(/^[0-9a-f]{32}$/)
	.required()
	.description(
		'Unit shape geometry hash.\n' +
		'The value is the `_key` of the `Shapes` collection record.'
	)

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Remote Sensing Data')


/**
 * Get remote sensing data by geometry_hash and time spans.
 *
 * This service will return all observations of the provided unit shape
 * for the provided time spans
 *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 * - body: The list of spans.
 */
router.post(function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.queryParams.geometry_hash

	///
	// Get query.
	///
	const query =
		queries.ShapeDataByShape(
			req.body,
			shape
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

}, 'GetDataBySpan')

	///
	// Path parameter schemas.
	///
	.queryParam('geometry_hash', geometrySchema)

	///
	// Body parameters schemas.
	///
	.body(ModelSelectionData, ModelSelectionDataDescription)

	///
	// Summary.
	///
	.summary('Filter data for provided shape and span by date')

	///
	// Response schema.
	///
	.response([ModelSpanData], ModelSpanDataDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return *all* remote sensing data related to \
		the *provided* unit *shape geometry hash* and *selection criteria*.
		There will be one record per date span and within that date span \
		one record per date.
	`)
