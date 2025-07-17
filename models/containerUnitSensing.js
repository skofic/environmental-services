'use strict'

// const _ = require('lodash')
const joi = require('joi')

module.exports = {
	schema: {
		Unit: joi.object({
			'gcu_id_unit-id': joi.string()
				.regex(/[A-Z]{3}[0-9]{9}/),
			gcu_id_number: joi.string()
				.regex(/[A-Z]{3}[0-9]{5}/),
			'gcu_loc_coordinates-restriction': joi.boolean()
				.default(false)
				.required(),
			gcu_loc_climate: joi.object({
				type: joi.string().valid('Point').required(),
				coordinates: joi.array()
					.ordered(
						joi.number().min(-180).max(180).required(),  // Longitude
						joi.number().min(-90).max(90).required()     // Latitude
					)
					.length(2)
					.required()
			}),
			species_list: joi.array()
				.items(joi.string())
		}),
		Sensing: joi.object({
			std_date_span: joi.string()
				.valid(
					"std_date_span_day",
					"std_date_span_week",
					"std_date_span_month",
					"std_date_span_year",
					"std_date_span_range"
				),
			std_date_series: joi.array().items(
				joi.object({
					std_date: joi.string().regex(/^[0-9]{4,8}$/).required(),
					properties: joi.object().required()
				})
			)
		})
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
