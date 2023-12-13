'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		std_date: joi.string()
			.regex(/^[0-9]{4, 8}$/)
			.required(),
		properties: joi.object()
			.required(),
		std_dataset_ids: joi.array()
			.items(joi.string())
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
