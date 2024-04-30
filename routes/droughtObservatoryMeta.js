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
// Models.
///
const ModelSummaryByDate = require('../models/doSummaryDataByDate')
const ModelSummaryByDateDescription =
	'Data summary by date.\n\n' +
	'The returned data is grouped as follows:\n\n' +
	'- `count`: Number of measurements.\n' +
	'- `std_date_start`: Date range start.\n' +
	'- `std_date_end`: Date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n' +
	'- `geometry_point_radius`: List of observation area radius.\n' +
	'- `geometry_point`: List of observation area GeoJSON centroids.\n' +
	'- `geometry_bounds`: List of observation area  GeoJSON polygons.\n'
const ModelSummaryByGeometry = require('../models/doSummaryDataByGeometry')
const ModelSummaryByGeometryDescription =
	'Data summary by measurement bounding box.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `count`: Number of measurements.\n' +
	'- `std_date_start`: Date range start.\n' +
	'- `std_date_end`: Date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n' +
	'- `geometry_point_radius`: The radius of the observation area from the centroid.\n' +
	'- `geometry_point`: GeoJSON centroid of the observation area.\n' +
	'- `geometry_bounds`: The GeoJSON polygon describing the area from which the data was extracted.\n'
const ModelSelectionSummary = require('../models/doSelectionSummaryData')
const ModelSelectionSummaryDescription =
	'Summary data selection.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n'
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')

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
 * Get data summary for provided coordinates and data selection.
 *
 * This service will return the data summary for the
 * provided coordinates and the provided data filters.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post(':lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Filters.
	///
	let filters_shape = [
		aql`FILTER GEO_INTERSECTS(click, shape.geometry)`
	]
	let filters_data = [
		aql`FILTER data.geometry_hash == shape._key`
	]

	///
	// Collect body parameters.
	///
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters_data.push(aql`FILTER data.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters_data.push(aql`FILTER data.std_date <= ${value}`)
				break

			case 'std_terms':
				filters_data.push(aql`FILTER ${value} ANY IN data.std_terms`)
				break

			case 'std_dataset_ids':
				filters_data.push(aql`FILTER ${value} ANY IN data.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters_shape.push(aql`FILTER shape.geometry_point_radius IN ${value}`)
				break
		}
	}

	///
	// Aggregate filters.
	///
	const filter_shape = aql.join(filters_shape)
	const filter_data = aql.join(filters_data)

	///
	// Perform service.
	///
	let result
	const query = aql`
			LET click = GEO_POINT(${lon}, ${lat})
			FOR shape IN DroughtObservatoryMap
			    ${filter_shape}
			    
			    FOR data IN DroughtObservatory
					${filter_data}
			    
				    COLLECT AGGREGATE start = MIN(data.std_date),
				                      end   = MAX(data.std_date),
				                      terms = UNIQUE(data.std_terms),
				                      sets = UNIQUE(data.std_dataset_ids),
				                      radius = UNIQUE(data.geometry_point_radius),
				                      points = UNIQUE(shape.geometry_point),
				                      bounds = UNIQUE(data.geometry_bounds),
				                      count = COUNT()
				                      
				    RETURN {
				        count: count,
				        std_date_start: start,
				        std_date_end: end,
				        std_terms: UNIQUE(FLATTEN(terms)),
				        std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null),
				        geometry_point_radius: UNIQUE(FLATTEN(radius)),
				        geometry_point: UNIQUE(FLATTEN(points)),
				        geometry_bounds: UNIQUE(FLATTEN(bounds))
				    }
		`
	try {
		result = db._query(query).toArray()
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

}, 'SummaryForCoordinates')

	///
	// Path parameters schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionSummary, ModelSelectionSummaryDescription)

	///
	// Response schema.
	///
	.response([ModelSummaryByDate], ModelSummaryByDateDescription)

	///
	// Summary.
	///
	.summary('Filter data summary for provided coordinates')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data will not grouped.
	`);

/**
 * Get data summary for provided coordinates and data selection by area.
 *
 * This service will return the data summary for the
 * provided coordinates and the provided data filters
 * grouping the results by observation bounding boxes.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post('shape/:lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Filters.
	///
	let filters_shape = [
		aql`FILTER GEO_INTERSECTS(click, shape.geometry)`
	]
	let filters_data = [
		aql`FILTER data.geometry_hash == shape._key`
	]

	///
	// Collect body parameters.
	///
	const filters = [
		aql`SEARCH ANALYZER(GEO_INTERSECTS(GEO_POINT(${lon}, ${lat}), probe.geometry_bounds), "geojson")`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters_data.push(aql`FILTER data.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters_data.push(aql`FILTER data.std_date <= ${value}`)
				break

			case 'std_terms':
				filters_data.push(aql`FILTER ${value} ANY IN data.std_terms`)
				break

			case 'std_dataset_ids':
				filters_data.push(aql`FILTER ${value} ANY IN data.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters_shape.push(aql`FILTER shape.geometry_point_radius IN ${value}`)
				break
		}
	}

	///
	// Aggregate filters.
	///
	const filter_shape = aql.join(filters_shape)
	const filter_data = aql.join(filters_data)

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			LET click = GEO_POINT(${lon}, ${lat})
			FOR shape IN DroughtObservatoryMap
				${filter_shape}
				
				FOR data IN DroughtObservatory
					${filter_data}
			
				    COLLECT bounds = shape.geometry,
				            points = shape.geometry_point,
				            radius = shape.geometry_point_radius
				
				    AGGREGATE start = MIN(data.std_date),
				              end   = MAX(data.std_date),
				              terms = UNIQUE(data.std_terms),
				              sets = UNIQUE(data.std_dataset_ids),
				              count = COUNT()
				
				    RETURN {
				        count: count,
				        std_date_start: start,
				        std_date_end: end,
				        std_terms: UNIQUE(FLATTEN(terms)),
				        std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null),
						geometry_point_radius: radius,
						geometry_point: points,
				        geometry_bounds: bounds
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

}, 'SummaryForCoordinatesByArea')

	///
	// Path parameters schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionSummary, ModelSelectionSummaryDescription)

	///
	// Response schema.
	///
	.response([ModelSummaryByGeometry], ModelSummaryByGeometryDescription)

	///
	// Summary.
	///
	.summary('Filter data summary for provided coordinates by measurement area')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data will be grouped by observation resolution.
	`);
