'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		reference:
			joi.alternatives()
				.try(
					joi.array().items(joi.number()).required(),
					joi.object({
						type: joi.string()
							.valid(
								"Point", "MultiPoint",
								"LineString", "MultiLineString",
								"Polygon", "MultiPolygon"
							).required(),
						geometry: joi.array().items(joi.number()).required()
					}).required()
				)
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
