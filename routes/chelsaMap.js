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
const sortSchema = joi.string().valid('ASC', 'DESC').required()
	.description("Sort order: \`ASC\` for ascending, \`DESC\` for descending.")
const startLimitSchema = joi.number().required()
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const ModelRecordDescription = `
Chelsa location record.

The record contains the following properties:

- \`geometry_hash\`: The hash of Chelsa's GeoJSON *Point geometry*, which is also the *unique key* of the *Chelsa data* record.
- \`distance\`: The *distance* between the *reference geometry* and the *data point*, optional.
- \`geometry\`: The GeoJSON *bounding box* of the *data record*, a *Polygon*.
- \`geometry_point\`: The GeoJSON *centroid* of the *data record*, a *Point*.

This schema reflects a *single record* in the *Chelsa map collection*.
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
 * - `:min`: The minimum distance inclusive.
 * - `:max`: The maximum distance inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('dist/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry

	///
	// Perform service.
	///
	let result
	try {
		///
		// All species.
		///
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

		//
		// Return bounding box geometry.
		//
		result = result.map( item => {
			return {
				geometry_hash: item.geometry_hash,
				distance: item.distance,
				geometry: GeometryUtils.centerToBoundingBox(item.geometry, 0.46331219435),
				geometry_point: item.geometry
			}
		})
	}
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'list')

	.pathParam('min', minDistanceSchema)
	.pathParam('max', maxDistanceSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*. The `species_list` property " +
		"should contain the list of species that should be filtered; if you provide an " +
		"empty list, all species will be returned."
	)
	.response([ModelRecord], ModelRecordDescription)
	.summary('Get all Chelsa data point locations within the provided distance range')
	.description(dd`
		The service will return the *list* of *Chelsa data points* whose *distance* to the *provided reference geometry* is within the *provided range*.
		The distance is calculated the *wgs84 centroids* of both the provided reference geometry and the shape geometry.
	`)
