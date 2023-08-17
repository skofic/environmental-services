'use strict'

///
// Load modules.
///
const dd = require('dedent')
const joi = require('joi')
const httpError = require('http-errors')
const status = require('statuses')
const {errors, aql, db} = require('@arangodb')
const {context} = require('@arangodb/locals')
const createRouter = require('@arangodb/foxx/router')

///
// Collections and models.
///
const collection = db._collection('ShapeData')
const ModelData = require('../models/remoteSensingData')
const ModelDates = require('../models/remoteSensingDates')
const ModelDescriptors = require('../models/remoteSensingDescriptors')
const keySchema = joi.string().required()
	.description('The key of the unit shape record')
const startDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The start date expressed as a string in YYYYMMDD, YYYYMM or YYYY format.')
const endDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The end date expressed as a string in YYYYMMDD, YYYYMM or YYYY format.')

///
// Errors.
///
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code
const HTTP_NOT_FOUND = status('not found')
const HTTP_CONFLICT = status('conflict')

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Remote Sensing')

///
// Get all remote sensing data.
//
// Parameters:
// - `:key`: The key of the unit shape.
///
router.get(':key', function (req, res)
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
				FILTER doc.GeometryID == ${key}
				SORT doc.std_date
				LET data = UNSET(doc, '_id', '_key', '_rev', 'GeometryID', 'std_span', 'std_terms')
				COLLECT resolution = doc.std_span INTO groups KEEP data
			RETURN {
                std_span: resolution,
                data: groups[*].data
			}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, error.message);
		}
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'list')

	.pathParam('key', keySchema)
	.response([ModelData],
		'Remote sensing data *combined* by *annual*, *monthly* and *daily* data.\n' +
		'\n' +
		'The `std_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `data` property contains the remote sensing data for that *time span* and for that unit *shape*. Each element in the array will feature a series of remote sensing *measurements* and their relative *date*, recorded in the `std_date` property, expressed as a *string* in the `YYYY` format for *annual* data, `YYYYMM` for *monthly* data and `YYYYMMDD` for *daily* data.'
	)
	.summary('Get all remote sensing data for the requested unit shape')
	.description(dd`
		This service will return *all* remote sensing data related to the *provided* unit *shape key*.
		
The data will be grouped by *daily*, *monthly* and *annual* observations. Within these groups the data will be further subdivided by the *observation date*.

*Use this service with caution: it may typically return more than 5MB. of data*.
	`);

/**
 * /
 * Get remote sensing data by GeometryID and time interval.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date
 * /
 */
router.get(':key/:startDate/:endDate', function (req, res)
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
			    FILTER doc.GeometryID == ${key}
                FILTER doc.std_date >= ${startDate}
                FILTER doc.std_date <= ${endDate}
                SORT doc.std_date
            LET data = UNSET(doc, '_id', '_key', '_rev', 'GeometryID', 'std_span', 'std_terms')
            COLLECT resolution = doc.std_span INTO groups KEEP data
			RETURN {
                std_span: resolution,
                data: groups[*].data
			}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, error.message);
		}
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
	.response([ModelData],
		'Remote sensing data *combined* by *annual*, *monthly* and *daily* data.\n' +
		'\n' +
		'The `std_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `data` property contains the remote sensing data for that *time span* and for that unit *shape*. Each element in the array will feature a series of remote sensing *measurements* and their relative *date*, recorded in the `std_date` property, expressed as a *string* in the `YYYY` format for *annual* data, `YYYYMM` for *monthly* data and `YYYYMMDD` for *daily* data.'
	)
	.summary('Get all remote sensing data for the requested unit shape and time period')
	.description(dd`
		This service will return remote sensing data related to the provided unit *shape key* and the *time interval* expressed by the provided *start* and *end dates*.

The data will be grouped by *daily*, *monthly* and *annual* observations. Within these groups the data will be further subdivided by the *observation date*.

Since the data returned may be *annual*, *monthly* and *daily*, it is important how you express the *start* and *end* dates: if you want to get all *yearly*, *monthly* and *daily* data for the year \`2010\` you should set the *start date* to \`2010\` and the *end date* to \`20101231\`.
	`);

///
// Get start and end dates for unit shape remote sensing data.
//
// Parameters:
// - `:key`: The key of the unit shape.
///
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
			    FILTER doc.GeometryID == ${key}
			    COLLECT resolution = doc.std_span
			    AGGREGATE startDate = MIN(doc.std_date), endDate = MAX(doc.std_date)
			RETURN {
			    std_span: resolution,
			    startDate: startDate,
			    endDate: endDate
			}
        `).toArray()
	}

		///
		// Handle errors.
		///
	catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, error.message);
		}
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
		'The `std_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `startDate` and `endDate` properties contain respectively the *start* and *end dates* for observations in the *current time span*. These dates will have the `YYYY`, `YYYYMM` or `YYYYMMDD` formats when referring respectively to *annual*, *monthly* and *daily data*.'
	)
	.summary('Get date range for the requested unit shape')
	.description(dd`
		This service will return the *start* and *end dates* of remote sensing data for the provided unit *shape key*.
	`);

///
// Get list of property identifiers for unit shape remote sensing data.
//
// Parameters:
// - `:key`: The key of the unit shape.
///
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
			    FILTER doc.GeometryID == ${key}
			    COLLECT resolution = doc.std_span
			    AGGREGATE terms = UNIQUE(doc.std_terms)
			RETURN {
			    std_span: resolution,
			    descriptors: UNIQUE(FLATTEN(terms))
			}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, error.message);
		}
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
		'The `std_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `descriptors` property contains the list of all observation *variables* that can be found in the *current time span*.\n' +
		'Forward the list of descriptors to the data dictionary to retrieve their metadata.'
	)
	.summary('Get list of descriptors for the requested unit shape grouped by time span')
	.description(dd`
		This service will return the *list of descriptors*, *grouped* by *observation time span*, that can be found for the *provided unit shape*.
	`);

/**
 * /
 * Get remote sensing data by GeometryID and time interval.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date
 * /
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
			    FILTER doc.GeometryID == ${key}
			    FILTER doc.std_date >= ${startDate}
			    FILTER doc.std_date <= ${endDate}
			    COLLECT resolution = doc.std_span
			    AGGREGATE terms = UNIQUE(doc.std_terms)
			RETURN {
			    std_span: resolution,
			    descriptors: UNIQUE(FLATTEN(terms))
			}
        `).toArray()
	}

		///
		// Handle errors.
		///
	catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, error.message);
		}
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
		'The `std_span` property represents the period, it can take the following values:\n' +
		'\n' +
		'- `std_date_span_day`: *Daily* data.\n' +
		'- `std_date_span_month`: *Monthly* data.\n' +
		'- `std_date_span_year`: *Yearly* data.\n' +
		'\n' +
		'The `descriptors` property contains the list of all observation *variables* that can be found in the *current time span*.\n' +
		'Forward the list of descriptors to the data dictionary to retrieve their metadata.'
	)
	.summary('Get list of descriptors for the requested unit shape and time period grouped by time span')
	.description(dd`
		This service will return the *list of descriptors*, *grouped* by *observation time span*, that can be found for the *provided unit shape* within the *provided time interval*.
	`);
