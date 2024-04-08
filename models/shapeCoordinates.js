'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		coordinates: joi.array()
			.items(joi.array())
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
