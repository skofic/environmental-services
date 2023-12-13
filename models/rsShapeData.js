'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry_hash: joi.string().regex(/^[0-9a-f]{32}$/),
		std_dataset_ids: joi.array().items(joi.string()),
		properties: joi.object({
			geo_shape_area: joi.number(),
			chr_AvElevation: joi.number(),
			chr_StdElevation: joi.number(),
			chr_AvSlope: joi.number(),
			chr_AvAspect: joi.number()
		}).required(),
		geometry: joi.object().required(),
		geometry_bounds: joi.object()
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
};
