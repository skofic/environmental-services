'use strict'

///
// Load modules.
///
const {db} = require('@arangodb')
const {documentCollections, edgeCollections} = require('../constants')

///
// Drop collections.
///
for (const collection of documentCollections.concat(edgeCollections)) {
	db._drop(collection)
}
