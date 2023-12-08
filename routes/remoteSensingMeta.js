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
const collection = db._collection('ShapeData')
const ModelDates = require('../models/remoteSensingDates')
const ModelSpans = require('../models/remoteSensingSpans')
const ModelTerms = require('../models/termsList')
const ModelDescriptors = require('../models/remoteSensingDescriptors')
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')
const startDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The start date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const endDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The end date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')

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
 * Make summary by time span.
 *
 * Given a geometry reference, this service will return the shape data
 * grouped by time span, providing the list of variables, the start
 * and end dates and the number of measurements.
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
			              start = MIN(doc.std_date),
			              end = MAX(doc.std_date),
			              count = COUNT()
			RETURN {
			    std_date_span: span,
			    std_terms: UNIQUE(FLATTEN(terms)),
			    std_date_start: start,
			    std_date_end: end,
			    count: count
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

}, 'list')

	.pathParam('shape', geometryHashSchema)
	.summary('Get shape data summary by variables')
	.response([ModelSpans],
		'Remote sensing data summary grouped by *annual*, *monthly* and *daily* time span.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `std_terms` property represents the list of variables with data in the current time frame.' +
		'\n' +
		'The `std_date_start` and `std_date_end` properties represents respectively the start and end dates of the current time frame.' +
		'\n' +
		'The `count` property represents the number of observations in the relative time span.'
	)
	.description(dd`
		This service will return the data summary of the provided shape grouped by date span for the provided list of variables.
	`);

/**
 * Get list of observation variable names for provided unit shape in provided date range.
 *
 * This service will return the list of observation variable names
 * associated with the unit shape provided as the path variable,
 * grouped by time span, for the provided date range indicated in the start
 * and end date path parameters.
 *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 */
router.get('terms/:shape/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.shape
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
			    SEARCH doc.geometry_hash == ${shape} AND
			           doc.std_date >= ${startDate} AND
			           doc.std_date <= ${endDate}
			    COLLECT span = doc.std_date_span
			    AGGREGATE terms = UNIQUE(doc.std_terms),
			              start = MIN(doc.std_date),
			              end = MAX(doc.std_date),
			              count = COUNT()
			RETURN {
			    std_date_span: span,
			    std_terms: UNIQUE(FLATTEN(terms)),
			    std_date_start: start,
			    std_date_end: end,
			    count: count
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

}, 'list')

	.pathParam('shape', geometryHashSchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)
	.summary('Get shape data summary for date range by date span')
	.response([ModelSpans],
		'Remote sensing data summary grouped by *annual*, *monthly* and *daily* time span.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `std_terms` property represents the list of variables with data in the current time frame.' +
		'\n' +
		'The `std_date_start` and `std_date_end` properties represents respectively the start and end dates of the current time frame.' +
		'\n' +
		'The `count` property represents the number of observations in the relative time span.'
	)
	.description(dd`
		This service will return the data summary of the provided shape grouped by date span for the provided date range.
	`);

/**
 * Get list of observation variable names for provided unit shape in provided date range.
 *
 * This service will return the list of observation variable names
 * associated with the unit shape provided as the path variable,
 * grouped by time span, for the provided date range indicated in the start
 * and end date path parameters.
 *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 */
router.post('terms/:shape', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.shape
	const terms = req.body

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
			    SEARCH doc.geometry_hash == ${shape} AND
			           doc.std_terms IN ${terms.std_terms}
			    COLLECT span = doc.std_date_span
			    AGGREGATE terms = UNIQUE(doc.std_terms),
			              start = MIN(doc.std_date),
			              end = MAX(doc.std_date),
			              count = COUNT()
			RETURN {
			    std_date_span: span,
			    std_terms: UNIQUE(FLATTEN(terms)),
			    std_date_start: start,
			    std_date_end: end,
			    count: count
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

}, 'list')

	.pathParam('shape', geometryHashSchema)
	.body(ModelTerms, dd`
		Provide the list of terms to filter by.
	`)

	.summary('Get shape data summary for variables selection')
	.response([ModelSpans],
		'Remote sensing data summary grouped by *annual*, *monthly* and *daily* time span.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `std_terms` property represents the list of variables with data in the current time frame.' +
		'\n' +
		'The `std_date_start` and `std_date_end` properties represents respectively the start and end dates of the current time frame.' +
		'\n' +
		'The `count` property represents the number of observations in the relative time span.'
	)
	.description(dd`
		This service will return the data summary of the provided shape grouped by date span for the provided list of variables.
	`);
