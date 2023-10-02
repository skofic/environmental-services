'use strict'

/**
 * chelsaClimate.js
 *
 * This script contains the routes for the Chelsa climate services.
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
const collection_map = db._collection('ChelsaMap')
const collection_data = db._collection('Chelsa')

///
// Models.
///
const ModelShape = require("../models/shapeTarget");
const ModelShapeContains = require("../models/shapeContains");
const ModelRecord = require('../models/climate')
const minDistanceSchema = joi.number().required()
	.description('Minimum distance inclusive in meters.')
const maxDistanceSchema = joi.number().required()
	.description('Maximum distance inclusive in meters.')
const sortSchema = joi.string().valid('NO', 'ASC', 'DESC').required()
	.description("Sort order: \`NO\` to ignore sorting, \`ASC\` for ascending, \`DESC\` for descending.")
const whatSchema = joi.string().valid('KEY', 'SHAPE', 'DATA', 'MIN', 'AVG', 'MAX', 'STD', 'VAR').required()
	.description("Result type: \`KEY\` return geometry hash, \`SHAPE\` return geometry, \`DATA\` return properties, \`MIN\` return minimum, \`AVG\` return average, \`MAX\` return maximum, \`STD\` return standard deviation, \`VAR\` return variance")
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
const startLimitSchema = joi.number().required()
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const ModelRecordDescription = `
Chelsa location record.

Depending on the value of the \`what\` parameter:

- \`KEY\`: The service will only return the \`geometry_hash\` which is the hash of the point geometry and key of the record.
- \`SHAPE\`: The service will return, in addition of the above, \`geometry_point\` representing the data point and \
 \`geometry_bounds\` representing the data bounding box. If the query involves a distance, the \`distance\` property \
 will also be returned.
- \`DATA\`: The service will return, in addition of the above, all properties of the data point.
`

///
// Utils.
///
const {
	ChelsaDistanceAQL,
	ChelsaContainsAQL,
	ChelsaIntersectsAQL
} = require('../utils/chelsaAggregateAQL')

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Chelsa')


/**
 * Return the Chelsa data record that contains the provided point.
 *
 * This service will return the Chelsa record that contains the provided coordinate.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 **/
router.get('click/:lat/:lon', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Build query.
	//
	let query = aql`
		LET radius = 0.004166665
		LET box = GEO_POLYGON([
		    [ ${lon}-radius, ${lat}-radius ],
		    [ ${lon}+radius, ${lat}-radius ],
		    [ ${lon}+radius, ${lat}+radius ],
		    [ ${lon}-radius, ${lat}+radius ],
		    [ ${lon}-radius, ${lat}-radius ]
		])
		FOR doc IN ${collection_map}
			FOR dat IN ${collection_data}
				FILTER dat._key == doc._key
				FILTER GEO_CONTAINS(
					box,
					doc.geometry
				)
		RETURN {
			geometry_hash: doc._key,
			geometry_point: doc.geometry,
			geometry_bounds: doc.geometry_bounds,
			properties: dat.properties
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

}, 'list')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelRecord], "The service will return the WorldClim data record that contains the provided coordinate.")

	///
	// Summary.
	///
	.summary('Get Chelsa record containing the provided coordinate')

	///
	// Description.
	///
	.description(dd`
		The service will return the Chelsa data record that contains the provided coordinate.
	`)

/**
 * Return the Chelsa data records found within the provided distance.
 *
 * This service will return the Chelsa records whose distance to the provided reference
 * geometry is larger or equal to the provided minimum distance and smaller or equal to
 * the provided maximum distance.
 *
 * The distance is calculated from the centroid of the provided reference geometry to the
 * centroids of the Chelsa records.
 *
 * Parameters:
 * - `:what`: The result type, `KEY` only geometry key, `SHAPE` key and geometry, `DATA` properties, `MIN` minimum, `AVG` average, `MAX` maximum, `STD` standard deviation, `VAR` variance.
 * - `:min`: The minimum distance inclusive.
 * - `:max`: The maximum distance inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('dist/:what/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query =
		ChelsaDistanceAQL(
			collection_data,
			collection_map,
			reference,
			what,
			min,
			max,
			sort,
			start,
			limit
		)

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
	.pathParam('what', whatSchema)
	.pathParam('min', minDistanceSchema)
	.pathParam('max', maxDistanceSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get or stat all Chelsa data points within the provided distance range')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *Chelsa data points* whose *distance* to the \
		*provided reference geometry* is within the *provided range*.
		The distance is calculated from the *wgs84 centroids* of both the provided reference \
		geometry and the shape geometry.
		Provide \`KEY\` in the \`:what\` path paraneter to return just the geometry hash, \
		\`SHAPE\` to return the record geometries, \`DATA\` to return all properties, or \
		\`MIN\` for minimum, \`AVG\` for average, \`MAX\` for maximum, \`STD\` for standard \
		deviation and \`VAR\` for variance of quantitative properties.
	`)

/**
 * Return all Chelsa data points fully contained by the provided reference geometry.
 *
 * This service will return all the occurrence records whose centroids are fully contained
 * by the provided reference geometry, the latter may be a Polygon or MultiPolugon.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('contain/:what/:start/:limit', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query =
		ChelsaContainsAQL(
			collection_data,
			collection_map,
			reference,
			what,
			start,
			limit
		)

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
	.pathParam('what', whatSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShapeContains, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Polygon* or *MultiPolygon*."
	)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get or stat all Chelsa data points contained by the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
The service will return the *list* of *Chelsa data points* that are *contained* in the *provided reference geometry*, that should be either a GeoJSON Polygon or MultiPolygon.

Provide **KEY** in the \`:what\` path paraneter to return just the geometry hash, **SHAPE** to return the record geometries, **DATA** to return all properties, or **MIN** for minimum, **AVG** for average, **MAX** for maximum, **STD** for standard deviation and **VAR** for variance of quantitative properties.

*Containing* means that the *centroids* of the Chelsa data points must be *fully contained* by the provided *reference gepmetry*, this means that Chelsa areas intersecting less than 50% will not be considered.
`)

/**
 * Return all Chelsa data points that intersect with the provided reference geometry.
 *
 * This service will return all the Chelsa data points which intersect
 * with the provided reference geometry.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('intersect/:what/:start/:limit', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query =
		ChelsaIntersectsAQL(
			collection_data,
			collection_map,
			reference,
			what,
			start,
			limit
		)

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
	.pathParam('what', whatSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get or stat all Chelsa data points that intersect with the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of Chelsa records that *intersect* with the *provided reference geometry*, that can be a GeoJSON *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.

Provide **KEY** in the \`:what\` path paraneter to return just the geometry hash, **SHAPE** to return the record geometries, **DATA** to return all properties, or **MIN** for minimum, **AVG** for average, **MAX** for maximum, **STD** for standard deviation and **VAR** for variance of quantitative properties.

*Intersecting* means that elements will be selected if *any part* of the Chelsa data area *intersects* with *any part* of the provided *reference geometry*.
	`)
