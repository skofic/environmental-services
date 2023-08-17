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
const keySchema = joi.string().required()
	.description('The key of the unit shape record')

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
*Use this service with caution: it may typically return around 5MB. of data*.
	`);
