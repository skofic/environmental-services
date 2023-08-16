'use strict'

///
// Load modules.
///
const {db} = require('@arangodb')
const {context} = require('@arangodb/locals')
const {documentCollections, edgeCollections} = require('../constants')

///
// Create document collections.
///
for (const [key, collection] of Object.entries(documentCollections)) {
	if (!db._collection(collection)) {
		db._createDocumentCollection(collection);
	} else if (context.isProduction) {
		console.debug(`collection ${collection} already exists. Leaving it untouched.`)
	}
}

///
// Create edge collections.
///
for (const [key, collection] of Object.entries(edgeCollections)) {
	if (!db._collection(collection)) {
		db._createEdgeCollection(collection);
	} else if (context.isProduction) {
		console.debug(`collection ${collection} already exists. Leaving it untouched.`)
	}
}
