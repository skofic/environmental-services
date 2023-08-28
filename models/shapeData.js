'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry: joi.object().required(),
		geometry_bounds: joi.object(),
		properties: joi.object({
			topography: joi.object({
				geo_shape_aspect: joi.number(),
				geo_shape_elevation: joi.number(),
				geo_shape_elevation_sd: joi.number(),
				geo_shape_slope: joi.number(),
				geo_shape_area: joi.number()
			})
		}).required()
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
