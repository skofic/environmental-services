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
		_collection: joi.string()
			.description("The name of the database collection containing the data"),
		std_project: joi.string()
			.required()
			.description("The dataset's project"),
		std_dataset: joi.string()
			.required()
			.description("The dataset's code or acronym"),
		std_dataset_group: joi.string()
			.description("The dataset's project group code"),
		std_date_start: joi.string()
			.regex(/^[0-9]{4, 8}$/)
			.description("Data date dange start"),
		std_date_end: joi.string()
			.regex(/^[0-9]{4, 8}$/)
			.description("Data date dange end"),
		std_date_submission: joi.string()
			.required()
			.regex(/^[0-9]{4,8}$/)
			.description("Dataset submission date"),
		count: joi.number()
			.integer()
			.description("Number of data records in dataset"),
		_subject: joi.string()
			.required()
			.description("Dataset subject"),
		_subjects: joi.array()
			.items(joi.string())
			.description("List of subjects featured in data record descriptors"),
		_classes: joi.array()
			.items(joi.string())
			.description("List of classes featured in data record descriptors"),
		_domain: joi.array()
			.items(joi.string())
			.description("List of domains featured in data record descriptors"),
		_tag: joi.array()
			.items(joi.string())
			.description("List of tags featured in data record descriptors"),
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
		species_list: joi.array()
			.items(joi.string())
			.description("List of species featured in data"),
		std_terms: joi.array()
			.items(joi.string())
			.description("List of descriptors featured in data"),
		std_terms_key: joi.array()
			.items(joi.string())
			.description("Dataset key fields"),
		std_terms_quant: joi.array()
			.items(joi.string())
			.description("List of quantitative descriptors featured in data"),
		std_terms_summary: joi.array()
			.items(joi.string())
			.description("Dataset summary fields"),
		std_dataset_markers: joi.array()
			.optional()
			.items(
				joi.object({
					species: joi.string().required().description("Species"),
					chr_GenIndex: joi.string().required().description("Genetic index descriptor key"),
					chr_MarkerType: joi.string().required().description("Marker type"),
					chr_NumberOfLoci: joi.number().integer().required().description("Number of Loci"),
					chr_SequenceLength: joi.number().integer().optional().description("Sequence length"),
					chr_GenoTech: joi.string().required().description("Method and technologies used")
				})
			)
			.description("Dataset genetic indexes marker combinations")
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
