'use strict'

/**
 * speciesOccurrences.js
 *
 * This script contains the routes for the species occurrences services.
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
const collection = db._collection('SpeciesOccurrences')
const ModelShape = require("../models/shapeTargetOccurrence");
const ModelRecord = require('../models/occurrenceData')
const ModelSpecies = require('../models/occurrenceSpecies')
const ModelContainer = require('../models/containerTargetSpecies')
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
const minDistanceSchema = joi.number().required()
	.description('Minimum distance inclusive in meters.')
const maxDistanceSchema = joi.number().required()
	.description('Maximum distance inclusive in meters.')
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
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const allAnySchema = joi.string().valid('ALL', 'ANY').required()
	.description("Select species occurrences featuring \`all\` or \`any\` of the provided species.")
const ShapeRecordDescription = `
Species occurrence record.

The record contains the following properties:

- \`geometry_hash\`: The hash of the occurrence's GeoJSON *geometry*, which is also the *unique key* of the *occurrence* record.
- \`geometry\`: The GeoJSON *geometry* of the *occurrence*.
- \`properties\`: An object containing \`species_list\` which lists all the *species observed* in the *location*.

This schema reflects a *single record* in the *species occurrences collection*.
`

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Species Occurrences')


/**
 * Return the species occurrence record associated with the provided geometry hash.
 *
 * This service will return the occurrence record identified by the provided geometry hash.
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

}, 'record')

	.pathParam('hash', geometryHashSchema)
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get species occurrences for the provided geometry hash')
	.description(dd`
		The service will return the *occurrence record* identified by the provided *geometry hash*.
	`);

/**
 * Return all species occurrences containing any of the species in the provided list.
 *
 * This service will return the occurrence records that feature any of the species
 * provided in the body list.
 *
 * Parameters:
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('sp/:which/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const which = req.pathParams.which.toLowerCase()
	const start = req.pathParams.start
	const limit = req.pathParams.limit
	const species = req.body.species_list

	///
	// Init result.
	//
	let result

	///
	// Perform service.
	///
	try {
		///
		// All species.
		///
		if(species.length == 0) {
			result = db._query(aql`
				FOR doc IN ${collection}
				    LIMIT ${start}, ${limit}
				RETURN MERGE(
					{ geometry_hash: doc._key },
					UNSET(doc, '_id', '_key', '_rev')
				)
            `).toArray()
		}
		else
		{
			///
			// All requested species.
			//
			if(which == 'all') {
				result = db._query(aql`
					FOR doc IN ${collection}
					    FILTER ${species} ALL IN doc.properties.species_list
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}
			else
			{
				result = db._query(aql`
					FOR doc IN ${collection}
					    FILTER ${species} ANY IN doc.properties.species_list
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}
		}
	}
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'list')

	.pathParam('which', allAnySchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelSpecies, "The requested *list of species*.")
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all occurrences matching any of the provided species')
	.description(dd`
		The service will return the *list* of *occurrence records* that feature any of the *species provided*.
		If you provide an empty list, the service will return all occurrences.
	`)

/**
 * Return all species occurrences within the provided distance range
 * who match any or all of the provided species.
 *
 * This service will return the occurrence records whose distance to the provided reference
 * geometry is larger or equal to the provided minimum distance and smaller or equal to
 * the provided maximum distance; the results are further filtered by the provided species list.
 *
 * Parameters:
 * - `:min`: The minimum distance inclusive.
 * - `:max`: The maximum distance inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('dist/:min/:max/:sort/:which/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const which = req.pathParams.which.toLowerCase()
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry
	const species = req.body.species_list

	///
	// Perform service.
	///
	let result
	try {
		///
		// All species.
		///
		if(species.length == 0) {
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
		else
		{
			///
			// All requested species.
			//
			if(which == 'all') {
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER ${species} ALL IN doc.properties.species_list
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
			else
			{
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER ${species} ANY IN doc.properties.species_list
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
		}
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
	.pathParam('which', allAnySchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*. The `species_list` property " +
		"should contain the list of species that should be filtered; if you provide an " +
		"empty list, all species will be returned."
	)
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all occurrences within the provided distance range featuring requested species')
	.description(dd`
		The service will return the *list* of *occurrence records* whose *distance* to the *provided reference geometry* is within the *provided range*,
		and that feature *any* or *all* species provided in the body \`species_list\` array parameter.
		The distance is calculated the *wgs84 centroids* of both the provided reference geometry and the shape geometry.
	`)

/**
 * Return all species occurrences fully contained by the provided reference geometry
 * that match any or all of the provided species.
 *
 * This service will return all the occurrence records which are fully contained
 * by the provided reference geometry, the latter may be a Polygon or MultiPolugon,
 * and that match any or all of the provided species.
 *
 * Parameters:
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('contain/:which/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const which = req.pathParams.which.toLowerCase()
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry
	const species = req.body.species_list

	///
	// Perform service.
	///
	let result
	try {
		///
		// All species.
		///
		if(species.length == 0) {
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
		}
		else
		{
			///
			// All requested species.
			//
			if(which == 'all') {
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    FILTER GEO_CONTAINS(${reference}, doc.geometry)
					    FILTER ${species} ALL IN doc.properties.species_list
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}
			else
			{
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    FILTER GEO_CONTAINS(${reference}, doc.geometry)
					    FILTER ${species} ANY IN doc.properties.species_list
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}
		}
	}
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'list')

	.pathParam('which', allAnySchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelContainer, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Polygon* or *MultiPolygon*. " +
		"The `species_list` property should contain the list of species that should be " +
		"filtered; if you provide an empty list, all species will be returned."
	)
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all occurrences fully contained by the provided reference geometry and matching species selection')
	.description(dd`
		The service will return the *list* of *occurrence records* contained by the provided reference geometry that match all or any of the provided species.
		*Contained* is defined such that if the sphere is subdivided into faces (loops), every point is contained by exactly one face. This implies that linear rings do not necessarily contain their vertices.
		If you provide an empty species list, no filtering will be applied to species.
	`)

/**
 * Return all species occurrences that intersect with the provided reference geometry
 * and whose species match all or any of the provided species.
 *
 * This service will return all the occurrence records which intersect
 * with the provided reference geometry and match all or any of the provided species.
 *
 * Parameters:
 * - `:which`: `ANY` or `ALL` species in the provided list should be matched.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('intersect/:which/:start/:limit', function (req, res)
{
	///
	// Parameters.
	///
	const which = req.pathParams.which.toLowerCase()
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	const reference = req.body.geometry
	const species = req.body.species_list

	///
	// Perform service.
	///
	let result
	try {
		///
		// All species.
		///
		if(species.length == 0) {
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
		}
		else
		{
			///
			// All requested species.
			//
			if(which == 'all') {
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
						FILTER ${species} ALL IN doc.properties.species_list
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}
			else
			{
				result = db._query(aql`
				    LET target = ${reference}
					FOR doc IN ${collection}
					    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
						FILTER ${species} ANY IN doc.properties.species_list
					    LIMIT ${start}, ${limit}
					RETURN MERGE(
						{ geometry_hash: doc._key },
						UNSET(doc, '_id', '_key', '_rev')
					)
	            `).toArray()
			}
		}
	}
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result);

}, 'list')

	.pathParam('which', allAnySchema)
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*. The `species_list` property " +
		"should contain the list of species that should be filtered; if you provide an " +
		"empty list, all species will be returned."
	)
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get all occurrences that intersect the provided reference geometry and match the provided species')
	.description(dd`
		The service will return the *list* of *occurrence records* intersecting by the provided reference geometry.
		*Intersecting* is defined such that at least one point in the reference geometry is also in the shape geometry or vice-versa.
		You can also provide a list of species that should match the selected records.
	`)
