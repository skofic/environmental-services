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
const ModelDescriptors = require('../models/remoteSensingDescriptors')
const keySchema = joi.string().required()
	.description('Unit shape record identifier.\nThe value is the `_key` of the `Shapes` collection record.')
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
 * Get time spans for provided unit shape.
 *
 * This service will return the time spans and observation counts for
 * the unit shape identified by the provided path variable.
 *
 * The service will return one record per time span.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 */
router.get('spans/:key', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    COLLECT resolution = doc.std_date_span WITH COUNT INTO count
			RETURN {
			    std_date_span: resolution,
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

	.pathParam('key', keySchema)
	.response([ModelSpans],
		'Remote sensing observations *count* grouped by *annual*, *monthly* and *daily* time span.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `count` property represents the number of observations in the relative time span.'
	)
	.summary('Get observations count for provided unit shape grouped by time span')
	.description(dd`
		This service will return the *number of observations*, related to the provided *unit shape identifier*, grouped by *annual*, *monthly* and *daily* time spans.
	`);

/**
 * Get dates range for provided unit shape.
 *
 * This service will return the start and end dates for all
 * time spans, annual, monthly and daily, related to the
 * unit shape indicated in the path argument.
 *
 * The service will return one record per time span.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 */
router.get('dates/:key', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    COLLECT span = doc.std_date_span
			    AGGREGATE startDate = MIN(doc.std_date), endDate = MAX(doc.std_date)
			RETURN {
			    std_date_span: span,
			    startDate: startDate,
			    endDate: endDate
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

	.pathParam('key', keySchema)
	.response([ModelDates],
		'Remote sensing observation *date ranges* grouped by *annual*, *monthly* and *daily* data.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `startDate` and `endDate` properties contain respectively the *start* and *end dates* for observations in the *current time span*. These dates will have the `YYYY`, `YYYYMM` or `YYYYMMDD` formats when referring respectively to *annual*, *monthly* and *daily data*.'
	)
	.summary('Get observation date ranges for the requested unit shape grouped by time span')
	.description(dd`
		This service will return the *start* and *end dates* of remote sensing data for the provided unit *shape key*, grouped by *annual*, *monthly* and *daily* time span.
	`);

/**
 * Get list of observation variable names for provided unit shape.
 *
 * This service will return the list of observation variable names
 * associated with the unit shape provided as the path variable,
 * grouped by time span.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 */
router.get('terms/:key', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    COLLECT span = doc.std_date_span
			    AGGREGATE terms = UNIQUE(doc.std_terms)
			RETURN {
			    std_date_span: span,
			    std_terms: UNIQUE(FLATTEN(terms))
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

	.pathParam('key', keySchema)
	.response([ModelDescriptors],
		'Remote sensing observation *descriptors* grouped by *annual*, *monthly* and *daily* data.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `std_terms` property contains the list of all observation *variables* that can be found in the *current time span* for the provided *unit shape*.\n\n' +
		'Forward the list of descriptors to the [data dictionary](https://github.com/skofic/data-dictionary-service.git) to retrieve their metadata.'
	)
	.summary('Get list of descriptors for the requested unit shape grouped by time span')
	.description(dd`
		This service will return the list of *variable names*, associated with the *provided unit shape*, that can be found in *observations* grouped by *time span*.\n\nIt will return a list of *descriptor names* for each *daily*, *monthly* and *yearly* time span, that can be found in *remote sensing data* of the provided *unit shape*.
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
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 */
router.get('terms/:key/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    FILTER doc.std_date >= ${startDate}
			    FILTER doc.std_date <= ${endDate}
			    COLLECT span = doc.std_date_span
			    AGGREGATE terms = UNIQUE(doc.std_terms)
			RETURN {
			    std_date_span: span,
			    std_terms: UNIQUE(FLATTEN(terms))
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

	.pathParam('key', keySchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)
	.response([ModelDescriptors],
		'Remote sensing observation *descriptors* grouped by *annual*, *monthly* and *daily* data.\n' +
		'\n' +
		'The `std_date_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `std_terms` property contains the list of all observation *variables* that can be found in the *current time span* for the provided *unit shape*.\n\n' +
		'Forward the list of descriptors to the [data dictionary](https://github.com/skofic/data-dictionary-service.git) to retrieve their metadata.'
	)
	.summary('Get list of descriptors for the requested unit shape and dates range grouped by time span')
	.description(dd`
		This service will return the list of *variable names*, associated with the *provided unit shape*, that can be found in *observations* performed in the *time range* defined by the provided *start* and *end* dates: the result will be a list of *descriptor names* for each *daily*, *monthly* and *yearly* time span.
	`);
