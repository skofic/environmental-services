'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		// Describe the attributes with joi here
		gcu_id_number: joi.string(),
		properties: joi.array()
			.items(
				joi.object({
					count: joi.number()
						.integer(),
					std_date_span: joi.string()
						.valid(
							'std_date_span_day',
							'std_date_span_month',
							'std_date_span_year'
						),
					std_date_start: joi.string()
						.regex(/^[0-9]{4, 8}$/),
					std_date_end:  joi.string()
						.regex(/^[0-9]{4, 8}$/),
					std_terms: joi.array()
						.items(joi.string()),
					std_dataset_ids: joi.array()
						.items(joi.string())
				})
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
};
