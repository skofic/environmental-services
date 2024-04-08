'use strict'

/**
 * shapeHashes.js
 *
 * This script contains the routes for the Genetic Conservation Unit Shapes data services.
 */

///
// Load modules.
///
const dd = require('dedent')
const joi = require('joi')
const {aql, db} = require('@arangodb')
const createRouter = require('@arangodb/foxx/router')

///
// Collections and models.
///
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
const ModelResponse = require('../models/hashResponse')
const ModelResponseDescription =
'The service will return an object with the following properties:\n\n' +
'- `geometry`: The resulting geometry.\n' +
'- `geometry_hash`: The resulting geometry hash.'
const ModelCoordinates = require('../models/shapeCoordinates')
const PolygonShapeDescription = `
Polygon shape coordinates.

The polygon shape should be provided at least as one array representing a linear ring.
Each linear ring should consist of an array with at least four longitude/latitude pairs.
The first linear ring must be the outermost, while any subsequent linear ring will be interpreted as holes.

The order of the sequence of coordinates is important: counter-clock means the polygon area is inside,
clockwise means the are of the polygon is outside.

Simple Polygon:
\`
{
  "coordinates": [
    [0.0, 0.0], [7.5, 2.5], [0.0, 5.0], [0.0, 0.0]
  ]
}
\`

Polygon with holes:
\`
{
  "coordinates": [
    [[35, 10], [45, 45], [15, 40], [10, 20], [35, 10]],
    [[20, 30], [30, 20], [35, 35], [20, 30]]
  ]
}
\`
`
const MultiPolygonShapeDescription = `
MultiPolygon shape coordinates.

The MultiPolygon shape should be provided as an array of Polygon shapes.
The polygon shape should be provided at least as one array representing a linear ring.
Each linear ring should consist of an array with at least four longitude/latitude pairs.
The first linear ring must be the outermost, while any subsequent linear ring will be interpreted as holes.

The order of the sequence of coordinates is important: counter-clock means the polygon area is inside,
clockwise means the are of the polygon is outside.

Example:
\`
{
  "coordinates": [
    [
        [[40, 40], [20, 45], [45, 30], [40, 40]]
    ],
    [
        [[20, 35], [10, 30], [10, 10], [30, 5], [45, 20], [20, 35]],
        [[30, 20], [20, 15], [20, 25], [30, 20]]
    ]
  ]
}
\`
`

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Create shape hashes')


/**
 * Return the shape hash for the provided point.
 *
 * This service will return the shape hash corresponding to the provided coordinates.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 **/
router.get(':lat/:lon', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Build query.
	//
	const query = aql`
		LET shape = GEO_POINT(${lon}, ${lat})
		RETURN {
			geometry: shape,
			geometry_hash: MD5(TO_STRING(shape))
		}
	`

	///
	// Perform service.
	///
	try
	{
		///
		// Perform query.
		///
		res.send(
			db._query(query)
				.toArray()
		)
	}
	catch (error) {
		throw error;
	}

}, 'string')

	///
	// Path parameter schemas.
	///
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelResponse], ModelResponseDescription)

	///
	// Summary.
	///
	.summary('Get provided point shape hash')

	///
	// Description.
	///
	.description(dd`
		The service will return the shape hash related to the provided point coordinates.
	`)

/**
 * Return shape hash for the provided polygon.
 *
 * This service will return the shape hash related to the provided polygon.
 * The polygon shape should be provided at least as one array representing
 * a linear ring. Each linear ring should consist of an array with at least
 * four longitude/latitude pairs. The first linear ring must be the outermost,
 * while any subsequent linear ring will be interpreted as holes. The order of
 * the sequence of coordinates is important: counter-clock means the polygon area
 * is inside, clockwise means the are of the polygon is outside.
 *
 * Examples:
 *
 * Simple polygon:
 * [0.0, 0.0], [7.5, 2.5], [0.0, 5.0], [0.0, 0.0]
 *
 * Polygon with a hole inside:
 * [ [35, 10], [45, 45], [15, 40], [10, 20], [35, 10] ],
 * [ [[20, 30], [30, 20], [35, 35], [20, 30] ]
 **/
router.post('poly', function (req, res)
{

	///
	// Parameters.
	///
	const reference = req.body.coordinates
	const test = { "type": "Polygon", "coordinates": reference}

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			LET shape = GEO_POLYGON(${reference})
			RETURN {
				geometry: shape,
				geometry_hash: MD5(TO_STRING(shape))
			}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result)

}, 'list')

	///
	// Body parameters.
	///
	.body(ModelCoordinates, PolygonShapeDescription)

	///
	// Response schema.
	///
	.response([ModelResponse], ModelResponseDescription)

	///
	// Summary.
	///
	.summary('Get provided polygon shape hash')

	///
	// Description.
	///
	.description(dd`
		The service will return the shape hash related to the provided polygon coordinates.
	`)

/**
 * Return shape hash for the provided multi-polygon.
 *
 * This service will return the shape hash related to the provided multi-polygon.
 * The multi-polygon shape should be provided as an array of polygon shapes.
 * A polygon shape should be provided at least as one array representing
 * a linear ring. Each linear ring should consist of an array with at least
 * four longitude/latitude pairs. The first linear ring must be the outermost,
 * while any subsequent linear ring will be interpreted as holes. The order of
 * the sequence of coordinates is important: counter-clock means the polygon area
 * is inside, clockwise means the are of the polygon is outside.
 *
 * Example:
 *
 * MultiPolygon comprised of a simple polygon and a polygon with holes:
 * [
 *     [ [40, 40], [20, 45], [45, 30], [40, 40] ]
 * ],
 * [
 *     [ [35, 10], [45, 45], [15, 40], [10, 20], [35, 10] ],
 *     [ [[20, 30], [30, 20], [35, 35], [20, 30] ]
 * ]
 */
router.post('multipoly', function (req, res)
{
	///
	// Parameters.
	///
	const reference = req.body.coordinates

	///
	// Perform service.
	///
	let result
	try {
		result = db._query(aql`
			LET shape = GEO_MULTIPOLYGON(${reference})
			RETURN {
				geometry: shape,
				geometry_hash: MD5(TO_STRING(shape))
			}
        `).toArray()
	}

	///
	// Handle errors.
	///
	catch (error) {
		throw error;
	}

	///
	// Return result.
	///
	res.send(result)

}, 'list')

	///
	// Body parameters.
	///
	.body(ModelCoordinates, MultiPolygonShapeDescription)

	///
	// Response schema.
	///
	.response([ModelResponse], ModelResponseDescription)

	///
	// Summary.
	///
	.summary('Get provided multi-polygon shape hash')

	///
	// Description.
	///
	.description(dd`
		The service will return the shape hash related to the provided multi-polygon coordinates.
	`)
