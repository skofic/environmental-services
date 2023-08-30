'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry:
			joi.object({
				type: joi.string()
					.valid(
						"Polygon", "MultiPolygon"
					).required(),
				coordinates: joi.array()
					.items(
						joi.number(),
						joi.array())
					.required()
			}).required(),
		species_list: joi.array()
			.items(joi.string())
			.required()
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
