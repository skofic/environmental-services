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
// Collections.
///
const collection_dat = db._collection('DroughtObservatory')
const collection_map = db._collection('DroughtObservatoryMap')

///
// Models.
///
const ModelDateRangeTerms = require('../models/dateRangeTerms')
const ModelDateRangeTermsDescription =
	'Drought metadata.\n\n' +
	'The returned data is grouped as follows:\n\n' +
	'- `count`: Number of data points or dates.\n' +
	'- `std_date_start`: The start date for the observations date range.\n' +
	'- `std_date_end`: The end date for the observations date range.\n' +
	'- `std_terms`: The list of available variables in the date range.'
const ModelGeometryCounts = require('../models/geometryDateRangeTerms')
const ModelGeometryCountsDescription =
	'Drought observation counts.\n\n' +
	'The returned data is grouped as follows:\n\n' +
	'- `geometry`: The GeoJSON polygon describing the area from which the data was extracted.\n' +
	'- `geometry_point`: GeoJSON centroid of the observation area.\n' +
	'- `geometry_point_radius`: The radius of the observation area from the centroid.\n' +
	'- `count`: Number of data points or dates.\n' +
	'- `std_date_start`: The start date for the observations date range.\n' +
	'- `std_date_end`: The end date for the observations date range.\n' +
	'- `std_terms`: The list of available variables in the date range.'
const ModelBodyDescriptors = require("../models/bodyDescriptors");
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
const startDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The start date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const endDateSchema = joi.string().regex(/^[0-9]+$/).required()
	.description('The end date expressed as a string in `YYYYMMDD`, `YYYYMM` or `YYYY` format.')
const allAnySchema = joi.string().valid('ALL', 'ANY').required()
	.description("Select data featuring \`all\` or \`any\` of the provided descriptors.")

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Drought Observatory Metadata')


/**
 * Get metadata for provided coordinates.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get(':lat/:lon', function (req, res)
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
			        
			        COLLECT AGGREGATE start = MIN(data.std_date),
			                          end   = MAX(data.std_date),
			                          terms = UNIQUE(data.std_terms),
			                          count = COUNT()
			
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
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
	if(result.length > 0) {
		if(result[0].std_terms.length > 0) {
			res.send(result)
		} else {
			res.send([])
		}
	} else {
		res.send([])
	}

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelDateRangeTerms], ModelDateRangeTermsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate.
		`);

/**
 * Get metadata for provided coordinates and date range.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate and date range.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - ':startDate': The start date.
 * - `:endDate`: The end date.
 */
router.get(':lat/:lon/:startDate/:endDate', function (req, res)
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
				           
			        COLLECT AGGREGATE start = MIN(data.std_date),
			                          end   = MAX(data.std_date),
			                          terms = UNIQUE(data.std_terms),
			                          count = COUNT()
			
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
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
	if(result.length > 0) {
		if(result[0].std_terms.length > 0) {
			res.send(result)
		} else {
			res.send([])
		}
	} else {
		res.send([])
	}

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelDateRangeTerms], ModelDateRangeTermsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate and date range')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate for the provided date range.
		`);

/**
 * Get dates range and variable names for provided coordinates and variables selection.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate for the provided variables selection.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 */
router.post(':lat/:lon/:which', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const which = req.pathParams.which.toLowerCase()

	///
	// Body parameters.
	///
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
			               ${descriptors} ALL IN data.std_terms
			               
			        COLLECT AGGREGATE start = MIN(data.std_date),
			                          end   = MAX(data.std_date),
			                          terms = UNIQUE(data.std_terms),
			                          count = COUNT()
			
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
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
			               ${descriptors} ANY IN data.std_terms
			               
			        COLLECT AGGREGATE start = MIN(data.std_date),
			                          end   = MAX(data.std_date),
			                          terms = FLATTEN(data.std_terms),
			                          count = COUNT()
			
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
			    }
		`
	}

	///
	// Perform service.
	///
	let result
	try
	{
		///
		// Perform query.
		///
		result = db._query(query).toArray()
	}
	catch (error) {
		throw error;
	}

	///
	// Return response.
	///
	if(result.length > 0) {
		if(result[0].std_terms.length > 0) {
			res.send(result)
		} else {
			res.send([])
		}
	} else {
		res.send([])
	}

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)
	.pathParam('which', allAnySchema)

	///
	// Body parameters.
	///
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")

	///
	// Response schema.
	///
	.response([ModelDateRangeTerms], ModelDateRangeTermsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate and variables selection')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate for the provided variables selection.
		`);

/**
 * Get dates range and variable names for provided coordinate, date range and variables.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate for the provided dates range
 * featuring the provided variables selection.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - ':startDate': The start date.
 * - `:endDate`: The end date.
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 */
router.post(':lat/:lon/:startDate/:endDate/:which', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const which = req.pathParams.which.toLowerCase()

	///
	// Body parameters.
	///
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
			               
			        COLLECT AGGREGATE start = MIN(data.std_date),
			                          end   = MAX(data.std_date),
			                          terms = UNIQUE(data.std_terms),
			                          count = COUNT()
			
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
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
			               
			        COLLECT AGGREGATE start = MIN(data.std_date),
			                          end   = MAX(data.std_date),
			                          terms = UNIQUE(data.std_terms),
			                          count = COUNT()
			
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
			    }
		`
	}

	///
	// Perform service.
	///
	let result
	try
	{
		///
		// Perform query.
		///
		result = db._query(query).toArray()
	}
	catch (error) {
		throw error;
	}

	///
	// Return response.
	///
	if(result.length > 0) {
		if(result[0].std_terms.length > 0) {
			res.send(result)
		} else {
			res.send([])
		}
	} else {
		res.send([])
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

	///
	// Body parameters.
	///
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")

	///
	// Response schema.
	///
	.response([ModelDateRangeTerms], ModelDateRangeTermsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate, date range and variables selection')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate in the provided date range \
		for the variables selection.
		`);

/**
 * Get metadata for provided coordinates by area.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate grouped by area.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get('area/:lat/:lon', function (req, res)
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
			        
			        COLLECT geo = shape.geometry,
			                point = shape.geometry_point,
			                radius = shape.geometry_point_radius
			        
			        AGGREGATE start = MIN(data.std_date),
			                  end   = MAX(data.std_date),
			                  terms = UNIQUE(data.std_terms),
			                  count = COUNT()
			
			    RETURN {
			        geometry: geo,
					geometry_point: point,
					geometry_point_radius: radius,
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
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
	res.send(result)

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelGeometryCounts], ModelGeometryCountsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate by area')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate by area.
		`);

/**
 * Get metadata for provided coordinates and date range by area.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate and date range grouped by area.
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
			    
			    FOR data IN ${collection_dat}
			        FILTER data.geometry_hash == shape._key AND
				           data.std_date >= ${startDate} AND
				           data.std_date <= ${endDate}
			        
			        COLLECT geo = shape.geometry,
			                point = shape.geometry_point,
			                radius = shape.geometry_point_radius
			        
			        AGGREGATE start = MIN(data.std_date),
			                  end   = MAX(data.std_date),
			                  terms = UNIQUE(data.std_terms),
			                  count = COUNT()
			
			    RETURN {
			        geometry: geo,
					geometry_point: point,
					geometry_point_radius: radius,
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
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
	res.send(result)

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelGeometryCounts], ModelGeometryCountsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate and date range grouped by area')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate for the provided date range \
		grouped by observation area.
		`);

/**
 * Get dates range and variable names for provided coordinates and variables selection,
 * grouped by observation area.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate for the provided variables selection,
 * grouped by observation area.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 */
router.post('area/:lat/:lon/:which', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const which = req.pathParams.which.toLowerCase()

	///
	// Body parameters.
	///
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
			               ${descriptors} ALL IN data.std_terms
			        
			        COLLECT geo = shape.geometry,
			                point = shape.geometry_point,
			                radius = shape.geometry_point_radius
			        
			        AGGREGATE start = MIN(data.std_date),
			                  end   = MAX(data.std_date),
			                  terms = UNIQUE(data.std_terms),
			                  count = COUNT()
			
			    RETURN {
			        geometry: geo,
					geometry_point: point,
					geometry_point_radius: radius,
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
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
			               ${descriptors} ANY IN data.std_terms
			        
			        COLLECT geo = shape.geometry,
			                point = shape.geometry_point,
			                radius = shape.geometry_point_radius
			        
			        AGGREGATE start = MIN(data.std_date),
			                  end   = MAX(data.std_date),
			                  terms = UNIQUE(data.std_terms),
			                  count = COUNT()
			
			    RETURN {
			        geometry: geo,
					geometry_point: point,
					geometry_point_radius: radius,
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
			    }
		`
	}

	///
	// Perform service.
	///
	let result
	try
	{
		///
		// Perform query.
		///
		result = db._query(query).toArray()
	}
	catch (error) {
		throw error;
	}

	///
	// Return response.
	///
	res.send(result)

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)
	.pathParam('which', allAnySchema)

	///
	// Body parameters.
	///
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")

	///
	// Response schema.
	///
	.response([ModelGeometryCounts], ModelGeometryCountsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate and variables selection by area')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate for the provided variables selection, \
		grouped by observation area.
		`);

/**
 * Get dates range and variable names for provided coordinate, date range and variables,
 * grouped by area.
 *
 * This service will return the dates range and list of variable names
 * associated with the provided coordinate for the provided dates range
 * featuring the provided variables selection, grouped by observation area.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 * - ':startDate': The start date.
 * - `:endDate`: The end date.
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 */
router.post('area/:lat/:lon/:startDate/:endDate/:which', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const which = req.pathParams.which.toLowerCase()

	///
	// Body parameters.
	///
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
			        
			        COLLECT geo = shape.geometry,
			                point = shape.geometry_point,
			                radius = shape.geometry_point_radius
			        
			        AGGREGATE start = MIN(data.std_date),
			                  end   = MAX(data.std_date),
			                  terms = UNIQUE(data.std_terms),
			                  count = COUNT()
			
			    RETURN {
			        geometry: geo,
					geometry_point: point,
					geometry_point_radius: radius,
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
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
			        
			        COLLECT geo = shape.geometry,
			                point = shape.geometry_point,
			                radius = shape.geometry_point_radius
			        
			        AGGREGATE start = MIN(data.std_date),
			                  end   = MAX(data.std_date),
			                  terms = UNIQUE(data.std_terms),
			                  count = COUNT()
			
			    RETURN {
			        geometry: geo,
					geometry_point: point,
					geometry_point_radius: radius,
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms))
			    }
		`
	}

	///
	// Perform service.
	///
	let result
	try
	{
		///
		// Perform query.
		///
		result = db._query(query).toArray()
	}
	catch (error) {
		throw error;
	}

	///
	// Return response.
	///
		res.send(result)

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)
	.pathParam('which', allAnySchema)

	///
	// Body parameters.
	///
	.body(ModelBodyDescriptors, "The list of requested *observation variable names*.")

	///
	// Response schema.
	///
	.response([ModelGeometryCounts], ModelGeometryCountsDescription)

	///
	// Summary.
	///
	.summary('Get drought metadata for provided coordinate, date range and variables selection by area')

	///
	// Description.
	///
	.description(dd`
		This service will return the dates range and list of variables \
		associated with the provided coordinate in the provided date range \
		for the variables selection, grouped by observation area.
		`);
