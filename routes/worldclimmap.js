'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const { errors } = require('@arangodb');
const { context } = require('@arangodb/locals');
const createRouter = require('@arangodb/foxx/router');
const Model = require('../models/worldclimmap');

const collection = context.collection('WorldClimMap');
const keySchema = joi.string().required()
.description('The key of the worldClimMap');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;

router.tag('worldClimMap');

router.get(function (req, res) {
  res.send(collection.all());
}, 'list')
.response([Model], 'A list of WorldClimMapItems.')
.summary('List all WorldClimMapItems')
.description(dd`
  Retrieves a list of all WorldClimMapItems.
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
.body(Model, 'The worldClimMap to create.')
.response(201, Model, 'The created worldClimMap.')
.error(HTTP_CONFLICT, 'The worldClimMap already exists.')
.summary('Create a new worldClimMap')
.description(dd`
  Creates a new worldClimMap from the request body and
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
.response(Model, 'The worldClimMap.')
.summary('Fetch a worldClimMap')
.description(dd`
  Retrieves a worldClimMap by its key.
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
.body(Model, 'The data to replace the worldClimMap with.')
.response(Model, 'The new worldClimMap.')
.summary('Replace a worldClimMap')
.description(dd`
  Replaces an existing worldClimMap with the request body and
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
.body(joi.object().description('The data to update the worldClimMap with.'))
.response(Model, 'The updated worldClimMap.')
.summary('Update a worldClimMap')
.description(dd`
  Patches a worldClimMap with the request body and
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
.summary('Remove a worldClimMap')
.description(dd`
  Deletes a worldClimMap from the database.
`);
