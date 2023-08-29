'use strict'

/**
 * shapesData.js
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
const collection = db._collection('Shapes')
const ModelRecord = require('../models/shapeData')
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')
const minAreaSchema = joi.number().required()
	.description('Minimum area inclusive in square meters.')
const maxAreaSchema = joi.number().required()
	.description('Maximum area inclusive in square meters.')
const minAspectSchema = joi.number().required()
	.description('Minimum aspect inclusive in degrees.')
const maxAspectSchema = joi.number().required()
	.description('Maximum aspect inclusive in degrees.')
const minSlopeSchema = joi.number().required()
	.description('Minimum slope inclusive in degrees.')
const maxSlopeSchema = joi.number().required()
	.description('Maximum slope inclusive in degrees.')
const minElevationSchema = joi.number().required()
	.description('Minimum elevation inclusive in meters.')
const maxElevationSchema = joi.number().required()
	.description('Maximum elevation inclusive in meters.')
const minElevationSdSchema = joi.number().required()
	.description('Minimum elevation standard deviation inclusive in meters.')
const maxElevationSdSchema = joi.number().required()
	.description('Maximum elevation standard deviation inclusive in meters.')
const sortSchema = joi.string().valid('ASC', 'DESC').required()
	.description("Sort order: \`ASC\` for ascending, \`DESC\` for descending.")
const startLimitSchema = joi.number().required()
	.description('Start position, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records.')
const ShapeRecordDescription = `
Genetic Conservation Unit Shape record.

The record contains the following properties:

- \`geometry_hash\`: The hash of the shape's GeoJSON *geometry*, which is also the *unique key* of the *shape* record.
- \`geometry\`: The GeoJSON *geometry* of the *shape*.
- \`geometry_bounds\`: The GeoJSON *geometry* that represents the *shape bounding box*.
- \`properties\`: An object containing properties related to the shape and not tied to a time frame.

This schema reflects a *single record* in the *unit shapes collection*.
`

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
router.get(':hash', function (req, res)
{
	///
	// Parameters.
	///
	const hash = req.pathParams.hash

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc._key == ${hash}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
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
	res.send(result);

}, 'list')

	.pathParam('hash', geometryHashSchema)
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get shape record for the provided geometry hash')
	.description(dd`
		The service will return the *shape record* identified by the provided *geometry hash*.
	`);

/**
 * Return all shapes within the provided area range.
 *
 * This service will return the shape records whose area is larger or equal
 * to the provided minimum area and smaller or equal to the provided maximum area.
 *
 * Parameters:
 * - `:min`: The minimum area inclusive.
 * - `:max`: The maximum area inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 */
router.get('area/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit
	const descriptor = "geo_shape_area"

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.properties.topography.${descriptor} >= ${min}
			    FILTER doc.properties.topography.${descriptor} <= ${max}
			    SORT doc.properties.topography.${descriptor} ${sort}
			    LIMIT ${start}, ${limit}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
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
	res.send(result);

}, 'list')

	.pathParam('min', minAreaSchema)
	.pathParam('max', maxAreaSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all shapes within the provided area range')
	.description(dd`
		The service will return the *list* of *shape records* whose *geometry area* is within the *provided range*.
	`);

/**
 * Return all shapes within the provided elevation range.
 *
 * This service will return the shape records whose elevation is higher or equal
 * to the provided minimum elevation and lower or equal to the provided maximum elevation.
 *
 * Parameters:
 * - `:min`: The minimum elevation inclusive.
 * - `:max`: The maximum elevation inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 */
router.get('alt/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit
	const descriptor = "geo_shape_elevation"

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.properties.topography.${descriptor} >= ${min}
			    FILTER doc.properties.topography.${descriptor} <= ${max}
			    SORT doc.properties.topography.${descriptor} ${sort}
			    LIMIT ${start}, ${limit}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
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
	res.send(result);

}, 'list')

	.pathParam('min', minElevationSchema)
	.pathParam('max', maxElevationSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all shapes within the provided elevation range')
	.description(dd`
		The service will return the *list* of *shape records* whose *elevation* is within the *provided range*.
	`);

/**
 * Return all shapes within the provided elevation standard deviation range.
 *
 * This service will return the shape records whose elevation standard deviation
 * is larger or equal to the provided minimum value and smaller or equal to the
 * provided maximum value.
 *
 * Parameters:
 * - `:min`: The minimum elevation standard deviation inclusive.
 * - `:max`: The maximum elevation standard deviation inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 */
router.get('altsd/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit
	const descriptor = "geo_shape_elevation_sd"

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.properties.topography.${descriptor} >= ${min}
			    FILTER doc.properties.topography.${descriptor} <= ${max}
			    SORT doc.properties.topography.${descriptor} ${sort}
			    LIMIT ${start}, ${limit}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
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
	res.send(result);

}, 'list')

	.pathParam('min', minElevationSdSchema)
	.pathParam('max', maxElevationSdSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all shapes within the provided elevation standard deviation range')
	.description(dd`
		The service will return the *list* of *shape records* whose *elevation standard deviation* is within the *provided range*.
	`);

/**
 * Return all shapes within the provided slope range.
 *
 * This service will return the shape records whose slope is larger or equal
 * to the provided minimum value and smaller or equal to the provided maximum value.
 *
 * Parameters:
 * - `:min`: The minimum slope inclusive.
 * - `:max`: The maximum slope inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 */
router.get('slope/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit
	const descriptor = "geo_shape_slope"

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.properties.topography.${descriptor} >= ${min}
			    FILTER doc.properties.topography.${descriptor} <= ${max}
			    SORT doc.properties.topography.${descriptor} ${sort}
			    LIMIT ${start}, ${limit}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
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
	res.send(result);

}, 'list')

	.pathParam('min', minSlopeSchema)
	.pathParam('max', maxSlopeSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all shapes within the provided slope range')
	.description(dd`
		The service will return the *list* of *shape records* whose *slope* is within the *provided range*.
	`);

/**
 * Return all shapes within the provided aspect range.
 *
 * This service will return the shape records whose aspect is larger or equal
 * to the provided minimum value and smaller or equal to the provided maximum value.
 *
 * Parameters:
 * - `:min`: The minimum aspect inclusive.
 * - `:max`: The maximum aspect inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 */
router.get('aspect/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit
	const descriptor = "geo_shape_aspect"

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.properties.topography.${descriptor} >= ${min}
			    FILTER doc.properties.topography.${descriptor} <= ${max}
			    SORT doc.properties.topography.${descriptor} ${sort}
			    LIMIT ${start}, ${limit}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
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
	res.send(result);

}, 'list')

	.pathParam('min', minAspectSchema)
	.pathParam('max', maxAspectSchema)
	.pathParam('sort', sortSchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all shapes within the provided aspect range')
	.description(dd`
		The service will return the *list* of *shape records* whose *aspect* is within the *provided range*.
	`);
