'use strict'

///
// Load modules.
///
const {db} = require('@arangodb')
const {context} = require('@arangodb/locals')

///
// Document collection names.
///
const documentCollections = [
	"Chelsa",
	"ChelsaMap",
	"Climate",
	"ClimateMap",
	"Shapes",
	"ShapeData",
	"UnitShapes",
	"WorldClim",
	"WorldClimMap"
];

///
// Edge collection names.
///
const edgeCollections = [];

///
// Create document collections.
///
for (const localName of documentCollections) {
	if (!db._collection(localName)) {
		db._createDocumentCollection(localName);
	} else if (context.isProduction) {
		console.debug(`collection ${localName} already exists. Leaving it untouched.`)
	}
}

///
// Create edge collections.
///
for (const localName of edgeCollections) {
	if (!db._collection(localName)) {
		db._createEdgeCollection(localName);
	} else if (context.isProduction) {
		console.debug(`collection ${localName} already exists. Leaving it untouched.`)
	}
}
