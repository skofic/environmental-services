'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		Unit: joi.object(),
		Chelsa: joi.object(),
		WorldClim: joi.object()
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
