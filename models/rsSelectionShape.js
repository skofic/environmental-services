'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry_hash: joi.array()
			.items(
				joi.string()
					.regex(/^[0-9a-f]{32}$/)
			),
		std_dataset_ids: joi.array()
			.items(joi.string()),
		geo_shape_area: joi.object({
			min: joi.number(),
			max: joi.number()
		}),
		chr_AvElevation: joi.object({
			min: joi.number(),
			max: joi.number()
		}),
		chr_StdElevation: joi.object({
			min: joi.number(),
			max: joi.number()
		}),
		chr_AvSlope: joi.object({
			min: joi.number(),
			max: joi.number()
		}),
		chr_AvAspect: joi.object({
			min: joi.number(),
			max: joi.number()
		}),
		intersects: joi.object(),
		distance: joi.object({
			reference: joi.object()
				.required(),
			range: joi.object({
				min: joi.number(),
				max: joi.number()
			}),
		}),
		paging: joi.object({
			offset: joi.number()
				.integer()
				.min(0)
				.default(0),
			limit: joi.number()
				.integer()
				.min(1)
				.default(100)
		})
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
