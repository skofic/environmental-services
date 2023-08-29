'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		gcu_id_number: joi.string()
			.regex(/[A-Z]{3}[0-9]{5}/),
		'gcu_id_unit-id': joi.string()
			.regex(/[A-Z]{3}[0-9]{9}/),
		geometry_hash_list: joi.array()
			.items(
				joi.string()
					.regex(/^[0-9a-f]{32}$/)
			)
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
