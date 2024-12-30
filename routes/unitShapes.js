'use strict'

/**
 * unitShapes.js
 *
 * This script contains the routes for the Genetic Conservation Unit Shapes data services.
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
const collection = db._collection(module.context.configuration.collectionShapes)
const ModelData = require('../models/rsShapeData')
const ModelDataDescription =
	'GCU shape record.\n\n' +
	'The returned data represents a single GCU shape. ' +
	'This is the data structure:\n\n' +
	'- `geometry_hash`: GeoJSON hash of the shape.\n' +
	'- `std_dataset_ids`: List of datasets in measurements.\n' +
	'- `properties`: List of static environmental variables.\n' +
	'- `geometry`: GeoJSON geometry of the shape.\n' +
	'- `geometry_bounds`: GeoJSON bounding box of the shape.\n\n' +
	'There will be one record per shape.'
const ModelDataClick = require('../models/rsShapeDataClick')
const ModelDataClickDescription =
	'GCU shape record.\n\n' +
	'The returned data represents a single GCU shape. ' +
	'This is the data structure:\n\n' +
	'- `geometry_hash`: GeoJSON hash of the shape.\n' +
	'- `std_dataset_ids`: List of datasets in measurements.\n' +
	'- `properties`: List of static environmental variables.\n' +
	'- `distance`: Distance in meters if searching by distance.\n' +
	'- `geometry`: GeoJSON geometry of the shape.\n' +
	'- `geometry_bounds`: GeoJSON bounding box of the shape.\n\n' +
	'There will be one record per shape.'
const ModelSelection = require('../models/rsSelectionShape')
const ModelSelectionDescription =
	'Shape selection criteria.\n\n' +
	'The selection data is structured as follows:\n\n' +
	'- `geometry_hash_list`: List of shape geometry hashes.\n' +
	'- `std_dataset_ids`: List of dataset identifiers.\n' +
	'- `geo_shape_area`: Shape area range, limits included.\n' +
	'- `chr_AvElevation`: Shape average elevation range, limits included.\n' +
	'- `chr_StdElevation`: Shape average elevation standard deviation range, limits included.\n' +
	'- `chr_AvSlope`: Shape average slope range, limits included.\n' +
	'- `chr_AvAspect`: Shape average area range, limits included.\n' +
	'- `intersects`: GeoJSON geometry that intersects shape.\n' +
	'- `distance`: Provide the GeoJSON shape in *reference* and the distance range in *range*.\n' +
	'- `paging`: Paging: provide offset and limit properties, or omit the property to return all available data.\n\n' +
	'When filling the search criteria either provide a value or omit the corresponding property.\n' +
	'Range values are included in the expected range, it is also possible to omit one of the terms.\n' +
	'Distance and elevation ranges are expected to be expressed in meters.'
const geometryHashSchema = joi.string()
	.regex(/^[0-9a-f]{32}$/)
	.required()
	.description(
		'Unit shape geometry hash.\n' +
		'The value is the `_key` of the `Shapes` collection record.'
	)
const latSchema = joi.number()
	.min(-90)
	.max(90)
	.required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number()
	.min(-90)
	.max(90)
	.required()
	.description('Coordinate decimal longitude.')

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Unit Shapes')


/**
 * Return the shape record associated with the provided geometry hash.
 *
 * This service will return the shape record identified by the provided geometry hash.
 *
 * Parameters:
 * - `:hash`: The shape geometry hash.
 */
router.get(function (req, res)
{
	///
	// Parameters.
	///
	const hash = req.queryParams.geometry_hash

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc._key == ${hash}
			RETURN {
			    geometry_hash: doc._key,
			    std_dataset_ids: doc.std_dataset_ids,
			    properties: doc.properties,
			    geometry: doc.geometry,
			    geometry_bounds: doc.geometry_bounds
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

}, 'GetShape')

	///
	// Path parameter schemas.
	///
	.queryParam('geometry_hash', geometryHashSchema)

	///
	// Summary.
	///
	.summary('Get shape by geometry hash')

	///
	// Response schema.
	///
	.response([ModelData], ModelDataDescription)

	///
	// Description.
	///
	.description(dd`
		The service will return the *shape record* identified by \
		the provided *geometry hash*.
	`);

/**
 * Return the shape bounds that intersects the provided point.
 *
 * This service will return the shape record
 * whose bounds intersect the provided coordinate.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 **/
router.get('click', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.queryParams.lat
	const lon = req.queryParams.lon

	///
	// Build query.
	//
	const query = aql`
		LET point = GEO_POINT(${lon}, ${lat})
		FOR doc IN VIEW_SHAPE
			SEARCH ANALYZER(
				GEO_INTERSECTS(point, doc.geometry),
				"geojson"
			)
		RETURN {
		    geometry_hash: doc._key,
		    std_dataset_ids: doc.std_dataset_ids,
		    properties: doc.properties,
		    geometry_point: point,
		    geometry: doc.geometry,
		    geometry_bounds: doc.geometry_bounds
		}
	`

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

}, 'GetClick')

	///
	// Path parameter schemas.
	///
	.queryParam('lat', latSchema)
	.queryParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelDataClick], ModelDataClickDescription)

	///
	// Summary.
	///
	.summary('Get shape record that intersects the provided point')

	///
	// Description.
	///
	.description(dd`
		The service will return the shape record whose shape intersects the provided point.
	`)

/**
 * Select shapes using search criteria.
 *
 * This service will return all shape records satisfying the search criteria.
 **/
router.post('search', function (req, res)
{
	///
	// Set variables.
	///
	let dist = null

	///
	// Collect body parameters.
	///
	const filters = []
	for(const [key, value] of Object.entries(req.body)) {
		switch(key) {
			case 'geometry_hash_list':
				filters.push(aql`doc._key IN ${value}`)
				break

			case 'std_dataset_ids':
				filters.push(aql`${value} ANY IN doc.std_dataset_ids`)
				break

			case 'geo_shape_area':
			case 'chr_AvElevation':
			case 'chr_StdElevation':
			case 'chr_AvSlope':
			case 'chr_AvAspect':
				if(req.body[key].hasOwnProperty('min')) {
					filters.push(aql`doc.properties[${key}] >= ${req.body[key].min}`)
				}
				if(req.body[key].hasOwnProperty('max')) {
					filters.push(aql`doc.properties[${key}] <= ${req.body[key].max}`)
				}
				break

			case 'intersects':
				filters.push(
					aql`ANALYZER(GEO_INTERSECTS(${value}, doc.geometry), "geojson")`
				)
				break

			case 'distance':
				if(req.body[key].range.hasOwnProperty('min')) {
					dist = aql`GEO_DISTANCE(doc.geometry, ${req.body[key].reference})`
					filters.push(
						aql`ANALYZER(${dist} >= ${req.body[key].range.min}, "geojson")`
					)
				}
				if(req.body[key].range.hasOwnProperty('max')) {
					filters.push(
						aql`ANALYZER(${dist} <= ${req.body[key].range.max}, "geojson")`
					)
				}
				break
		}
	}
	const filter = (filters.length > 0)
				 ? aql.join([aql`SEARCH`, aql.join(filters, ' AND ')])
				 : aql``

	///
	// Collect paging parameters.
	///
	const paging = (req.body.hasOwnProperty('paging'))
		? aql`LIMIT ${req.body.paging.offset}, ${req.body.paging.limit}`
		: aql``

	///
	// Collect distance indicator.
	///
	const distance = (dist !== null)
				   ? aql`distance: ${dist},`
				   : aql``

	///
	// Build query.
	//
	const query = aql`
		FOR doc IN VIEW_SHAPE
			${filter}
			${paging}
		RETURN {
			${distance}
		    geometry_hash: doc._key,
		    std_dataset_ids: doc.std_dataset_ids,
		    properties: doc.properties,
		    geometry: doc.geometry,
		    geometry_bounds: doc.geometry_bounds
		}
	`

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

}, 'SelectShapes')

	///
	// Body parameter schemas.
	///
	.body(ModelSelection, ModelSelectionDescription)

	///
	// Response schema.
	///
	.response([ModelDataClick], ModelDataClickDescription)

	///
	// Summary.
	///
	.summary('Search shapes')

	///
	// Description.
	///
	.description(dd`
		The service provides a set of search criteria to select shapes, \
		it allows selecting shapes by geometry hash, dataset, area, \
		average and standard deviation elevation, slope, aspect, by \
		intersecting with a provided shape and by distance. It allows \
		to control results pagination.
	`)
