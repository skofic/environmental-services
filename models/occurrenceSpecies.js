'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		// Describe the attributes with joi here
		species_list: joi.array()
			.items(joi.string())
			.required()
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
