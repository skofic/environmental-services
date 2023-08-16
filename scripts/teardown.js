'use strict'

///
// Load modules.
///
const {db} = require('@arangodb')
const {context} = require('@arangodb/locals')

///
// Document collection names.
///
const collections = [
	"Chelsa",
	"ChelsaMap",
	"Climate",
	"ClimateMap",
	"Shapes",
	"ShapeData",
	"UnitShapes",
	"WorldClim",
	"WorldClimMap"
]

///
// Drop collections.
///
for (const localName of collections) {
	db._drop(localName)
}
