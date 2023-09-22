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
// Collections and models.
///
const collection_dat = db._collection('DroughtObservatory')
const collection_map = db._collection('DroughtObservatoryMap')
const ModelDataArea = require('../models/droughtObservatoryDataArea')
const ModelDataDate = require('../models/droughtObservatoryDataDate')
const ModelBodyDescriptors = require('../models/bodyDescriptors')
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')
const startDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The start date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const endDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The end date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const startLimitSchema = joi.number().required()
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const allAnySchema = joi.string().valid('ALL', 'ANY').required()
	.description("Select data featuring \`all\` or \`any\` of the provided descriptors.")
const ModelDataAreaDescription =
	'Drought data grouped by data source geometry.\n' +
	'\n' +
	'The returned data is grouped as follows:\n' +
	'\n' +
	'- `geometry`: The polygon describing the area from which the data was extracted.\n' +
	'- `geometry_point`: The coordinates of the area centroid.\n' +
	'- `geometry_point_radius`: The radius, in decimal degrees, of the data area.\n' +
	'- `properties`: The list of data measurements grouped by date.'
const ModelDataDateDescription =
	'Drought data grouped by date.\n' +
	'\n' +
	'The returned data is grouped as follows:\n' +
	'\n' +
	'- `std_date`: The date of the observed data in `YYYYMMDD` format.\n' +
	'- `properties`: The list of data measurements .'

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Drought Observatory Data')


/**
 * Get all drought related data by area.
 *
 * This service will return all drought data associated to the provided
 * coordinates, grouped by area.
 *
 * Use this service with care, since it might return a large amount of data.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get('all/area/:lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR shape IN ${collection_map}
			    FILTER GEO_INTERSECTS(
			        GEO_POINT(${lon}, ${lat}),
			        shape.geometry
			    )
			    
			    SORT shape.geometry_point_radius DESC
			
			RETURN {
			    geometry: shape.geometry,
			    geometry_point: shape.geometry_point,
			    geometry_point_radius: shape.geometry_point_radius,
			    properties: (
			        FOR data IN ${collection_dat}
			            FILTER data.geometry_hash == shape._key
			            SORT data.std_date ASC
			        RETURN MERGE_RECURSIVE(
			            { std_date: data.std_date },
			            data.properties
			        )
			    )
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

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelDataArea], ModelDataAreaDescription)

	///
	// Summary.
	///
	.summary('Get all drought data grouped by data source area')

	///
	// Description.
	///
	.description(dd`
		This service will return *all* drought data covering the *provided* coordinates.
		
The data will be grouped by the *data source area* sorted in descending order, meaning that \
larger resolution data will precede more precise resolution data. Within each group the \
observation data will be grouped by date in ascending order.

Use this service if you need information on the resolution of the data points.

Note that this service may return a large amount of data, so it might be advisable to first \
try the metadata services and limit the scope of the requested data.
	`);

/**
 * Get all drought related data by date.
 *
 * This service will return all drought data associated to the provided
 * coordinates, grouped by date.
 *
 * Use this service with care, since it might return a large amount of data.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get('all/date/:lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR shape IN ${collection_map}
			    FILTER GEO_INTERSECTS(
			        GEO_POINT(${lon}, ${lat}),
			        shape.geometry
			    )
			    
			    FOR data IN ${collection_dat}
			        FILTER data.geometry_hash == shape._key
			        SORT data.std_date ASC
			        COLLECT date = data.std_date
			        INTO items
			        KEEP data
			
			    RETURN {
			        std_date: date,
			        properties: MERGE_RECURSIVE(items[*].data.properties)
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

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelDataDate], ModelDataDateDescription)

	///
	// Summary.
	///
	.summary('Get all drought data grouped by date')

	///
	// Description.
	///
	.description(dd`
		This service will return *all* drought data covering the *provided* coordinates.
		
The data will be grouped by *date* sorted in ascending order. Each element \
holds the observation date and a \`properties\` object containing the data.
	`);

/**
 * Get drought related data by date range grouped by area.
 *
 * This service will return all drought data associated to the provided
 * coordinates and date range, grouped by observation area.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - ':startDate': The start date.
 * - `:endDate`: The end date.
 */
router.get('area/:lat/:lon/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR shape IN ${collection_map}
			    FILTER GEO_INTERSECTS(
			        GEO_POINT(${lon}, ${lat}),
			        shape.geometry
			    )
			    
			    SORT shape.geometry_point_radius DESC
			
			RETURN {
			    geometry: shape.geometry,
			    geometry_point: shape.geometry_point,
			    geometry_point_radius: shape.geometry_point_radius,
			    properties: (
			        FOR data IN ${collection_dat}
				        FILTER data.geometry_hash == shape._key AND
				               data.std_date >= ${startDate} AND
				               data.std_date <= ${endDate}
			            SORT data.std_date ASC
			        RETURN MERGE_RECURSIVE(
			            { std_date: data.std_date },
			            data.properties
			        )
			    )
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

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)

	///
	// Response schema.
	///
	.response([ModelDataDate], ModelDataDateDescription)

	///
	// Summary.
	///
	.summary('Get drought data in date range by area')

	///
	// Description.
	///
	.description(dd`
		This service will return  drought data covering the *provided* coordinates \
		and date range grouped by area.
		
The data will be grouped by *area* sorted in descending radius order. Each element \
holds the observation date and a \`properties\` object containing the data \
sorted by date in ascending order.
	`);

/**
 * Get drought related data by date range grouped by date.
 *
 * This service will return all drought data associated to the provided
 * coordinates and date range, grouped by observation date.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - ':startDate': The start date.
 * - `:endDate`: The end date.
 */
router.get('date/:lat/:lon/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR shape IN ${collection_map}
			    FILTER GEO_INTERSECTS(
			        GEO_POINT(${lon}, ${lat}),
			        shape.geometry
			    )
			    
			    FOR data IN ${collection_dat}
			        FILTER data.geometry_hash == shape._key AND
			               data.std_date >= ${startDate} AND
			               data.std_date <= ${endDate}
			        SORT data.std_date ASC
			        COLLECT date = data.std_date
			        INTO items
			        KEEP data
			
			    RETURN {
			        std_date: date,
			        properties: MERGE_RECURSIVE(items[*].data.properties)
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

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)

	///
	// Response schema.
	///
	.response([ModelDataDate], ModelDataDateDescription)

	///
	// Summary.
	///
	.summary('Get drought data in date range by date')

	///
	// Description.
	///
	.description(dd`
		This service will return  drought data covering the *provided* coordinates and date range.
		
The data will be grouped by *date* sorted in ascending order. Each element \
holds the observation date and a \`properties\` object containing the data.
	`);

/**
 * Get drought related data by date range and descriptors.
 *
 * This service will return all drought data associated to the provided
 * coordinates, date range and containing all or any of the provided descriptors.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - ':startDate': The start date.
 * - `:endDate`: The end date.
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 */
router.post('date/:lat/:lon/:startDate/:endDate/:which/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const which = req.pathParams.which.toLowerCase()
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const descriptors = req.body.std_terms

	///
	// Perform service.
	///
	let query;
	if(which.toLowerCase() === 'all') {
		query = aql`
			FOR shape IN ${collection_map}
			    FILTER GEO_INTERSECTS(
			        GEO_POINT(${lon}, ${lat}),
			        shape.geometry
			    )
			    
			    FOR data IN ${collection_dat}
			        FILTER data.geometry_hash == shape._key AND
			               data.std_date >= ${startDate} AND
			               data.std_date <= ${endDate} AND
			               ${descriptors} ALL IN data.std_terms
			        SORT data.std_date ASC
			        LIMIT ${start}, ${limit}
			        COLLECT date = data.std_date
			        INTO items
			        KEEP data
			
			    RETURN {
			        std_date: date,
			        properties: MERGE_RECURSIVE(items[*].data.properties)
			    }
		`
	} else {
		query = aql`
			FOR shape IN ${collection_map}
			    FILTER GEO_INTERSECTS(
			        GEO_POINT(${lon}, ${lat}),
			        shape.geometry
			    )
			    
			    FOR data IN ${collection_dat}
			        FILTER data.geometry_hash == shape._key AND
			               data.std_date >= ${startDate} AND
			               data.std_date <= ${endDate} AND
			               ${descriptors} ANY IN data.std_terms
			        SORT data.std_date ASC
			        LIMIT ${start}, ${limit}
			        COLLECT date = data.std_date
			        INTO items
			        KEEP data
			
			    RETURN {
			        std_date: date,
			        properties: MERGE_RECURSIVE(items[*].data.properties)
			    }
		`
	}

	///
	// Perform service.
	///
	try
	{
		///
		// Perform query.
		///
		res.send(
			db._query(query)
				.toArray()
		)
	}
	catch (error) {
		throw error;
	}

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)
	.pathParam('which', allAnySchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters.
	///
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")

	///
	// Response schema.
	///
	.response([ModelDataDate], ModelDataDateDescription)

	///
	// Summary.
	///
	.summary('Get drought data in date range and featuring selected descriptors')

	///
	// Description.
	///
	.description(dd`
		This service will return  drought data covering the *provided* coordinates, date range \
		and featuring *any* or *all* of the provided descriptors.
		
The data will be grouped by *date* sorted in ascending order. Each element \
holds the observation date and a \`properties\` object containing the data.
	`);
