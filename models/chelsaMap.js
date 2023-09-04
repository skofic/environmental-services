'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		geometry_hash: joi.string().regex(/^[0-9a-f]{32}$/).required(),
		distance: joi.number(),
		geometry: joi.object().required(),
		geometry_point: joi.object().required()
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
