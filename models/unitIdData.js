'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		gcu_id_number: joi.string()
			.regex(/[A-Z]{3}[0-9]{5}/),
		geometry: joi.object({
			type: joi.string(),
			coordinates: joi.array()
		}),
		geometry_bounds: joi.object({
			type: joi.string(),
			coordinates: joi.array()
		}),
		geometry_hash_list: joi.array()
			.items(
				joi.string()
					.regex(/^[0-9a-f]{32}$/)
			),
		properties: joi.object({
			chr_AvElevation: joi.number(),
			chr_MinElevation: joi.number(),
			chr_MaxElevation: joi.number(),
			chr_StdElevation: joi.number(),
			chr_AvSlope: joi.number(),
			chr_AvAspect: joi.number(),
			geo_shape_area: joi.number()
		})
	},
	forClient(obj) {
		// Implement outgoing transformations here
		obj = _.omit(obj, ['_id', '_rev', '_oldRev']);
		return obj;
	},
	fromClient(obj) {
		// Implement incoming transformations here
		return obj;
	}
}
