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
const ModelDateData = require('../models/rsDataByDate')
const ModelDateDataDescription =
	'Time span data by date.\n\n' +
	'The returned data belongs to a specific time span and is grouped by date. ' +
	'This is the data structure:\n\n' +
	'- `std_date`: Measurement date.\n' +
	'- `properties`: List of observed variables.\n' +
	'- `std_dataset_ids`: List of datasets in measurements.\n\n' +
	'There will be one record per date.'
const ModelSpanData = require('../models/rsDataBySpan')
const ModelSpanDataDescription =
	'Full data by time span.\n\n' +
	'The returned data is grouped by time span and within the span it is ' +
	'grouped by date. This is the data structure:\n\n' +
	'- `std_date_span`: Data measurements time span.\n' +
	'- `std_date_series`: The list of measurements in the current time span.\n' +
	'- `std_date`: Measurement date.\n' +
	'- `properties`: List of variables measured in that date.\n' +
	'- `std_dataset_ids`: List of datasets in measurements.\n\n' +
	'There will be one record per time span.'
const ModelSelectionData = require('../models/rsSelectionData')
const ModelSelectionDataDescription =
	'Data selection criteris.\n\n' +
	'The selection data is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `paging`: Paging: provide offset and limit properties, or omit the property to return all available data.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property.\n' +
	'Note that if you filter variables you will be returned only those variable ' +
	'values and the results will omit the list of datasets.'
const spanSchema = joi.string()
	.valid('std_date_span_day', 'std_date_span_month', 'std_date_span_year')
	.required()
	.description(
		'Time span selection.\n' +
		'Provide the time span for which you want the data.'
	)
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
 * Get all remote sensing data for shape.
 *
 * This service will return all remote sensing data for the provided shape,
 * the result data will be grouped by time span.
 *
 * Use this service with care, since it could return a very large amount of data.
 *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 */
router.get(':shape', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.shape

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
				SEARCH doc.geometry_hash == ${shape}
				
				SORT doc.std_date ASC
				
				LET data = {
					std_date: doc.std_date,
					properties: doc.properties,
					std_dataset_ids: doc.std_dataset_ids
				}
				
				COLLECT span = doc.std_date_span
				INTO groups
				KEEP data
				
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

}, 'getAllDataBySpan')

	///
	// Path parameter schemas.
	///
	.pathParam('shape', geometrySchema)

	///
	// Summary.
	///
	.summary('Get all data for the provided shape grouped by time span')

	///
	// Response schema.
	///
	.response([ModelSpanData], ModelSpanDataDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return *all* remote sensing data related to \
		the *provided* unit *shape geometry hash*. There will be one \
		record per time span and within this record there will be all \
		observations performed on the *unit shape* in that time span.
		Be aware that this service may return large amounts of data, \
		so use first the metadata services to collect the data summary \
		and use the other service to filter the data you are interested in.
	`);

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
router.post(':shape/:span', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.shape
	const span = req.pathParams.span

	///
	// Collect body parameters.
	///
	const terms = []
	const filters = [
		aql`SEARCH doc.geometry_hash == ${shape} AND doc.std_date_span == ${span}`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters.push(aql`AND doc.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND doc.std_date <= ${value}`)
				break

			case 'std_terms':
				terms.push(...value)
				filters.push(aql`AND ${value} ANY IN doc.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN doc.std_dataset_ids`)
				break
		}
	}
	const filter = aql.join(filters)

	///
	// Collect paging parameters.
	///
	const paging = (req.body.hasOwnProperty('paging'))
				 ? aql`LIMIT ${req.body.paging.offset}, ${req.body.paging.limit}`
				 : aql``

	///
	// Handle descriptors selection.
	///
	const properties = (terms.length > 0)
		? aql`KEEP(doc.properties, ${terms})`
		: aql`doc.properties`
	const datasets   = (terms.length > 0)
		? aql``
		: aql`,std_dataset_ids: doc.std_dataset_ids`

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
				${filter}
				
				SORT doc.std_date ASC
				${paging}
			
			RETURN {
			    std_date: doc.std_date,
			    properties: ${properties}
			    ${datasets}
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

}, 'GetDataBySpan')

	///
	// Path parameter schemas.
	///
	.pathParam('shape', geometrySchema)
	.pathParam('span', spanSchema)

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
	.response([ModelDateData], ModelDateDataDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return *all* remote sensing data related to \
		the *provided* unit *shape geometry hash*, *time span* and \
		*selection criteria*. There will be one record per date.
	`)
