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
const GeometryUtils = require('../utils/Geometry')

///
// Collections and models.
///
const collection = db._collection('ChelsaMap')
const ModelShape = require("../models/shapeTarget");
const ModelRecord = require('../models/chelsaMap')
const minDistanceSchema = joi.number().required()
	.description('Minimum distance inclusive in meters.')
const maxDistanceSchema = joi.number().required()
	.description('Maximum distance inclusive in meters.')
const sortSchema = joi.string().valid('NO', 'ASC', 'DESC').required()
	.description("Sort order: \`NO\` to ignore sorting, \`ASC\` for ascending, \`DESC\` for descending.")
const whatSchema = joi.string().valid('ALL', 'HASH').required()
	.description("Result type: \`ALL\` all data, \`HASH\` only geometry hash.")
const startLimitSchema = joi.number().required()
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')
const ModelRecordDescription = `
Chelsa location record.

The record contains the following properties:

- \`geometry_hash\`: The hash of Chelsa's GeoJSON *Point geometry*, which is also the *unique key* of the *Chelsa data* record.
- \`distance\`: The *distance* between the *reference geometry* and the *data point*, optional.
- \`geometry\`: The GeoJSON *bounding box* of the *data record*, a *Polygon*.
- \`geometry_point\`: The GeoJSON *centroid* of the *data record*, a *Point*.

This schema reflects a *single record* in the *Chelsa map collection*.

When \`HASH\` is set in the \`what\` parameter, *only* the *geometry hash* will be returned.
`

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Chelsa Map')


/**
 * Return all Chelsa map points within the provided distance range.
 *
 * This service will return the Chelsa map points whose distance to the provided reference
 * geometry is larger or equal to the provided minimum distance and smaller or equal to
 * the provided maximum distance.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:min`: The minimum distance inclusive.
 * - `:max`: The maximum distance inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('dist/:what/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const what = req.pathParams.what
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry

	///
	// Perform service.
	///
	try
	{
		///
		// Return geometries.
		///
		if(what == 'ALL')
		{
			let result

			///
			// Ignore sort.
			///
			if(sort === 'NO')
			{
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    LET distance = GEO_DISTANCE(target, doc.geometry)
					    FILTER distance >= ${min}
					    FILTER distance <= ${max}
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key, distance: distance },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()

			} // No sorting.

			///
			// Sort data.
			///
			else
			{
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    LET distance = GEO_DISTANCE(target, doc.geometry)
					    FILTER distance >= ${min}
					    FILTER distance <= ${max}
					    SORT distance ${sort}
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key, distance: distance },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}

			///
			// Add bounding box and return.
			///
			res.send(
				result.map( item => {
					return {
						geometry_hash: item.geometry_hash,
						distance: item.distance,
						geometry: GeometryUtils.centerToBoundingBox(item.geometry, 0.46331219435),
						geometry_point: item.geometry
					}
				})
			)

		} // Return geometries.

		///
		// Return geometry hash.
		///
		else
		{
			///
			// Ignore sort.
			///
			if(sort === 'NO')
			{
				res.send(
					db._query(aql`
						LET target = ${reference}
						FOR doc IN ${collection}
							LET distance = GEO_DISTANCE(target, doc.geometry)
							FILTER distance >= ${min}
							FILTER distance <= ${max}
							LIMIT ${start}, ${limit}
						RETURN doc._key
					`).toArray()
				)

			} // Ignore sorting.

			///
			// Sort data.
			///
			else
			{
				res.send(
					db._query(aql`
						LET target = ${reference}
						FOR doc IN ${collection}
							LET distance = GEO_DISTANCE(target, doc.geometry)
							FILTER distance >= ${min}
							FILTER distance <= ${max}
							SORT distance ${sort}
							LIMIT ${start}, ${limit}
						RETURN doc._key
					`).toArray()
				)

			} // Sort results.

		} // Return geometry hash.
	}
	catch (error) {
		throw error;
	}

}, 'list')

	.pathParam('what', whatSchema)
	.pathParam('min', minDistanceSchema)
	.pathParam('max', maxDistanceSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)
	.response([ModelRecord], ModelRecordDescription)
	.summary('Get all Chelsa data point locations within the provided distance range')
	.description(dd`
		The service will return the *list* of *Chelsa data points* whose *distance* to the *provided reference geometry* is within the *provided range*.
		The distance is calculated the *wgs84 centroids* of both the provided reference geometry and the shape geometry.
		If you provide \`ALL\` in the \`what\` paraneter, the service will return the geometries of the Chelsa data location; if you provide \`HASH\`, it will only return the geometry *hash*, or data record primary key.
	`)

/**
 * Return all Chelsa data points fully contained by the provided reference geometry.
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
	// Parameters.
	///
	const what = req.pathParams.what
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry

	///
	// Perform service.
	///
	try
	{
		///
		// Return geometries.
		///
		if(what == 'ALL')
		{
			let result

			///
			// Ignore sort.
			///
			result = db._query(aql`
				LET target = ${reference}
				FOR doc IN ${collection}
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN MERGE(
					{ geometry_hash: doc._key },
					UNSET(doc, '_id', '_key', '_rev')
				)
			`).toArray()

			///
			// Add bounding box and return.
			///
			res.send(
				result.map( item => {
					return {
						geometry_hash: item.geometry_hash,
						distance: item.distance,
						geometry: GeometryUtils.centerToBoundingBox(item.geometry, 0.46331219435),
						geometry_point: item.geometry
					}
				})
			)

		} // Return geometries.

		///
		// Return geometry hash.
		///
		else
		{
			res.send(
				db._query(aql`
					LET target = ${reference}
					FOR doc IN ${collection}
						FILTER GEO_CONTAINS(${reference}, doc.geometry)
						LIMIT ${start}, ${limit}
					RETURN doc._key
				`).toArray()
			)

		} // Return geometry hash.
	}
	catch (error) {
		throw error
	}

}, 'list')

	.pathParam('what', whatSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Polygon* or *MultiPolygon*."
	)
	.response([ModelRecord], ModelRecordDescription)
	.summary('Get all Chelsa data point locations fully contained by the provided reference geometry')
	.description(dd`
		The service will return the *list* of *Chelsa data points* contained by the provided reference geometry.
		*Contained* is defined such that if the sphere is subdivided into faces (loops), every point is contained by exactly one face.
		This implies that linear rings do not necessarily contain their vertices.
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
	// Parameters.
	///
	const what = req.pathParams.what
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry

	///
	// Perform service.
	///
	try
	{
		///
		// Return geometries.
		///
		if(what == 'ALL')
		{
			let result

			///
			// Ignore sort.
			///
			result = db._query(aql`
			    LET target = ${reference}
				FOR doc IN ${collection}
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN MERGE(
					{ geometry_hash: doc._key },
					UNSET(doc, '_id', '_key', '_rev')
				)
            `).toArray()

			///
			// Add bounding box and return.
			///
			res.send(
				result.map( item => {
					return {
						geometry_hash: item.geometry_hash,
						distance: item.distance,
						geometry: GeometryUtils.centerToBoundingBox(item.geometry, 0.46331219435),
						geometry_point: item.geometry
					}
				})
			)

		} // Return geometries.

			///
			// Return geometry hash.
		///
		else
		{
			res.send(
				db._query(aql`
					LET target = ${reference}
					FOR doc IN ${collection}
						FILTER GEO_INTERSECTS(${reference}, doc.geometry)
						LIMIT ${start}, ${limit}
					RETURN doc._key
				`).toArray()
			)

		} // Return geometry hash.
	}
	catch (error) {
		throw error
	}

}, 'list')

	.pathParam('what', whatSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)
	.response([ModelRecord], ModelRecordDescription)
	.summary('Get all Chelsa data points that intersect the provided reference geometry')
	.description(dd`
		The service will return the *list* of *Chelsa data points* intersecting with the provided reference geometry.
		*Intersecting* is defined such that at least one point in the reference geometry is also in the shape geometry or vice-versa.
	`)
