'use strict'

const dd = require('dedent')
const joi = require('joi')
const httpError = require('http-errors')
const status = require('statuses')
const {db, aql, errors} = require('@arangodb')
const {context} = require('@arangodb/locals')
const createRouter = require('@arangodb/foxx/router')
const Model = require('../models/remoteSensing')
const {documentCollections, edgeCollections} = require('../constants')

// const collection = context.collection('Chelsa')
const collection = db._collection(documentCollections.shape_data)
const geometryIdSchema = joi.string().required()
	.description('The key of the geometry record')

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code
const HTTP_NOT_FOUND = status('not found')
const HTTP_CONFLICT = status('conflict')

const router = createRouter()
module.exports = router

router.tag('Remote Sensing')

router.get(':geometryID', function (req, res) {
	const geometryID = req.pathParams.geometryID
	try {
		const result =
			db._query(aql`
				FOR doc IN ${collection}
                    FILTER doc.GeometryID == ${geometryID}
                    SORT doc.std_date
				    LET data = UNSET(doc, '_id', '_key', '_rev', 'GeometryID', 'std_span', 'std_terms')
				    COLLECT resolution = doc.std_span INTO groups KEEP data
				RETURN {
                    std_span: resolution,
                    data: groups[*].data
				}
            `).toArray()
		res.send(result)
	} catch (error) {
		if (error.isArangoError && error.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, error.message)
		}
		throw error
	}
}, 'list')
	.pathParam('geometryID', geometryIdSchema)
	.response(Model, 'The remote sensing data.')
	.summary('Fetch all remote sensing data for the indicated geometry')
	.description(dd`
  Retrieves all the remote sensing data related to the provided geometry identifier.
`)
