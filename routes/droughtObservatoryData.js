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
const ModelSelectionData = require('../models/doSelectionData')
const ModelSelectionDataDescription =
	'Data selection criteria.\n\n' +
	'Fill property values, or omit the property to ignore selection.\n' +
	'The body is structured as follows:\n\n' +
	'- `std_date_start`: Date range start, included, omit to ignore start date.\n' +
	'- `std_date_end`: Date range end, included, omit to ignore end date\n' +
	'- `std_terms`: List of selected variables, omit to consider all variables.\n' +
	'- `std_dataset_ids`: List of dataset identifiers, omit to consider all datasets.\n' +
	'- `geometry_point_radius`: List of observation area radius, omit to consider all areas.\n\n' +
	'To set a selection criteria fill the value, to ignore it omit the property'

const ModelDataDate = require('../models/droughtObservatoryDataDate')
const ModelBodyDescriptors = require('../models/bodyDescriptors')
const ModelSelectionSummary = require("../models/doSelectionSummaryData");
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
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
router.post('area/:lat/:lon', function (req, res)
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
	.summary('Get all data grouped by measurement area')

	///
	// Response schema.
	///
	.response([ModelDataArea], ModelDataAreaDescription)

	///
	// Description.
	///
	.description(dd`
		This service will return the data covering the *provided* coordinates.
		The resulting data will be grouped by measurement area or bounding box.
		Provide in the body of the request the selection criteria.\n
		Note that there is no paging on the area sub-records, so use this service \
		to process or store the data, rather than using it for paging.
	`);
