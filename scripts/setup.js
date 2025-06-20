'use strict'

///
// Load modules.
///
const {db} = require('@arangodb')
const {context} = require('@arangodb/locals')
const analyzers = require("@arangodb/analyzers");
const {documentCollections, edgeCollections, views} = require('../constants')

///
// Create document collections.
///
for (const [key, collection] of Object.entries(documentCollections))
{
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
			case 'worldclim':
				coll.ensureIndex({
					name: 'idx_geometry',
					type: 'geo',
					fields: ['geometry_bounds'],
					geoJson: true
				})
				coll.ensureIndex({
					name: 'idx_geometry_point',
					type: 'geo',
					fields: ['geometry_point'],
					geoJson: true
				})
				break

			case 'shapes':
			case 'dataset':
			case 'unit_shapes':
			case 'terms':
				break
			
			case 'shape_data':
				coll.ensureIndex({
					name: 'idx_hash_span_date',
					type: 'persistent',
					fields: ['geometry_hash', 'std_date_span', 'std_date'],
					unique: true
				})
				coll.ensureIndex({
					name: 'idx_hash_datasets',
					type: 'persistent',
					fields: ['geometry_hash', 'std_dataset_ids[*]']
				})
				coll.ensureIndex({
					name: 'idx_hash_terms',
					type: 'persistent',
					fields: ['geometry_hash', 'std_terms[*]']
				})
				break
			
			case 'unit_data':
				coll.ensureIndex({
					name: 'idx_unit_span_date',
					type: 'persistent',
					fields: ['gcu_id_number', 'std_date_span', 'std_date'],
					unique: true
				})
				coll.ensureIndex({
					name: 'idx_unit_datasets',
					type: 'persistent',
					fields: ['gcu_id_number', 'std_dataset_ids[*]']
				})
				coll.ensureIndex({
					name: 'idx_unit_terms',
					type: 'persistent',
					fields: ['gcu_id_number', 'std_terms[*]']
				})
				break

			case 'drought_observatory':
				coll.ensureIndex({
					name: 'idx_hash_date',
					type: 'persistent',
					fields: ['geometry_hash', 'std_date'],
					unique: true
				})
				break

			case 'drought_observatory_map':
				coll.ensureIndex({
					name: 'idx_geometry',
					type: 'geo',
					fields: ['geometry'],
					geoJson: true
				})
				break
		}
	} else if (context.isProduction) {
		console.debug(`collection ${collection} already exists. Leaving it untouched.`)
	}
}

///
// Create edge collections.
///
for (const [key, collection] of Object.entries(edgeCollections))
{
	///
	// Handle missing collection.
	///
	if (!db._collection(collection))
	{
		///
		// Create collection.
		//
		const coll = db._createEdgeCollection(collection);
		
		///
		// Create indexes.
		///
		switch(key)
		{
			case 'edges':
				coll.ensureIndex({
					name: 'idx-schema-path-predicate',
					type: 'persistent',
					fields: ['_path[*]', '_predicate'],
					deduplicate: true,
					sparse: false,
					unique: false
				})
				coll.ensureIndex({
					name: 'idx_path_predicate',
					type: 'persistent',
					fields: ['_predicate', '_path[*]'],
					deduplicate: true,
					sparse: false,
					unique: false
				})
				coll.ensureIndex({
					name: 'idx_from_predicate_path',
					type: 'persistent',
					fields: ['_from', '_predicate', '_path[*]'],
					deduplicate: true,
					sparse: false,
					unique: false
				})
				coll.ensureIndex({
					name: 'idx_to_predicate_path',
					type: 'persistent',
					fields: ['_to', '_predicate', '_path[*]'],
					deduplicate: true,
					sparse: false,
					unique: false
				})
				break
			
			case 'links':
				coll.ensureIndex({
					name: 'idx-schema-predicate',
					type: 'persistent',
					fields: ['_predicate'],
					deduplicate: false,
					sparse: false,
					unique: false
				})
				break
		}
	}
	
	else if (context.isProduction) {
		console.debug(`collection ${collection} already exists. Leaving it untouched.`)
	}
}

///
// Create analyzers.
///
var analyzer_name
const db_name = db._name()
analyzer_name = `${db_name}::geojson`
if(analyzers.analyzer(analyzer_name) === null) {
	analyzers.save(
		analyzer_name,
		"geojson",
		{ type: "shape", "legacy": false}
	)
}
analyzer_name = `${db_name}::geojsonpoint`
if(analyzers.analyzer(analyzer_name) === null) {
	analyzers.save(
		analyzer_name,
		"geojson",
		{ type: "point", "legacy": false}
	)
}

///
// Create views.
///
for (const [key, value] of Object.entries(views)) {
	if(db._view(value.name) === null) {
		db._createView(value.name, value.type, value.properties)
	}
}
