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
const collection_data = db._collection('Chelsa')
const collection_map = db._collection('ChelsaMap')
const ModelShape = require("../models/shapeTargetOccurrence");
const ModelRecord = require('../models/chelsaClimate')
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
const DataRecordDescription = `
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
router.tag('Chelsa Climate')


/**
 * Return the Chelsa climate record associated with the provided geometry hash.
 *
 * This service will return the Chelsa record identified by the provided geometry hash.
 *
 * Parameters:
 * - `:hash`: The GeoJSON Point geometry hash.
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
		///
		// Get record.
		//
		result = db._query(aql`
			FOR doc IN ${collection_data}
			    FILTER doc._key == ${hash}
			RETURN MERGE(
				{ geometry_hash: doc._key },
				UNSET(doc, '_id', '_key', '_rev')
			)
        `).toArray()

		///
		// Handle result.
		///
		if(result.length > 0) {
			//
			// Return bounding box geometry.
			//
			result[0].geometry = GeometryUtils.centerToBoundingBox(result[0].geometry, 0.46331219435)
		}
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
	.response([ModelRecord], DataRecordDescription)
	.summary('Get species occurrences for the provided geometry hash')
	.description(dd`
		The service will return the *occurrence record* identified by the provided *geometry hash*.
	`);
