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
// Collections and models.
///
const collection = db._collection('ShapeData')
const ModelData = require('../models/remoteSensingData')
const ModelBodySpan = require("../models/remoteSensingBodySpan")
const ModelBodyDescriptors = require("../models/remoteSensingBodyDescriptors")
const ModelBodySpanDescriptors = require("../models/remoteSensingBodySpanDescriptors")
const keySchema = joi.string().required()
	.description('Unit shape record identifier.\nThe value is the `_key` of the `Shapes` collection record.')
const startDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The start date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const endDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The end date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const ModelDataDescription =
	'Remote sensing data *combined* by *annual*, *monthly* and *daily* time frame.\n' +
	'\n' +
	'The `std_date_span` property represents the time span, it can take the following values:\n' +
	'\n' +
	'- `std_date_span_day`: *Daily* data.\n' +
	'- `std_date_span_month`: *Monthly* data.\n' +
	'- `std_date_span_year`: *Yearly* data.\n' +
	'\n' +
	'The `data` property contains the remote sensing data for that *time span* and for that *unit shape*.\n' +
	'\n' +
	'Each element in the array represents a *set of observations* performed on the *unit shape* in a *specific date*.\n' +
	'\n' +
	'This date is recorded in the `std_date` property and will be expressed as a *string* in the `YYYY` format for *annual* data, `YYYYMM` for *monthly* data and `YYYYMMDD` for *daily* data.'

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
 * Get all remote sensing data.
 *
 * This service will return all remote sensing data for the unit shape
 * grouped by daily, monthly and yearly time spans.
 *
 * Use this service with care, since it will return more than 5MB. of data.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 */
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
				FILTER doc.geometry_hash == ${key}
				SORT doc.std_date
				LET data = { std_date: doc.std_date, properties: doc.properties }
				COLLECT span = doc.std_date_span INTO groups KEEP data
			RETURN {
			    std_date_span: span,
			    std_date_series: groups[*].data
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
	.response([ModelData], ModelDataDescription)
	.summary('Get all remote sensing data for the provided unit shape grouped by time span')
	.description(dd`
		This service will return *all* remote sensing data related to the *provided* unit *shape key*.
		
The data will be grouped by *daily*, *monthly* and *annual* observations. Within these groups the data will be further subdivided by the *observation date*.

*Use this service with caution: it may typically return more than 5MB. of data*.
	`);

/**
 * Get remote sensing data by geometry_hash and date range.
 *
 * This service will return all observations of the provided unit shape
 * performed in the time interval defined by the provided start and end dates.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date
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
				FILTER doc.geometry_hash == ${key}
				FILTER doc.std_date >= ${startDate}
				FILTER doc.std_date <= ${endDate}
				SORT doc.std_date
				LET data = { std_date: doc.std_date, properties: doc.properties }
				COLLECT span = doc.std_date_span INTO groups KEEP data
			RETURN {
				std_date_span: span,
				std_date_series: groups[*].data
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
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data for the requested unit shape and date range grouped by time span')
	.description(dd`
		This service will return remote sensing data related to the provided unit *shape key* and the *time interval* expressed by the provided *start* and *end dates*.

The data will be grouped by *daily*, *monthly* and *annual* observations. Within these groups the data will be further subdivided by the *observation date*.

Since the data returned may be *annual*, *monthly* and *daily*, it is important how you express the *start* and *end* dates: if you want to get all *yearly*, *monthly* and *daily* data for the year \`2010\` you should set the *start date* to \`2010\` and the *end date* to \`20101231\`.
	`);

/**
 * Get remote sensing data by geometry_hash and time spans.
 *
 * This service will return all observations of the provided unit shape
 * for the provided time spans
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - body: The list of spans.
 */
router.post('span/:key', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key
	const spans = req.body;

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
FOR doc IN ${collection}
	FILTER doc.geometry_hash == ${key}
	FILTER doc.std_date_span IN ${spans.std_date_span}
	SORT doc.std_date
	LET data = { std_date: doc.std_date, properties: doc.properties }
	COLLECT span = doc.std_date_span INTO groups KEEP data
RETURN {
	std_date_span: span,
	std_date_series: groups[*].data
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
	.body(ModelBodySpan, "The list of requested time spans.\n" +
		"Provide one or more *time span codes*:\n" +
		"- \`std_date_span_day\`: *Daily* data.\n" +
		"- \`std_date_span_month\`: *Monthly* data.\n" +
		"- \`std_date_span_year\`: *Yearly* data.")
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data by unit shape and time spans grouped by time span')
	.description(dd`
  Retrieves remote sensing data for the provided *unit shape* and for the provided *time spans*.

Provide the *geometry ID* of the *unit shape* and one or more *time span codes*.

Note that this will return *all* data for the requested time spans, in case of daily data this may exceed 5MB.
`)

/**
 * Get remote sensing data by geometry_hash, start and end dates, and time spans.
 *
 * The service will return observations of the provided unit shape
 * for the time range defined by the provided start and end dates
 * and the requested time spans; the data will be grouped by time span.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 * - body: The list of spans.
 */
router.post('span/:key/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const spans = req.body;

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    FILTER doc.std_date_span IN ${spans.std_date_span}
			    FILTER doc.std_date >= ${startDate}
			    FILTER doc.std_date <= ${endDate}
			    SORT doc.std_date
			    LET data = { std_date: doc.std_date, properties: doc.properties }
			    COLLECT span = doc.std_date_span INTO groups KEEP data
			RETURN {
			    std_date_span: span,
			    std_date_series: groups[*].data
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
	.body(ModelBodySpan, "The list of requested time spans.\n" +
		"Provide one or more *time span codes*:\n" +
		"- \`std_date_span_day\`: *Daily* data.\n" +
		"- \`std_date_span_month\`: *Monthly* data.\n" +
		"- \`std_date_span_year\`: *Yearly* data.")
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data by unit shape, date range and time spans, grouped by time span')
	.description(dd`
  Retrieves remote sensing data for the provided *unit shape*, for the provided time interval, and for the provided *time spans*.

Provide the *geometry ID* of the *unit shape*, *start* and *end* dates, and one or more *time span codes*.
`)

/**
 * Get remote sensing data by geometry_hash and variable names.
 *
 * This service will return observations of the provided unit shape
 * where the provided observation variables are featured.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - body: The list of descriptors.
 */
router.post('terms/:key', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key
	const body = req.body;

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    FILTER ${body.std_terms} ANY IN doc.std_terms
			    SORT doc.std_date
			    LET data = { std_date: doc.std_date, properties: KEEP(doc.properties, ${body.std_terms}) }
			    COLLECT span = doc.std_date_span INTO groups KEEP data
			RETURN {
			    std_date_span: span,
			    std_date_series: groups[*].data
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
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data by unit shape and observation variables, grouped by time span')
	.description(dd`
  Retrieves remote sensing data for the provided *unit shape* and for the provided *list of ovservation variables*.

Provide the *geometry ID* of the *unit shape* and one or more *observation variable names*, the returned data will only feature the provided variables, if found.

Note that requesting variables featured in *daily observations* may target large amounts of data.
`)

/**
 * Get remote sensing data by geometry_hash, date range and variable names.
 *
 * This service will return observations of the provided unit shape
 * where the provided observation variables are featured in observations
 * spanning the time range between the provided start and end dates.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 * - body: The list of descriptors.
 */
router.post('terms/:key/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const body = req.body;

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    FILTER ${body.std_terms} ANY IN doc.std_terms
			    FILTER doc.std_date >= ${startDate}
			    FILTER doc.std_date <= ${endDate}
			    SORT doc.std_date
			    LET data = { std_date: doc.std_date, properties: KEEP(doc.properties, ${body.std_terms}) }
			    COLLECT span = doc.std_date_span INTO groups KEEP data
			RETURN {
			    std_date_span: span,
			    std_date_series: groups[*].data
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
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data by unit shape, date range and observation variables, grouped by time span')
	.description(dd`
  Retrieves remote sensing data for the provided *unit shape*, for the provided *date range* and for the provided *list of observation variables*.

Provide the *geometry ID* of the *unit shape*, the *start* and *end* dates of the *requested time period* and one or more *observation variable names*.

The returned data will only feature the provided variables, if found.
`)

/**
 * Get remote sensing data by geometry_hash, date range, spans and variable names.
 *
 * This service will return remote sensing data related to the provided unit shape,
 * the data
 *
 * This service will return remote sensing data for the provided unit shape
 * where the provided observation variables are featured in observations,
 * where the time range lies between the provided start and end dates,
 * where the time span is among the provided daily, monthly and annual time spans,
 * the resulting data will be grouped by time span.
 *
 * Parameters:
 * - `:key`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 * - body.std_date_span: The list of spans.
 * - body.std_terms: The list of descriptors.
 */
router.post('span/terms/:key/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const key = req.pathParams.key
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const spans = req.body.std_date_span
	const terms = req.body.std_terms

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.geometry_hash == ${key}
			    FILTER doc.std_date_span IN ${spans}
			    FILTER ${terms} ANY IN doc.std_terms
			    FILTER doc.std_date >= ${startDate}
			    FILTER doc.std_date <= ${endDate}
			    SORT doc.std_date
			    LET data = { std_date: doc.std_date, properties: KEEP(doc.properties, ${terms}) }
			    COLLECT span = doc.std_date_span INTO groups KEEP data
			RETURN {
			    std_date_span: span,
			    std_date_series: groups[*].data
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
	.body(ModelBodySpanDescriptors, "The list of requested *observation variable names* and the list of *requested time spans*.")
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data by unit shape, date range, time spans and observation variables, grouped by time span')
	.description(dd`
  Retrieves remote sensing data for the provided *unit shape*, for the provided *date range*, for the provided *time spans* and for the provided *list of observation variables*.

Provide the *geometry ID* of the *unit shape*, the *start* and *end* dates of the *requested time period*, one or more *time span codes* and one or more *observation variable names*.

The returned data will only feature the provided variables and time spans, if found.
`)
