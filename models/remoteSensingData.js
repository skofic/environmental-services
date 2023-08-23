'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		// The data is always grouped by date span,
		// the group will have the date span property,
		// and a property called data that will contain
		// all data for that date span.
		// Each data element will have two properties:
		// std_date that contains the date and properties
		// that will contain all properties recorded in that date.
		std_date_span: joi.string()
			.valid('std_date_span_day', 'std_date_span_month', 'std_date_span_year'),
		std_date_series: joi.array()
			.items(joi.object({
				std_date: joi.string(),
				properties: joi.object()
			}))
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
