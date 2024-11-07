'use strict'

/**
 * unitsData.js
 *
 * This script contains the routes for the Genetic Conservation Units data services.
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
const collection = db._collection(module.context.configuration.collectionUnitShapes)
const ModelUnitShapes = require('../models/unitIdData')
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')
const unitNumberSchema = joi.string().regex(/[A-Z]{3}[0-9]{5}/).required()
	.description('Unit number identifier.')
const UnitShapesRecordDescription = `
Genetic Conservation Unit shapes by number record.

The record contains the *combination* of these two properties:

- \`gcu_id_number\`: The *unit number*.
- \`geometry_hash_list\`: The *list* of *unit shape references* associated with the *unit ID*.
`

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Units')


/**
 * Given unit number return corresponding shape hashes.
 *
 * This service will return the unit number, along with
 * an array of all the unit shape references related to the provided unit ID.
 *
 * Parameters:
 * - `:id`: The genetic conservation unit ID.
 */
router.get('shape', function (req, res)
{
	///
	// Parameters.
	///
	const number = req.queryParams['gcu_id_number']

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc._key == ${number}
			RETURN {
			    gcu_id_number: doc.gcu_id_number,
			    geometry_hash_list: doc.geometry_hash_list
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

}, 'list')

	.queryParam('gcu_id_number', unitNumberSchema)
	.response([ModelUnitShapes], UnitShapesRecordDescription)
	.summary('Unit geometry references by unit number')
	.description(dd`
		The service will return the *unit number* and the *list* of *unit shape references* related to the *provided unit number*.
	`);

/**
 * Given unit ID return corresponding unit shape hashes.
 *
 * This service will return the unit ID and number,along with
 * an array of all the unit shape references related to the provided unit ID.
 *
 * Parameters:
 * - `:id`: The genetic conservation unit ID.
 */
router.get('rec', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.queryParams.geometry_hash

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
				FILTER ${shape} IN doc.geometry_hash_list
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

	.queryParam('geometry_hash', geometryHashSchema)
	.response([ModelUnitShapes], UnitShapesRecordDescription)
	.summary('Unit geometry references by shape reference')
	.description(dd`
		The service will return the *unit number* and the *list* of *unit shape references* related to the *provided shape reference*.
	`);
