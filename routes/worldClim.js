'use strict'

/**
 * worldClim.js
 *
 * This script contains the routes for the WorldClim climate services.
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
const collection_map = db._collection('WorldClimMap')
const collection_data = db._collection('WorldClim')

///
// Models.
///
const ModelShape = require("../models/shapeTarget");
const ModelRecord = require('../models/worldClim')
const minDistanceSchema = joi.number().required()
	.description('Minimum distance inclusive in meters.')
const maxDistanceSchema = joi.number().required()
	.description('Maximum distance inclusive in meters.')
const sortSchema = joi.string().valid('NO', 'ASC', 'DESC').required()
	.description("Sort order: \`NO\` to ignore sorting, \`ASC\` for ascending, \`DESC\` for descending.")
const whatSchema = joi.string().valid('KEY', 'SHAPE', 'DATA').required()
	.description("Result type: \`KEY\` return geometry hash, \`SHAPE\` return geometry, \`DATA\` return properties.")
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
const startLimitSchema = joi.number().required()
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const ModelRecordDescription = `
WorldClim location record.

Depending on the value of the \`what\` parameter:

- \`KEY\`: The service will only return the \`geometry_hash\` which is the hash of the point geometry and key of the record.
- \`SHAPE\`: The service will return, in addition of the above, \`geometry_point\` representing the data point and \
 \`geometry_bounds\` representing the data bounding box. If the query involves a distance, the \`distance\` property \
 will also be returned.
- \`DATA\`: The service will return, in addition of the above, all properties of the data point.
`

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('WorldClim')


/**
 * Return the WorldClim data record that contains the provided point.
 *
 * This service will return the WorldClim record that contains the provided coordinate..
 *
 * Parameters:
 * - `:what`: The result type, `KEY` only geometry key, `SHAPE` key and geometry, `DATA` all.
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 **/
router.get('click/:what/:lat/:lon', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Build query.
	//
	let query
	switch(what) {
		case 'KEY':
			query = aql`
				LET radius = 0.004167
				LET box = GEO_POLYGON([
				    [ ${lon}-radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}-radius ]
				])
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(
						box,
						doc.geometry
					)
				RETURN doc._key
			`
			break

		case 'SHAPE':
			query = aql`
				LET radius = 0.004167
				LET box = GEO_POLYGON([
				    [ ${lon}-radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}-radius ]
				])
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(
						box,
						doc.geometry
					)
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		case 'DATA':
			query = aql`
				LET radius = 0.004167
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
			break
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
	.pathParam('what', whatSchema)
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get chelsa record containing the provided coordinate')

	///
	// Description.
	///
	.description(dd`
		The service will return the WorldClim data record that contains the provided coordinate.
		Provide \`KEY\` in the \`:what\` path paraneter to return just the geometry hash, \
		\`SHAPE\` to return the record geomnetries, or \`DATA\` to return all properties.
	`)

/**
 * Return the WorldClim data record that contains the provided point.
 *
 * This service will return the WorldClim map points whose distance to the provided reference
 * geometry is larger or equal to the provided minimum distance and smaller or equal to
 * the provided maximum distance.
 *
 * Parameters:
 * - `:what`: The result type, `KEY` only geometry key, `SHAPE` key and geometry, `DATA` all.
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
	let query
	switch(what) {
		case 'KEY':
			query = (sort === 'NO') ?
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						LIMIT ${start}, ${limit}
					RETURN doc._key
				` :
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						SORT distance ${sort}
						LIMIT ${start}, ${limit}
					RETURN doc._key
				`
			break

		case 'SHAPE':
			query = (sort === 'NO') ?
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds
					}
				` :
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						SORT distance ${sort}
						LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds
					}
				`
			break

		case 'DATA':
			query = (sort === 'NO') ?
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						FOR dat IN ${collection_data}
							FILTER dat._key == doc._key
							LET distance = GEO_DISTANCE(target, doc.geometry)
							FILTER distance >= ${min}
							FILTER distance <= ${max}
							LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds,
						properties: dat.properties
					}
				` :
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						FOR dat IN ${collection_data}
							FILTER dat._key == doc._key
							LET distance = GEO_DISTANCE(target, doc.geometry)
							FILTER distance >= ${min}
							FILTER distance <= ${max}
							SORT distance ${sort}
							LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds,
						properties: dat.properties
					}
				`
			break
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
	.summary('Get all WorldClim data point locations within the provided distance range')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *WorldClim data points* whose *distance* to the *provided reference geometry* is within the *provided range*.
		The distance is calculated the *wgs84 centroids* of both the provided reference geometry and the shape geometry.
		If you provide \`ALL\` in the \`what\` paraneter, the service will return the geometries of the WorldClim data location; if you provide \`HASH\`, it will only return the geometry *hash*, or data record primary key.
	`)

/**
 * Return all WorldClim data points fully contained by the provided reference geometry.
 *
 * This service will return all the occurrence records which are fully contained
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
	let query
	switch(what) {
		case 'KEY':
			query = aql`
				LET target = ${reference}
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN doc._key
			`
			break

		case 'SHAPE':
			query = aql`
				LET target = ${reference}
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		case 'DATA':
			query = aql`
				LET target = ${reference}
				FOR doc IN ${collection_map}
					FOR dat IN ${collection_data}
						FILTER dat._key == doc._key
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds,
					properties: dat.properties
				}
				`
			break
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
	.summary('Get all WorldClim data point locations fully contained by the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *WorldClim data points* whose *distance* to the *provided reference geometry* is within the *provided range*.
		The distance is calculated the *wgs84 centroids* of both the provided reference geometry and the shape geometry.
		If you provide \`ALL\` in the \`what\` paraneter, the service will return the geometries of the WorldClim data location; if you provide \`HASH\`, it will only return the geometry *hash*, or data record primary key.
	`)

/**
 * Return all WorldClim data points that intersect with the provided reference geometry.
 *
 * This service will return all the WorldClim data points which intersect
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
	let query
	switch(what) {
		case 'KEY':
			query = aql`
			    LET target = ${reference}
				FOR doc IN ${collection_map}
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN doc._key
			`
			break

		case 'SHAPE':
			query = aql`
			    LET target = ${reference}
				FOR doc IN ${collection_map}
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		case 'DATA':
			query = aql`
			    LET target = ${reference}
				FOR doc IN ${collection_map}
					FOR dat IN ${collection_data}
						FILTER dat._key == doc._key
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds,
					properties: dat.properties
				}
				`
			break
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
	.summary('Get all WorldClim data points that intersect the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *WorldClim data points* intersecting with the provided reference geometry.
		*Intersecting* is defined such that at least one point in the reference geometry is also in the shape geometry or vice-versa.
	`)
