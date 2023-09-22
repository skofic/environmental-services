'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		// Describe the attributes with joi here
		count: joi.number(),
		std_date_start: joi.string().regex(/^[0-9]+$/),
		std_date_end: joi.string().regex(/^[0-9]+$/),
		std_terms: joi.array().items(joi.string())
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
