/**
 * dataset.js
 *
 * Dataset model.
 */
'use strict'

const _ = require('lodash')
const joi = require('joi')

module.exports = {

	schema: joi.object({
		// Describe the attributes with joi here
		_key: joi.string()
			.optional()
			.description("The key of the dataset"),
		_collection_list: joi.array()
			.items(joi.string())
			.description("The name of the database collection containing the data"),
		std_project: joi.string()
			.required()
			.description("The dataset's project"),
		std_dataset: joi.string()
			.required()
			.description("The dataset's code or acronym"),
		std_dataset_group: joi.string()
			.description("The dataset's project group code"),
		std_date_submission: joi.string()
			.required()
			.regex(/^[0-9]{4,8}$/)
			.description("Dataset submission date"),
		std_date_start: joi.string()
			.regex(/^[0-9]{4, 8}$/)
			.description("Data date dange start"),
		std_date_end: joi.string()
			.regex(/^[0-9]{4, 8}$/)
			.description("Data date dange end"),
		_title: joi.object({
			iso_639_3_eng: joi.string().required()
		})
			.required()
			.description("Dataset title"),
		_description: joi.object({
			iso_639_3_eng: joi.string().required()
		})
			.required()
			.description("Dataset description"),
		_citation: joi.array()
			.items(joi.string())
			.description("Required citations"),
		_url: joi.array()
			.items(joi.string())
			.description("List of references"),
		count: joi.number()
			.integer()
			.description("Number of data records in dataset"),
		std_terms: joi.array()
			.items(joi.string())
			.description("List of descriptors featured in data"),
		std_terms_key: joi.array()
			.items(joi.string())
			.description("Dataset key fields"),
		std_terms_quant: joi.array()
			.items(joi.string())
			.description("List of quantitative descriptors featured in data"),
		std_dataset_scope: joi.string()
			.description("The dataset scope"),
		std_dataset_extent: joi.string()
			.description("The dataset extent")
	}).unknown(true),

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
