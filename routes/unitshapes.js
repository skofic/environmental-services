'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const {errors, aql, db} = require('@arangodb');
const {context} = require('@arangodb/locals');
const createRouter = require('@arangodb/foxx/router');
const Model = require('../models/unitshape');

// const collection = context.collection('UnitShapes');
const collection = db._collection('UnitShapes');
const keySchema = joi.string().required()
	.description('The key of the unitShape');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

router.tag('unitShape');

router.get(function (req, res) {
	// res.send(collection.all());
	const result = db._query(aql`
      FOR doc IN UnitShapes
        LIMIT 10
      RETURN {_key: doc._key}
    `).toArray()
  res.send(result)
}, 'list')
	.response([Model], 'A list of UnitShapes.')
	.summary('List all UnitShapes')
	.description(dd`
  Retrieves a list of all UnitShapes.
`);

router.post(function (req, res) {
	const doc = req.body;
	let meta;
	try {
		meta = collection.save(doc);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
			throw httpError(HTTP_CONFLICT, e.message);
		}
		throw e;
	}
	res.status(201);
	res.set('location', req.makeAbsolute(
		req.reverse('detail', {key: doc._key})
	));
	res.send({...doc, ...meta});
}, 'create')
	.body(Model, 'The unitShape to create.')
	.response(201, Model, 'The created unitShape.')
	.error(HTTP_CONFLICT, 'The unitShape already exists.')
	.summary('Create a new unitShape')
	.description(dd`
  Creates a new unitShape from the request body and
  returns the saved document.
`);

router.get(':key', function (req, res) {
	const key = req.pathParams.key;
	let doc;
	try {
		doc = collection.document(key);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		throw e;
	}
	res.send(doc);
}, 'detail')
	.pathParam('key', keySchema)
	.response(Model, 'The unitShape.')
	.summary('Fetch a unitShape')
	.description(dd`
  Retrieves a unitShape by its key.
`);

router.put(':key', function (req, res) {
	const key = req.pathParams.key;
	const doc = req.body;
	let meta;
	try {
		meta = collection.replace(key, doc);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
			throw httpError(HTTP_CONFLICT, e.message);
		}
		throw e;
	}
	res.send({...doc, ...meta});
}, 'replace')
	.pathParam('key', keySchema)
	.body(Model, 'The data to replace the unitShape with.')
	.response(Model, 'The new unitShape.')
	.summary('Replace a unitShape')
	.description(dd`
  Replaces an existing unitShape with the request body and
  returns the new document.
`);

router.patch(':key', function (req, res) {
	const key = req.pathParams.key;
	const patchData = req.body;
	let doc;
	try {
		collection.update(key, patchData);
		doc = collection.document(key);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
			throw httpError(HTTP_CONFLICT, e.message);
		}
		throw e;
	}
	res.send(doc);
}, 'update')
	.pathParam('key', keySchema)
	.body(joi.object().description('The data to update the unitShape with.'))
	.response(Model, 'The updated unitShape.')
	.summary('Update a unitShape')
	.description(dd`
  Patches a unitShape with the request body and
  returns the updated document.
`);

router.delete(':key', function (req, res) {
	const key = req.pathParams.key;
	try {
		collection.remove(key);
	} catch (e) {
		if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
			throw httpError(HTTP_NOT_FOUND, e.message);
		}
		throw e;
	}
}, 'delete')
	.pathParam('key', keySchema)
	.response(null)
	.summary('Remove a unitShape')
	.description(dd`
  Deletes a unitShape from the database.
`);
