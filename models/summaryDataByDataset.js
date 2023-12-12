'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		count: joi.number(),
		std_date_start: joi.string()
			.regex(/^[0-9]{4,8}$/)
			.required(),
		std_date_end: joi.string()
			.regex(/^[0-9]{4,8}$/)
			.required(),
		std_terms: joi.array()
			.items(joi.string())
			.required(),
		std_dataset_id: joi.string()
			.required(),
		geometry_point_radius: joi.array()
			.items(joi.number())
			.required(),
		geometry_point: joi.array()
			.items(
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
				})
			)
			.required(),
		geometry_bounds: joi.array()
			.items(
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
				})
			)
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
