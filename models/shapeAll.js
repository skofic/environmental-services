'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry:
			joi.object({
				type: joi.string()
					.valid(
						"Point", "MultiPoint",
						"Polygon", "MultiPolygon",
						"LineString", "MultiLineString"
					).required(),
				coordinates: joi.array()
					.items(
						joi.number(),
						joi.array())
					.required()
			}).required(),
		start: joi.number().default(0),
		limit: joi.number().default(10)
	},
	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, ['_id', '_rev', '_oldRev'])
		return obj
	},
	fromClient(obj) {
		// Implement incoming transformations here
		return obj
	}
}
