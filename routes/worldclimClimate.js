'use strict'

/**
 * worldclimClimate.js
 *
 * This script contains the routes for the WorldClim climate services.
 */

///
// Load modules.
///
const dd = require('dedent')
const joi = require('joi')
const {aql, db} = require('@arangodb')
const createRouter = require('@arangodb/foxx/router')

///
// Collections.
///
const collection_data = db._collection(module.context.configuration.collectionWorldClim)

///
// Models.
///
const ModelShape = require("../models/shapeAll");
const ModelShapeContains = require("../models/shapePoly");
const ModelClick = require('../models/click')
const ModelRecord = require('../models/climate')

const whatSchema = joi.string().valid('KEY', 'SHAPE', 'DATA', 'MIN', 'AVG', 'MAX', 'STD', 'VAR')
	.required()
	.description(`
Return a *selection* of records:

- \`KEY\`: Return *only* the record *primary keys*.
- \`SHAPE\`: Return the record *primary keys* and *geometries*.
- \`DATA\`: Return the record *primary keys*, *geometries* and *data properties*.

Return *one record* containing the selection's quantitative data *aggregation*:

- \`MIN\`: *Minimum*.
- \`AVG\`: *Mean*.
- \`MAX\`: *Maximum*.
- \`STD\`: *Standard deviation*.
- \`VAR\`: *Variance*.
`)
const minDistanceSchema = joi.number().required()
	.description('*Minimum* distance *inclusive* in *meters*.')
const maxDistanceSchema = joi.number().required()
	.description('*Maximum* distance *inclusive* in *meters*.')
const sortSchema = joi.string().valid('NO', 'ASC', 'DESC').required()
	.description(`
Results selection *sort* order:

- \`NO\`: *No sorting*
- \`ASC\`: Sort in *ascending* order.
- \`DESC\`: Sort in *descending* order.

This parameter is only relevant for *selection of records* result, you can ignore it when *aggregating*.
	`)
const latSchema = joi.number().min(-90).max(90)
	.required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180)
	.required()
	.description('Coordinate decimal longitude.')

///
// Descriptions.
///
const DescriptionModelClick = `
The service returns the following data record:

- \`geometry_hash\`: The record primary key.
- \`geometry_point\`: The GeoJSON point corresponding to the center of the data bounding box.
- \`geometry_bounds\`: The data bounding box as a GeoJSON polygon.
- \`properties\`: The data properties.
`
const DescriptionModelDistance = `
The service body record contains the following properties:

- \`geometry\`: The *GeoJSON geometry* whose *wgs84 centroid* is compared \
with the *WorldClim measurement wgs84 centroids* to determine the *distance*. \
It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* \
or *MultiPolygon*. *This parameter is required*.
- \`start\`: The zero-based *start index* of the returned *selection*. \
The property is relevant only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`, \
if omitted it defaults to 0.
- \`limit\`: The *number of records* to return. \
The property is relevant only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`.
`
const DescriptionModelContains = `
The service body record contains the following properties:

- \`geometry\`: The *GeoJSON geometry* that *fully contains* the *wgs84 centroids* \
of the *WorldClim measurements*. It may be a *Polygon* or *MultiPolygon*. \
*This parameter is required*.
- \`start\`: The zero-based *start index* of the returned *selection*. \
The property is relevant only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`, \
if omitted it defaults to 0.
- \`limit\`: The *number of records* to return. \
The property is relevant only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`.
`
const DescriptionModelIntersects = `
The service body record contains the following properties:

- \`geometry\`: The *GeoJSON geometry* that is used to *select* all \
*measurement areas* that *intersect* with it. It may be a *Point*, \
*MultiPoint*, *LineString*, *MultiLineString*, *Polygon* \
or *MultiPolygon*. *This parameter is required*.
- \`start\`: The zero-based *start index* of the returned *selection*. \
The property is relevant only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`, \
if omitted it defaults to 0.
- \`limit\`: The *number of records* to return. \
The property is relevant only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`.
`
const DescriptionModelRecord = `
WorldClim records.

The service will return *one* or *more* records structured as follows:

- \`count\`: The *number of records* in the current *selection*, only provided for *aggregated data requests*.
- \`geometry_hash\`: The record *primary key*, which corresponds to the *MD5 hash* of the *GeoJSON point geometry*, \`geometry_point\`.
- \`distance\`: The distance, in *meters*, between the *provided reference geometry* and the *selected WorldClim records*. This property is only provided by services that *select records* based on a *distance range*.
- \`geometry_point\`: The *GeoJSON point geometry* corresponding to the *centroid* of the *data bounding box*.
- \`geometry_bounds\`: The *GeoJSON polygon geometry* corresponding the *data bounding box*.
- \`properties\`: The WorldClim *data properties*.

The \`what\` path parameter defines what *type of result* the service should return. This can be a *selection of records*, or a *single record* containing the selection values aggregate.

*Selection of records*:

- \`KEY\`: The service will return the selection's \`geometry_hash\` values.
- \`SHAPE\`: The service will return the selection's \`geometry_hash\`, \`geometry_point\` and \`geometry_bounds\`.
- \`DATA\`: The service will return the selection's \`geometry_hash\`, \`geometry_point\`, \`geometry_bounds\`, and \`properties\`.

*Aggregated data requests* return a *single record* containing the selection's element \`count\`, and \`properties\` that contains the *aggregation* of the selection's *quantitative values*:

- \`MIN\`: The *minimum*.
- \`AVG\`: The *average*.
- \`MAX\`: The *maximum*.
- \`STD\`: The *standard deviation*.
- \`VAR\`: The *variance*.
`
const DescriptionDistance = `
The service will select all WorldClim records that lie within a \
*distance range* from the *reference geometry*. \
The distance is calculated from the *wgs84 centroids* of both \
the *reference geometry* and the *shape geometry*.

The service expects the following *query path parameters*:

- \`what\`: This *required* parameter determines the *type* of *service result*: \
\`KEY\`, \`SHAPE\` and \`DATA\` for a *selection of records*, \
and \`MIN\`, \`AVG\`, \`MAX\`, \`STD\` or \`VAR\` for the selection's \
quantitative *data aggregation*.
- \`min\`: This *required* parameter represents the range's *minimum distance*. The value is inclusive.
- \`max\`: This *required* parameter represents the range's *maximum distance*. The value is inclusive.
- \`sort\`: This *optional* parameter determines whether results should be *sorted* and in what *order*. \
The parameter is required only when the \`what\` parameter is \`KEY\`, \`SHAPE\` or \`DATA\`. \
The sort order is determined by the *distance*.

And the following *body parameters*:

- \`geometry\`: This parameter represents the *reference geometry* whose *centroid* \
will be used to select all WorldClim records *within* the provided *distance range*.
- \`start\`: *Initial record index*, zero based, for returned selection of records.
- \`limit\`: *Number of records* to return.
`
const DescriptionContains = `
The service will select all WorldClim records whose *measurement area centroid* is \
*fully contained* by the *provided reference geometry*. This means that the \
measurement is located in the point at the center of the measurement area.

The service expects the following *query path parameter*:

- \`what\`: This *required* parameter determines the *type* of *service result*: \
\`KEY\`, \`SHAPE\` and \`DATA\` for a *selection of records*, \
and \`MIN\`, \`AVG\`, \`MAX\`, \`STD\` or \`VAR\` for the selection's \
quantitative *data aggregation*.

And the following *body parameters*:

- \`geometry\`: This parameter represents the *reference geometry* that fully \
contains the *measurement area centroids*, in *GeoJSON format*.
- \`start\`: *Initial record index*, zero based, for returned selection of records.
- \`limit\`: *Number of records* to return.
`
const DescriptionIntersects = `
The service will select all WorldClim records whose *data bounds* intersect \
with the *provided reference geometry*.

The service expects the following *query path parameter*:

- \`what\`: This *required* parameter determines the *type* of *service result*: \
\`KEY\`, \`SHAPE\` and \`DATA\` for a *selection of records*, \
and \`MIN\`, \`AVG\`, \`MAX\`, \`STD\` or \`VAR\` for the selection's \
quantitative *data aggregation*.

And the following *body parameters*:

- \`geometry\`: This parameter represents the *reference geometry* \
in *GeoJSON format*. It will be used to select all records whose \
measurement areas intersect with it.
- \`start\`: *Initial record index*, zero based, for returned selection of records.
- \`limit\`: *Number of records* to return.
`


///
// Utils.
///
const {
	WorldClimDistanceAQL,
	WorldClimContainsAQL,
	WorldClimIntersectsAQL
} = require('../utils/worldclimAggregateAQL')

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('WorldClim')


/**
 * Return the WorldClim data record that contains the provided point.
 *
 * This service will return the WorldClim record that contains the provided coordinate.
 *
 * Parameters:
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 **/
router.get('click', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.queryParams.lat
	const lon = req.queryParams.lon

	///
	// Build query.
	//
	let query = aql`
		FOR dat IN ${collection_data}
			FILTER GEO_INTERSECTS(
				GEO_POINT(${lon}, ${lat}),
				dat.geometry_bounds
			)
		RETURN {
			geometry_hash: dat._key,
			geometry_point: dat.geometry_point,
			geometry_bounds: dat.geometry_bounds,
			properties: dat.properties
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

}, 'list')

	///
	// Path parameter schemas.
	///
	.queryParam('lat', latSchema)
	.queryParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelClick], DescriptionModelClick)

	///
	// Summary.
	///
	.summary('Contains point')

	///
	// Description.
	///
	.description(dd`
		The service will return the WorldClim data record that contains the provided coordinates.
	`)

/**
 * Return the WorldClim data records found within the provided distance.
 *
 * This service will return the WorldClim records whose distance to the provided reference
 * geometry is larger or equal to the provided minimum distance and smaller or equal to
 * the provided maximum distance.
 *
 * The distance is calculated from the centroid of the provided reference geometry to the
 * centroids of the WorldClim records.
 *
 * Parameters:
 * - `:what`: The result type, `KEY` only geometry key, `SHAPE` key and geometry, `DATA` properties, `MIN` minimum, `AVG` average, `MAX` maximum, `STD` standard deviation, `VAR` variance.
 * - `:min`: The minimum distance inclusive.
 * - `:max`: The maximum distance inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('dist', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.queryParams.what
	const min = req.queryParams.min
	const max = req.queryParams.max
	const sort = req.queryParams.sort

	///
	// Body parameters.
	///
	const reference = req.body.geometry
	const start = (req.body.hasOwnProperty('start')) ? req.body.start : null
	const limit = (req.body.hasOwnProperty('limit')) ? req.body.limit : null

	///
	// Build query.
	//
	let query =
		WorldClimDistanceAQL(
			collection_data,
			reference,
			what,
			min,
			max,
			sort,
			start,
			limit
		)

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

}, 'list')

	///
	// Path parameter schemas.
	///
	.queryParam('what', whatSchema)
	.queryParam('min', minDistanceSchema)
	.queryParam('max', maxDistanceSchema)
	.queryParam('sort', sortSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, DescriptionModelDistance)

	///
	// Response schema.
	///
	.response([ModelRecord], DescriptionModelRecord)

	///
	// Summary.
	///
	.summary('Is within distance')

	///
	// Description.
	///
	.description(DescriptionDistance)

/**
 * Return all WorldClim data points fully contained by the provided reference geometry.
 *
 * This service will return all the occurrence records whose centroids are fully contained
 * by the provided reference geometry, the latter may be a Polygon or MultiPolugon.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('contain', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.queryParams.what

	///
	// Body parameters.
	///
	const reference = req.body.geometry
	const start = (req.body.hasOwnProperty('start')) ? req.body.start : null
	const limit = (req.body.hasOwnProperty('limit')) ? req.body.limit : null

	///
	// Build query.
	//
	let query =
		WorldClimContainsAQL(
			collection_data,
			reference,
			what,
			start,
			limit
		)

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

}, 'list')

	///
	// Path parameter schemas.
	///
	.queryParam('what', whatSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShapeContains, DescriptionModelContains)

	///
	// Response schema.
	///
	.response([ModelRecord], DescriptionModelRecord)

	///
	// Summary.
	///
	.summary('Is contained')

	///
	// Description.
	///
	.description(DescriptionContains)

/**
 * Return all WorldClim data points that intersect with the provided reference geometry.
 *
 * This service will return all the WorldClim data points which intersect
 * with the provided reference geometry.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('intersect', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.queryParams.what

	///
	// Body parameters.
	///
	const reference = req.body.geometry
	const start = (req.body.hasOwnProperty('start')) ? req.body.start : null
	const limit = (req.body.hasOwnProperty('limit')) ? req.body.limit : null

	///
	// Build query.
	//
	let query =
		WorldClimIntersectsAQL(
			collection_data,
			reference,
			what,
			start,
			limit
		)

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

}, 'list')

	///
	// Path parameter schemas.
	///
	.queryParam('what', whatSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, DescriptionModelIntersects)

	///
	// Response schema.
	///
	.response([ModelRecord], DescriptionModelRecord)

	///
	// Summary.
	///
	.summary('Intersects')

	///
	// Description.
	///
	.description(DescriptionIntersects)
