/**
 * datasetQuery.js
 *
 * Dataset query model.
 */
'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {

	schema: joi.object({
		// Describe the attributes with joi here
		_key: joi.array()
			.items(joi.string())
			.description("Select by dataset identifiers"),
		_collection_list: joi.object({
			items: joi.array()
				.items(joi.string())
				.required(),
			doAll: joi.boolean()
				.default(false)
				.required()
		})
			.description("Select by database collections"),
		std_project: joi.array()
			.items(joi.string())
			.description("Select by dataset project codes"),
		std_dataset: joi.string()
			.description("Select by dataset code or acronym wildcard"),
		std_dataset_group: joi.array()
			.items(joi.string())
			.description("Select by dataset group codes"),
		std_date_submission: joi.object({
			min: joi.string()
				.regex(/^[0-9]{4,8}$/),
			max: joi.string()
				.regex(/^[0-9]{4,8}$/)
		})
			.or('min','max')
			.description("Select by dataset submission date range"),
		std_date: joi.object({
			std_date_start: joi.string()
				.regex(/^[0-9]{4,8}$/),
			std_date_end: joi.string()
				.regex(/^[0-9]{4,8}$/)
		})
			.or('std_date_start','std_date_end')
			.description("Select by data date range"),
		_title: joi.string()
			.description("Select by space-separated dataset title keywords"),
		_description: joi.string()
			.description("Select by space-separated dataset description keywords"),
		_citation: joi.string()
			.description("Select by space-separated dataset citation keywords"),
		count: joi.object({
			min: joi.number().integer(),
			max: joi.number().integer()
		})
			.or('min','max')
			.description("Select by data records count range"),
		std_terms: joi.object({
			items: joi.array()
				.items(joi.string())
				.required(),
			doAll: joi.boolean()
				.default(false)
				.required()
		})
			.description("Select by data variables"),
		std_terms_key: joi.object({
			items: joi.array()
				.items(joi.string())
				.required(),
			doAll: joi.boolean()
				.default(false)
				.required()
		})
			.description("Select by key fields"),
		std_terms_quant: joi.object({
			items: joi.array()
				.items(joi.string())
				.required(),
			doAll: joi.boolean()
				.default(false)
				.required()
		})
			.description("Select by quantitative data variables"),
	})
		.description("Dataset search parameters"),

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
