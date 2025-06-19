'use strict'

/**
 * datasets.js
 *
 * This script contains the routes for the WorldClim climate services.
 */

///
// Load modules.
///
const dd = require('dedent')
const joi = require('joi')
const {aql, db} = require('@arangodb')
const createRouter = require('@arangodb/foxx/router')

///
// Errors.
///
const status = require('statuses')
const httpError = require('http-errors')

//
// Error codes.
//
const HTTP_NOT_FOUND = status('not found');

///
// Query filters.
///
const queryFilters = require('../utils/queryFilters')

//
// Collections.
//
const view_object = db._view(module.context.configuration.viewDataset)
const view_reference = {
	isArangoCollection: true,
	name: () => view_object.name()
}

///
// Models.
///

// Dataset
const Model = require('../models/dataset')
const ModelDescription = dd`
	The dataset record contains the following properties:
	- \`_key\`: The dataset unique identifier.
	- \`_collection_list\`: The database collections containing data.
	- \`std_project\`: Dataset project code.
	- \`std_dataset\`: Dataset code or acronym.
	- \`std_dataset_group\`: Dataset group.
	- \`std_date_submission\`: Dataset submission date.
	- \`std_date_start\`: Data date range start.
	- \`std_date_edd\`: Data date range end.
	- \`_title\`: Dataset title.
	- \`_description\`: Dataset description.
	- \`_citation\`: Required citations.
	- \`_url\`: List of links.
	- \`count\`: Number of data records.
	- \`std_terms\`: List of variables featured in data.
	- \`std_terms_key\`: List of key fields.
	- \`std_terms_quant\`: List of quantitative variables featured in data.
	- \`std_dataset_scope\`: Dataset scope.
	- \`std_dataset_extent\`: Dataset extent.`

// Query
const ModelQuery = require('../models/datasetQuery')
const ModelQueryDescription = dd`
	The body is an object that contains the query parameters:
	- \`_key\`: Provide a list of matching dataset unique identifiers.
	- \`_collection_list\`: The database collections containing data.
	- \`std_project\`: Provide a list of matching project codes.
	- \`std_dataset\`: Provide a wildcard search string for the dataset code.
	- \`std_dataset_group\`: Provide a list of matching dataset group codes.
	- \`std_date_submission\`: Dataset submission date range, provide start and end dates.
	- \`std_date\`: Data date range, provide search values for start and end dates.
	- \`_title\`: Provide space delimited keywords to search dataset title.
	- \`_description\`: Provide space delimited keywords to search dataset description.
	- \`_citation\`: Provide space delimited keywords to search dataset citations.
	- \`count\`: Provide data records count range.
	- \`std_terms\`: Provide list of featured variables in the dataset with all or any selector.
	- \`std_terms_key\`: Provide list of dataset key fields with all or any selector.
	- \`std_terms_quant\`: Provide list of featured quantitative variables in the dataset with all or any selector.
	Omit the properties that you don't want to search on.`

// Operation chaining
const opSchema = joi.string()
	.valid("AND", "OR")
	.default("AND")
	.required()
	.description('Chaining operator for query filters')


////
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Dataset')


/**
 * SERVICES
 */


/**
 * Query datasets.
 *
 * The service allows selecting datasets based on a series of selection criteria,
 * it will return the list of matching dataset objects.
 */
router.post(
	'query',
	(req, res) => {
		try{
			res.send(searchDatasetObjects(req, res))
		} catch (error) {
			throw error                                                         // ==>
		}
	},
	'queryDatasetObjects'
)
	.summary('Query datasets')
	.description(dd`
		Retrieve dataset objects based on a set of query parameters, fill body \
		with selection criteria and the service will return matching list of \
		dataset objects.
	`)

	.queryParam('op', opSchema)
	.body(ModelQuery, ModelQueryDescription)
	.response([Model], ModelDescription)


/**
 * HANDLERS
 */


/**
 * Search datasets and return matching objects.
 *
 * This service allows querying datasets based on a set oc search criteria,
 * and will return the matching dataset objects.
 *
 * @param request
 * @param response
 * @returns {[Object]}
 */
function searchDatasetObjects(request, response)
{
	///
	// Get chain operator.
	///
	const op = request.queryParams.op

	///
	// Get query filters.
	//
	const filters = datasetQueryFilters(request, response)
	if(filters.length === 0) {
		return []                                                               // ==>
	}

	///
	// Build filters block.
	///
	const query = aql`
		FOR doc IN ${view_reference}
			SEARCH ${aql.join(filters, ` ${op} `)}
		RETURN doc
	`

	///
	// Query.
	///
	return db._query(query).toArray()                                           // ==>

} // searchDatasetObjects()


/**
 * UTILITIES
 */


/**
 * Return dataset query filters.
 *
 * This function will return the list of filters needed to query datasets.
 *
 * @param request {Object}: Service request.
 * @param response {Object}: Service response.
 * @returns {[String]}: Array of AQL filter conditions.
 */
function datasetQueryFilters(request, response)
{
	///
	// Iterate body properties.
	///
	const filters = []
	for(const [key, value] of Object.entries(request.body)) {
		///
		// Parse body properties.
		///
		let filter = null
		switch(key) {
			case '_key':
			case 'std_project':
			case'std_dataset_group':
				filter = queryFilters.filterList(key, value)
				break

			case'std_dataset':
				filter = queryFilters.filterPattern(key, value)
				break

			case '_title':
			case '_description':
				filter = queryFilters.filterTokens(`${key}.iso_639_3_eng`, value, 'text_en')
				break

			case '_citation':
				filter = queryFilters.filterTokens(key, value, 'text_en')
				break

			case 'std_date':
			case 'std_date_submission':
				filter = queryFilters.filterDateRange(value)
				break

			case 'count':
				filter = queryFilters.filterIntegerRange(key, value)
				break
			
			case'_collection_list':
			case 'std_terms':
			case 'std_terms_key':
			case 'std_terms_summary':
			case 'std_terms_quant':
				filter = queryFilters.filterLists(key, value, value.doAll)
				break
		}

		///
		// Add clause.
		///
		if(filter !== null) {
			filters.push(filter)
		}
	}

	return filters                                                      // ==>

} // datasetQueryFilters()
