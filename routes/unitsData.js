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
const collection = db._collection('UnitShapes')
const ModelRecord = require('../models/unitData')
const ModelIdRecord = require('../models/unitIdData')
const ModelNumberRecord = require('../models/unitNumberData')
const geometryHashSchema = joi.string().regex(/^[0-9a-f]{32}$/).required()
	.description('Unit shape geometry hash.\nThe value is the `_key` of the `Shapes` collection record.')
const unitIdSchema = joi.string().regex(/[A-Z]{3}[0-9]{9}/).required()
	.description('Unit number identifier.')
const unitNumberSchema = joi.string().regex(/[A-Z]{3}[0-9]{5}/).required()
	.description('Unit number identifier.')
const UnitRecordDescription = `
Genetic Conservation Unit record.

The record contains the *combination* of these three properties:

- \`gcu_id_number\`: The *unit number*.
- \`gcu_id_unit-id\`: The *unit ID*, which is the *unit number* postfixed with the *date* when the *data* was *collected in the field*.
- \`geometry_hash\`: The record *reference* of the *shape*.

A \`gcu_id_number\` may have several related \`gcu_id_unit-id\` elements and the latter may have several related \`geometry_hash\` entries.

This schema reflects a *single record* in the *units collection*.
`
const UnitIdRecordDescription = `
Genetic Conservation Unit ID record.

The record contains the *combination* of these three properties:

- \`gcu_id_number\`: The *unit number*.
- \`gcu_id_unit-id\`: The *unit ID*, which is the *unit number* postfixed with the *date* when the *data* was *collected in the field*.
- \`geometry_hash_list\`: The *list* of *unit shape references* associated with the *unit ID*.
`
const UnitNumberRecordDescription = `
Genetic Conservation Unit number record.

The record contains the *combination* of these two properties:

- \`gcu_id_number\`: The *unit number*.
- \`gcu_id_unit-id_list\`: The list of *unit IDs* related to the provided *unit number*.
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
 * Given unit number return corresponding unit IDs.
 *
 * This service will return the unit IDs related to the provided unit number.
 *
 * Parameters:
 * - `:number`: The genetic conservation unit number.
 */
router.get('id', function (req, res)
{
	///
	// Parameters.
	///
	const num = req.queryParams.gcu_id_number

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.gcu_id_number == ${num}
			    COLLECT number = doc.gcu_id_number
			    INTO items
			RETURN {
			    gcu_id_number: number,
			    \`gcu_id_unit-id_list\`: UNIQUE(FLATTEN(items[*].doc['gcu_id_unit-id']))
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
	.response([ModelNumberRecord], UnitNumberRecordDescription)
	.summary('Get unit IDs related to provided unit number')
	.description(dd`
		The service will return all *unit IDs* related to the *provided unit number*.
	`);

/**
 * Given unit ID return corresponding unit number and shape hashes.
 *
 * This service will return the unit ID and number, along with
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
	const id = req.queryParams['gcu_id_unit-id']

	///
	// Perform service.
	///
	let result;
	try {
		result = db._query(aql`
			FOR doc IN ${collection}
			    FILTER doc.\`gcu_id_unit-id\` == ${id}
			    COLLECT id = doc.\`gcu_id_unit-id\`, number = doc.gcu_id_number INTO items
			RETURN {
			    gcu_id_number: number,
			    \`gcu_id_unit-id\`: id,
			    geometry_hash_list: items[*].doc.geometry_hash
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

	.queryParam('gcu_id_unit-id', unitIdSchema)
	.response([ModelIdRecord], UnitIdRecordDescription)
	.summary('Get unit number and shape references list for provided unit ID')
	.description(dd`
		The service will return the *unit number* and the *list* of *unit shape references* related to the *provided unit ID*.
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
			    FILTER doc.geometry_hash == ${shape}
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
	.response([ModelRecord], UnitRecordDescription)
	.summary('Get unit data related to the provided shape reference')
	.description(dd`
		The service will return the *unit number* and *unit ID* related to the provided *unit shape reference*.
	`);
