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
		///
		// Create collection.
		///
		const coll = db._createDocumentCollection(collection)

		///
		// Parse collections to ensure proper indexing.
		///
		switch(key) {
			case 'chelsa':
			case 'chelsa_map':
			case 'climate':
			case 'climate_map':
			case 'worldclim':
			case 'worldclim_map':
			case 'shapes':
				coll.ensureIndex({
					type: 'geo',
					fields: ['geometry'],
					geoJson: true
				})
				break;

			case 'unit_shapes':
				coll.ensureIndex({
					type: 'persistent',
					fields: ['GeometryID']
				})
				break;

			case 'shape_data':
				coll.ensureIndex({
					type: 'persistent',
					fields: ['GeometryID', 'std_span']
				})
				coll.ensureIndex({
					type: 'persistent',
					fields: ['GeometryID', 'std_date']
				})
				coll.ensureIndex({
					type: 'persistent',
					fields: ['std_terms[*]']
				})
				break;
		}
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
