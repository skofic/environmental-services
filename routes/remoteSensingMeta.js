'use strict'

/**
 * remoteSensingMeta.js
 *
 * This script contains the routes for the remote sensing metadata services.
 * By metadata we mean here services that return information on the time frame
 * of the remote sensing data, and the variables measured in the unit shapes.
 *
 * For getting the actual metadata refer to the
 * https://github.com/skofic/data-dictionary-service service.
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
const ModelSummaryBySpans = require('../models/rsSummaryDataBySpans')
const ModelSummaryBySpanDescription =
	'Data summary by time span.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `count`: Number of data measurements.\n' +
	'- `std_date_span`: Data measurements time span.\n' +
	'- `std_date_start`: Measurement date range start.\n' +
	'- `std_date_end`: Measurement date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n\n' +
	'The data will be grouped by time span.'
const ModelSummaryByUnits = require('../models/rsSummaryDataByUnits')
const ModelSummaryByUnitDescription =
	'Data summary by unit and time span.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `gcu_id_number`: Unit reference.\n' +
	'- `properties`: Summary data by time span:\n\n' +
	'- `count`: Number of data measurements.\n' +
	'- `std_date_span`: Data measurements time span.\n' +
	'- `std_date_start`: Measurement date range start.\n' +
	'- `std_date_end`: Measurement date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n\n' +
	'The data will be grouped by unit and time span.'
const ModelSummaryByShapes = require('../models/rsSummaryDataByShapes')
const ModelSummaryByShapeDescription =
	'Data summary by shape and time span.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `geometry_hash`: Shape reference.\n' +
	'- `properties`: Summary data by time span:\n\n' +
	'- `count`: Number of data measurements.\n' +
	'- `std_date_span`: Data measurements time span.\n' +
	'- `std_date_start`: Measurement date range start.\n' +
	'- `std_date_end`: Measurement date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n\n' +
	'The data will be grouped by shape and time span.'
const ModelSelectionUnitSummary = require('../models/rsSelectionUnitSummary')
const ModelSelectionUnitSummaryDescription =
	'Data selection summary by unit.\n\n' +
	'The selection data is structured as follows:\n\n' +
	'- `gcu_id_number_list`: List of requested unit numbers (*required*).\n' +
	'- `std_date_span`: Select time span, omit the property to consider all time spans.\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n\n' +
	'Either *provide a value* for the property to create a filter, or *omit the property* to ignore the filter.'
const ModelSelectionShapeSummary = require('../models/rsSelectionShapeSummary')
const ModelSelectionShapeSummaryDescription =
	'Data selection summary by shape.\n\n' +
	'The selection data is structured as follows:\n\n' +
	'- `geometry_hash_list`: List of requested shape references (*required*).\n' +
	'- `std_date_span`: Select time span, omit the property to consider all time spans.\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n\n' +
	'Either *provide a value* for the property to create a filter, or *omit the property* to ignore the filter.'

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Remote Sensing Metadata')


/**
 * Select shape summary data by time span.
 *
 * Given a set of search variables, this service will return the summary data
 * for GCU shapes grouped by time span.
 *
 * The service will return one record per time span.
 */
router.post('span/shape', function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.ShapeMetadataBySpan(
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
	
}, 'SelectForSpanShape')
	
	///
	// Body parameters schemas.
	///
	.body(ModelSelectionShapeSummary, ModelSelectionShapeSummaryDescription)
	
	///
	// Summary.
	///
	.summary('Shape metadata by time span')
	
	///
	// Response schema.
	///
	.response([ModelSummaryBySpans], ModelSummaryBySpanDescription)
	
	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all shape data measurements \
		available for the provided selection criteria.
		The summary data will be aggregated by measurement time span.
	`);

/**
 * Select shape summary data by unit.
 *
 * Given a set of search variables, this service will return the summary data
 * for GCUs grouped by time span.
 *
 * The service will return one record per time span.
 */
router.post('span/unit', function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.UnitMetadataBySpan(
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
	
}, 'SelectForSpanUnit')
	
	///
	// Body parameters schemas.
	///
	.body(ModelSelectionUnitSummary, ModelSelectionUnitSummaryDescription)
	
	///
	// Summary.
	///
	.summary('Unit metadata by time span')
	
	///
	// Response schema.
	///
	.response([ModelSummaryBySpans], ModelSummaryBySpanDescription)
	
	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all unit data measurements \
		available for the provided selection criteria.
		The summary data will be aggregated by measurement time span.
	`);

/**
 * Select shape summary data by shape and time span.
 *
 * Given a set of search variables, this service will return the summary data
 * grouped by shape and time span.
 *
 * The service will return one record per shape with summary data grouped
 * by time span in the `properties` property.
 */
router.post('shape', function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.ShapeMetadataByShape(
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
	
}, 'SelectForGeometryBySpan')
	
	///
	// Body parameters schemas.
	///
	.body(ModelSelectionShapeSummary, ModelSelectionShapeSummaryDescription)
	
	///
	// Summary.
	///
	.summary('Metadata by geometry and time span')
	
	///
	// Response schema.
	///
	.response([ModelSummaryByShapes], ModelSummaryByShapeDescription)
	
	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all shape data measurements \
		available for the provided selection criteria.
		The summary data will be grouped by shape and aggregated by measurement time span.
	`);

/**
 * Select shape summary data by unit and time span.
 *
 * Given a set of search variables, this service will return the summary data
 * grouped by unit and time span.
 *
 * The service will return one record per unit with summary data grouped
 * by time span in the `properties` property.
 */
router.post('unit', function (req, res)
{
	///
	// Get query.
	///
	const query =
		queries.ShapeMetadataByUnit(
			req.body.gcu_id_number_list,
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
	
}, 'SelectForUnitBySpan')
	
	///
	// Body parameters schemas.
	///
	.body(ModelSelectionUnitSummary, ModelSelectionUnitSummaryDescription)
	
	///
	// Summary.
	///
	.summary('Metadata by unit and time span')
	
	///
	// Response schema.
	///
	.response([ModelSummaryByUnits], ModelSummaryByUnitDescription)
	
	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all unit data measurements \
		available for the provided selection criteria.
		The summary data will be grouped by unit and aggregated by measurement time span.
	`);
