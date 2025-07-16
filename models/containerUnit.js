'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		'gcu_id_unit-id': joi.string()
			.regex(/[A-Z]{3}[0-9]{9}/),
		gcu_id_number: joi.string()
			.regex(/[A-Z]{3}[0-9]{5}/),
		'gcu_loc_coordinates-restriction': joi.boolean()
			.default(false)
			.required(),
		gcu_loc_climate: joi.object({
			type: joi.string().valid('Point').required(),
			coordinates: joi.array()
				.ordered(
					joi.number().min(-180).max(180).required(),  // Longitude
					joi.number().min(-90).max(90).required()     // Latitude
				)
				.length(2)
				.required()
		}),
		species_list: joi.array()
			.items(joi.string())
	},
	forClient(obj) {
		// Implement outgoing transformations here
		// obj = _.omit(obj, ['_id', '_rev', '_oldRev'])
		return obj
	},
	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
