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
// Collections and models.
///
const ModelSummaryBySpan = require('../models/rsSummaryDataBySpans')
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
const ModelSelectionSummary = require('../models/rsSelectionSummaryData')
const ModelSelectionSummaryDescription =
	'Data selection summary.\n\n' +
	'The selection data is structured as follows:\n\n' +
	'- `std_date_span`: Select time span, omit the property to consider all time spans.\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n\n' +
	'Either *provide a value* for the property to create a filter, or *omit the property* to ignore the filter.'
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')

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
 * Get shape summary data by time span.
 *
 * Given a geometry reference, this service will return the shape summary
 * data grouped by time span, providing the list of variables, the start
 * and end dates, the list of dataset identifiers and the number of measurements.
 *
 * The service will return one record per time span.
 *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 */
router.get('spans/:shape', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.shape

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
			    SEARCH doc.geometry_hash == ${shape}
			    
			    COLLECT span = doc.std_date_span
			    AGGREGATE terms = UNIQUE(doc.std_terms),
			              sets = UNIQUE(doc.std_dataset_ids),
			              start = MIN(doc.std_date),
			              end = MAX(doc.std_date),
			              count = COUNT()
			              
				RETURN {
				    count: count,
				    std_date_span: span,
				    std_date_start: start,
				    std_date_end: end,
				    std_terms: UNIQUE(FLATTEN(terms)),
				    std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null)
				}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'GetForGeometryBySpan')

	///
	// Path parameter schemas.
	///
	.pathParam('shape', geometryHashSchema)

	///
	// Summary.
	///
	.summary('Get shape data summary by time span')

	///
	// Response schema.
	///
	.response([ModelSummaryBySpan], ModelSummaryBySpanDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the data summary of \
		the provided shape grouped by date span.
	`);

/**
 * Select shape summary data by time span.
 *
 * Given a geometry reference and a set of search variables, this service
 * will return the shape summary data grouped by time span, providing the
 * list of variables, the start and end dates, the list of dataset identifiers
 * and the number of measurements.
 *
 * The service will return one record per time span. *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 */
router.post('spans/:shape', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.shape

	///
	// Collect body parameters.
	///
	const filters = [aql`SEARCH doc.geometry_hash == ${shape}`]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_span':
				filters.push(aql`AND doc.std_date_span IN ${value}`)
				break

			case 'std_date_start':
				filters.push(aql`AND doc.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND doc.std_date <= ${value}`)
				break

			case 'std_terms':
				filters.push(aql`AND ${value} ANY IN doc.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN doc.std_dataset_ids`)
				break
		}
	}
	const filter = aql.join(filters)

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
			    ${filter}
			    
			    COLLECT span = doc.std_date_span
			    AGGREGATE terms = UNIQUE(doc.std_terms),
			              sets = UNIQUE(doc.std_dataset_ids),
			              start = MIN(doc.std_date),
			              end = MAX(doc.std_date),
			              count = COUNT()
			              
				RETURN {
				    count: count,
				    std_date_span: span,
				    std_date_start: start,
				    std_date_end: end,
				    std_terms: UNIQUE(FLATTEN(terms)),
				    std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null)
				}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'SelectForGeometryBySpan')

	///
	// Path parameter schemas.
	///
	.pathParam('shape', geometryHashSchema)

	///
	// Body parameters schemas.
	///
	.body(ModelSelectionSummary, ModelSelectionSummaryDescription)

	///
	// Summary.
	///
	.summary('Get shape data summary for selection criteria by time span')

	///
	// Response schema.
	///
	.response([ModelSummaryBySpan], ModelSummaryBySpanDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided shape reference and selection criteria.
		The summary data will be grouped by measurement time span.
	`);
