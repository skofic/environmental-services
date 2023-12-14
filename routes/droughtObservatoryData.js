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
const ModelDataArea = require('../models/doDataByArea')
const ModelDataAreaDescription =
	'Data by measurement bounding box.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `geometry_point_radius`: The radius of the observation area from the centroid.\n' +
	'- `geometry_point`: GeoJSON centroid of the observation area.\n' +
	'- `geometry_bounds`: The GeoJSON polygon describing the area from which the data was extracted.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers.\n' +
	'- `properties`: A set of records featuring the measurement date and observed variables for the current observation resolution.\n\n' +
	'There will be one record per measurement area.'
const ModelDataDate = require('../models/doDataByDate')
const ModelDataDateDescription =
	'Data by measurement date.\n\n' +
	'The returned data is structured as follows:\n\n' +
	'- `std_date`: Measurement date.\n' +
	'- `properties`: The set of measurements on that date.\n' +
	'- `std_dataset_ids`: List of featured dataset identifiers..\n\n' +
	'There will be one record per date.'
const ModelSelectionData = require('../models/doSelectionData')
const ModelSelectionDataDescription =
	'Data selection criteria by area.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property'
const ModelSelectionDate = require('../models/doSelectionDate')
const ModelSelectionDateDescription =
	'Data selection criteria by date.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n' +
	'- `paging`: Paging: provide offset and limit properties, or omit the property to return all available data.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property.\n' +
	'Note that if you filter variables you will be returned only those variable ' +
	'values and the results will omit the list of datasets.'

///
// Schemas.
///
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
router.tag('Drought Observatory Data')


/**
 * Get all drought related data by area.
 *
 * This service will return all drought data associated
 * with the provided coordinates, grouped by area.
 *
 * Use this service with care, since it might return a large amount of data.
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
		aql`SEARCH ANALYZER(GEO_INTERSECTS(click, item.geometry_bounds), "geojson")`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters.push(aql`AND item.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND item.std_date <= ${value}`)
				break

			case 'std_terms':
				filters.push(aql`AND ${value} ANY IN item.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN item.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters.push(aql`AND ${value} ANY IN item.geometry_point_radius`)
				break
		}
	}
	const filter = aql.join(filters)

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			LET click = GEO_POINT(${lon}, ${lat})
			FOR item IN VIEW_DROUGHT_OBSERVATORY
			    ${filter}
			      
			    SORT item.std_date ASC
			  
			    COLLECT radius = item.geometry_point_radius,
			            bounds = item.geometry_bounds,
			            point = item.geometry_point
			    AGGREGATE sets = UNIQUE(item.std_dataset_ids)
			    INTO groups
			
			RETURN {
			    geometry_point_radius: radius,
			    geometry_point: point,
			    geometry_bounds: bounds,
			    std_dataset_ids: UNIQUE(FLATTEN(sets)),
			    properties: (
			        FOR doc IN groups[*].item
			        RETURN MERGE_RECURSIVE(
			            { std_date: doc.std_date },
			            doc.properties
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

}, 'SelectDataByArea')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionData, ModelSelectionDataDescription)

	///
	// Summary.
	///
	.summary('Filter data grouped by measurement geometry')

	///
	// Response schema.
	///
	.response([ModelDataArea], ModelDataAreaDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the data covering the *provided* coordinates.
		The resulting data will be grouped by measurement bounding box.
		In the request body you can provide the selection criteria.
		*Note that there is no paging on the area sub-records, so use this service \
		to process or store the data, rather than using it for paging.*
	`);

/**
 * Get all drought related data by date.
 *
 * This service will return all drought data associated
 * with the provided coordinates, grouped by date.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 */
router.post('date/:lat/:lon', function (req, res)
{
	///
	// Parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Collect body parameters.
	///
	const terms = []
	const filters = [
		aql`SEARCH ANALYZER(GEO_INTERSECTS(click, item.geometry_bounds), "geojson")`
	]
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'std_date_start':
				filters.push(aql`AND item.std_date >= ${value}`)
				break

			case 'std_date_end':
				filters.push(aql`AND item.std_date <= ${value}`)
				break

			case 'std_terms':
				terms.push(...value)
				filters.push(aql`AND ${value} ANY IN item.std_terms`)
				break

			case 'std_dataset_ids':
				filters.push(aql`AND ${value} ANY IN item.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filters.push(aql`AND ${value} ANY IN item.geometry_point_radius`)
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
					 ? aql`KEEP(MERGE_RECURSIVE(groups[*].item.properties), ${terms})`
					 : aql`MERGE_RECURSIVE(groups[*].item.properties)`
	const datasets   = (terms.length > 0)
					 ? aql``
					 : aql`,std_dataset_ids: UNIQUE(FLATTEN(sets))`

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			LET click = GEO_POINT(${lon}, ${lat})
			FOR item IN VIEW_DROUGHT_OBSERVATORY
			    ${filter}
			      
			    SORT item.std_date ASC
			  
			    COLLECT date = item.std_date
			    AGGREGATE sets = UNIQUE(item.std_dataset_ids)
			    INTO groups
			    
			    ${paging}
			
			RETURN {
			    std_date: date,
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

}, 'SelectDataByDate')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Body parameters.
	///
	.body(ModelSelectionDate, ModelSelectionDateDescription)

	///
	// Summary.
	///
	.summary('Filter data grouped by date')

	///
	// Response schema.
	///
	.response([ModelDataDate], ModelDataDateDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the data covering the *provided* coordinates.
		The resulting data will be grouped by measurement bounding box.
		In the request body you can provide the selection criteria.
		*Note that there is no paging on the area sub-records, so use this service \
		to process or store the data, rather than using it for paging.*
	`);
