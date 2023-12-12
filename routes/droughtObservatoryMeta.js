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
const ModelSummaryByDate = require('../models/summaryDataByDate')
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
const ModelSummaryByGeometry = require('../models/summaryDataByGeometry')
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
const ModelSummaryByDataset = require('../models/summaryDataByDataset')
const ModelSummaryByDatasetDescription =
	'Data summary by dataset.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `count`: Number of measurements.\n' +
	'- `std_date_start`: Date range start.\n' +
	'- `std_date_end`: Date range end.\n' +
	'- `std_terms`: List of featured variables.\n' +
	'- `std_dataset_id`: Dataset identifier.\n' +
	'- `geometry_point_radius`: The radius of the observation area from the centroid.\n' +
	'- `geometry_point`: GeoJSON centroid of the observation area.\n' +
	'- `geometry_bounds`: The GeoJSON polygon describing the area from which the data was extracted.\n'
const ModelSelectionSummary = require('../models/selectionSummaryData')
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

/*** ************** ***/
/** ALL DATA SUMMARY **/
/*** ************** ***/

/**
 * Get data summary for provided coordinates.
 *
 * This service will return the data summary for the provided coordinates.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get(':lat/:lon', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR probe IN VIEW_DROUGHT_OBSERVATORY
			    SEARCH ANALYZER(
			        GEO_INTERSECTS(
			            GEO_POINT(${lon}, ${lat}),
			            probe.geometry_bounds
			        ),
			        "geojson"
			    )
			    
			    COLLECT AGGREGATE start = MIN(probe.std_date),
			                      end   = MAX(probe.std_date),
			                      terms = UNIQUE(probe.std_terms),
			                      sets = UNIQUE(probe.std_dataset_ids),
			                      radius = UNIQUE(probe.geometry_point_radius),
			                      points = UNIQUE(probe.geometry_point),
			                      bounds = UNIQUE(probe.geometry_bounds),
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

}, 'GetForCoordinates')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelSummaryByDate], ModelSummaryByDateDescription)

	///
	// Summary.
	///
	.summary('Get data summary for provided coordinates.')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate.
		The summary data is not grouped.
		`);

/**
 * Get data summary for provided coordinates by area.
 *
 * This service will return the data summary associated with
 * the provided coordinates grouped by measurement resolution.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get('shape/:lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR probe IN VIEW_DROUGHT_OBSERVATORY
			    SEARCH ANALYZER(
			        GEO_INTERSECTS(
			            GEO_POINT(${lon}, ${lat}),
			            probe.geometry_bounds
			        ),
			        "geojson"
			    )
			
			    COLLECT bounds = probe.geometry_bounds,
			            points = probe.geometry_point,
			            radius = probe.geometry_point_radius
			
			    AGGREGATE start = MIN(probe.std_date),
			              end   = MAX(probe.std_date),
			              terms = UNIQUE(probe.std_terms),
			              sets = UNIQUE(probe.std_dataset_ids),
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
	res.send(result)

}, 'GetForCoordinatesByArea')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelSummaryByGeometry], ModelSummaryByGeometryDescription)

	///
	// Summary.
	///
	.summary('Get data summary for provided coordinates grouped by geometry area')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary data for all measurements \
		containing the provided coordinates.
		The results will be grouped by the bounding boxes \
		of the measurement areas.
	`)

/**
 * Get data summary for provided coordinates by dataset.
 *
 * This service will return the data summary associated with
 * the provided coordinates grouped by dataset.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.get('dataset/:lat/:lon', function (req, res)
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
			LET sets = REMOVE_VALUE(
			    UNIQUE(
			        FLATTEN(
			            (
			                FOR probe IN VIEW_DROUGHT_OBSERVATORY
			                    SEARCH ANALYZER(
			                        GEO_INTERSECTS(
			                            GEO_POINT(${lon}, ${lat}),
			                            probe.geometry_bounds
			                        ),
			                        "geojson"
			                    )
			                    COLLECT AGGREGATE sets = UNIQUE(probe.std_dataset_ids)
			                RETURN UNIQUE(FLATTEN(sets))
			            )
			        )
			    ),
			    null
			)
			
			FOR set IN sets
			RETURN (
			    FOR probe IN VIEW_DROUGHT_OBSERVATORY
			        SEARCH ANALYZER(
			            GEO_INTERSECTS(
			                GEO_POINT(${lon}, ${lat}),
			                probe.geometry_bounds
			            ),
			            "geojson"
			        ) AND
			        probe.std_dataset_ids == set
			    
			        COLLECT AGGREGATE start = MIN(probe.std_date),
			                          end   = MAX(probe.std_date),
			                          terms = UNIQUE(probe.std_terms),
			                          radius = UNIQUE(probe.geometry_point_radius),
			                          points = UNIQUE(probe.geometry_point),
			                          bounds = UNIQUE(probe.geometry_bounds),
			                          count = COUNT()
			
			        RETURN {
			            count: count,
			            std_date_start: start,
			            std_date_end: end,
			            std_terms: UNIQUE(FLATTEN(terms)),
			            std_dataset_id: set,
			            geometry_point_radius: UNIQUE(FLATTEN(radius)),
			            geometry_point: UNIQUE(FLATTEN(points)),
			            geometry_bounds: UNIQUE(FLATTEN(bounds))
			        }
			)
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

}, 'GetForCoordinatesByDataset')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelSummaryByDataset], ModelSummaryByDatasetDescription)

	///
	// Summary.
	///
	.summary('Get data summary for provided coordinates grouped by dataset')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary data for all measurements \
		containing the provided coordinates.
		The results will be grouped by dataset identifier.
	`)

/*** ******************* ***/
/** SELECTED DATA SUMMARY **/
/*** ******************* ***/

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
	// Collect body parameters.
	///
	const filters = [
		aql`SEARCH ANALYZER(GEO_INTERSECTS(GEO_POINT(${lon}, ${lat}), probe.geometry_bounds), "geojson")`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters.push(aql`AND probe.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND probe.std_date <= ${value}`)
				break

			case 'std_terms':
				filters.push(aql`AND ${value} ANY IN probe.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN probe.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters.push(aql`AND ${value} ANY IN probe.geometry_point_radius`)
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
			FOR probe IN VIEW_DROUGHT_OBSERVATORY
			    ${filter}
			    
			    COLLECT AGGREGATE start = MIN(probe.std_date),
			                      end   = MAX(probe.std_date),
			                      terms = UNIQUE(probe.std_terms),
			                      sets = UNIQUE(probe.std_dataset_ids),
			                      radius = UNIQUE(probe.geometry_point_radius),
			                      points = UNIQUE(probe.geometry_point),
			                      bounds = UNIQUE(probe.geometry_bounds),
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

}, 'SelectForCoordinates')

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
	.summary('Get data summary for provided coordinates and data filters')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data is not grouped.
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
	// Collect body parameters.
	///
	const filters = [
		aql`SEARCH ANALYZER(GEO_INTERSECTS(GEO_POINT(${lon}, ${lat}), probe.geometry_bounds), "geojson")`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters.push(aql`AND probe.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND probe.std_date <= ${value}`)
				break

			case 'std_terms':
				filters.push(aql`AND ${value} ANY IN probe.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN probe.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters.push(aql`AND ${value} ANY IN probe.geometry_point_radius`)
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
			FOR probe IN VIEW_DROUGHT_OBSERVATORY
			    ${filter}
			
			    COLLECT bounds = probe.geometry_bounds,
			            points = probe.geometry_point,
			            radius = probe.geometry_point_radius
			
			    AGGREGATE start = MIN(probe.std_date),
			              end   = MAX(probe.std_date),
			              terms = UNIQUE(probe.std_terms),
			              sets = UNIQUE(probe.std_dataset_ids),
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

}, 'SelectForCoordinatesByShape')

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
	.summary('Get data summary for provided coordinates and data filters by geometry area')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data will be grouped by observation bounding boxes.
	`);

/**
 * Get data summary for provided coordinates and data selection by dataset.
 *
 * This service will return the data summary for the
 * provided coordinates and the provided data filters
 * grouping the results by dataset identifiers.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post('dataset/:lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Collect body parameters.
	///
	const filters = [
		aql`SEARCH ANALYZER(GEO_INTERSECTS(GEO_POINT(${lon}, ${lat}), probe.geometry_bounds), "geojson")`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters.push(aql`AND probe.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND probe.std_date <= ${value}`)
				break

			case 'std_terms':
				filters.push(aql`AND ${value} ANY IN probe.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN probe.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters.push(aql`AND ${value} ANY IN probe.geometry_point_radius`)
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
			LET sets = REMOVE_VALUE(
			    UNIQUE(
			        FLATTEN(
			            (
			                FOR probe IN VIEW_DROUGHT_OBSERVATORY
			                    ${filter}
			                    COLLECT AGGREGATE sets = UNIQUE(probe.std_dataset_ids)
			                RETURN UNIQUE(FLATTEN(sets))
			            )
			        )
			    ),
			    null
			)
			
			FOR set IN sets
			RETURN (
			    FOR probe IN VIEW_DROUGHT_OBSERVATORY
			        ${filter} AND
			        probe.std_dataset_ids == set
			    
			        COLLECT AGGREGATE start = MIN(probe.std_date),
			                          end   = MAX(probe.std_date),
			                          terms = UNIQUE(probe.std_terms),
			                          radius = UNIQUE(probe.geometry_point_radius),
			                          points = UNIQUE(probe.geometry_point),
			                          bounds = UNIQUE(probe.geometry_bounds),
			                          count = COUNT()
			
			        RETURN {
			            count: count,
			            std_date_start: start,
			            std_date_end: end,
			            std_terms: UNIQUE(FLATTEN(terms)),
			            std_dataset_id: set,
			            geometry_point_radius: UNIQUE(FLATTEN(radius)),
			            geometry_point: UNIQUE(FLATTEN(points)),
			            geometry_bounds: UNIQUE(FLATTEN(bounds))
			        }
			)
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

}, 'SelectForCoordinatesByDataset')

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
	.summary('Get data summary for provided coordinates and data filters by dataset')

	///
	// Description.
	///
	.description(dd`
		This service will return the summary of all data measurements \
		available for the provided coordinate and data filters.
		The summary data will be grouped by dataset identifier.
	`);
