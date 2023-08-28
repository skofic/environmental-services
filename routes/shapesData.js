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
	.description('Genetic Conservation Unit shape record identifier.\nThe value is the `_key` of the `Shapes` collection record.')
const ShapeRecordDescription = `
Genetic Conservation Unit Shape record.

The record contains the following properties:

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
router.tag('Genetic Conservation Unit Shapes')


/**
 * Given unit number return corresponding unit IDs.
 *
 * This service will return the unit IDs related to the provided unit number.
 *
 * Parameters:
 * - `:number`: The genetic conservation unit number.
 */
router.get(':id', function (req, res)
{
	///
	// Parameters.
	///
	const id = req.pathParams.id

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc._key == ${id}
			RETURN UNSET(doc, '_id', '_key', '_rev')
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

	.pathParam('id', geometryHashSchema)
	.response([ModelRecord], ShapeRecordDescription)
	.summary('Get the shape record associated to the provided ID')
	.description(dd`
		The service will return the *shape record* identified by the provided *ID*.
	`);
