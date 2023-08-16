'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const { errors } = require('@arangodb');
const { context } = require('@arangodb/locals');
const createRouter = require('@arangodb/foxx/router');
const Model = require('../models/worldclim');

const collection = context.collection('WorldClim');
const keySchema = joi.string().required()
.description('The key of the worldClim');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

router.tag('worldClim');

router.get(function (req, res) {
  res.send(collection.all());
}, 'list')
.response([Model], 'A list of WorldClimItems.')
.summary('List all WorldClimItems')
.description(dd`
  Retrieves a list of all WorldClimItems.
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
    req.reverse('detail', { key: doc._key })
  ));
  res.send({ ...doc, ...meta });
}, 'create')
.body(Model, 'The worldClim to create.')
.response(201, Model, 'The created worldClim.')
.error(HTTP_CONFLICT, 'The worldClim already exists.')
.summary('Create a new worldClim')
.description(dd`
  Creates a new worldClim from the request body and
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
.response(Model, 'The worldClim.')
.summary('Fetch a worldClim')
.description(dd`
  Retrieves a worldClim by its key.
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
  res.send({ ...doc, ...meta });
}, 'replace')
.pathParam('key', keySchema)
.body(Model, 'The data to replace the worldClim with.')
.response(Model, 'The new worldClim.')
.summary('Replace a worldClim')
.description(dd`
  Replaces an existing worldClim with the request body and
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
.body(joi.object().description('The data to update the worldClim with.'))
.response(Model, 'The updated worldClim.')
.summary('Update a worldClim')
.description(dd`
  Patches a worldClim with the request body and
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
.summary('Remove a worldClim')
.description(dd`
  Deletes a worldClim from the database.
`);
