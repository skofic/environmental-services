'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry_point_radius: joi.number()
			.required(),
		geometry_point:
			joi.object({
				type: joi.string()
					.valid(
						"Point"
					).required(),
				coordinates: joi.array()
					.items(
						joi.number()
					)
					.required()
			}).required(),
		geometry_bounds:
			joi.object({
				type: joi.string()
					.valid(
						"Polygon", "MultiPolygon"
					).required(),
				coordinates: joi.array()
					.items(
						joi.number(),
						joi.array()
					)
					.required()
			}).required(),
		std_dataset_ids: joi.array()
			.items(joi.string()),
		properties: joi.array()
			.items(
				joi.object({
					std_date: joi.string()
						.regex(/^[0-9]{4,8}$/)
						.required()
				})
			)
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
