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
const collection_map = db._collection('WorldClimMap')
const collection_data = db._collection('WorldClim')

///
// Models.
///
const ModelShape = require("../models/shapeAll");
const ModelShapeContains = require("../models/shapePoly");
const ModelClick = require('../models/click')
const ModelRecord = require('../models/climate')

const whatSchema = joi.string().valid('KEY', 'SHAPE', 'DATA', 'MIN', 'AVG', 'MAX', 'STD', 'VAR').required()
	.description(`
Return a *selection* of records:

- \`KEY\`: Return the record *primary keys*.
- \`SHAPE\`: Return the record *primary keys* and *geometries*.
- \`DATA\`: Return the record *primary keys*, *geometries* and *data properties*.

Return selection's quantitative data *aggregation*:

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
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
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
const DescriptionModelContains = `
The service body record contains the following properties:

- \`geometry\`: The *GeoJSON geometry* compared with the WorldClim records. It may be a *Polygon* or *MultiPolygon*. This parameter is required.
- \`start\`: The zero-based *start index* of the returned *selection*. This parameter is ignored for aggregated results.
- \`limit\`: The *number of records* to return. This parameter is ignored for aggregated results.
`
const DescriptionModelIntersects = `
The service body record contains the following properties:

- \`geometry\`: The *GeoJSON geometry* compared with the WorldClim records. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*. This parameter is required.
- \`start\`: The zero-based *start index* of the returned *selection*. This parameter is ignored for aggregated results.
- \`limit\`: The *number of records* to return. This parameter is ignored for aggregated results.
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
The service will select all WorldClim records that lie in the *provided distance range* from the *provided reference geometry*. The distance is calculated from the *wgs84 centroids* of both the provided *reference geometry* and the *shape geometry*.

The service expects the following *path parameters*:

- \`what\`: This parameter determines the *type* of *service result*: \`KEY\`, \`SHAPE\` and \`DATA\` for a selection of records, and \`MIN\`, \`AVG\`, \`MAX\`, \`STD\` and \`VAR\` for the selection's quantitative data aggregation.
- \`min\`: This parameter represents the range's *minimum distance*. The value is inclusive.
- \`max\`: This parameter represents the range's *maximum distance*. The value is inclusive.
- \`sort\`: This parameter determines whether results should be *sorted* and in what *order*.

And the following body parameters:

- \`geometry\`: This parameter represents the *reference geometry* whose *centroid* will be used to select all WorldClim records within the provided distance range.
- \`start\`: *Initial record index*, zero based, for returned selection of records.
- \`limit\`: *Number of records* to return.
`
const DescriptionContains = `
The service will select all WorldClim records whose *data bounds centroid* is *fully contained* by the *provided reference geometry*. Since the data bounds extend for a *radius* of *0.004166665* decimal degrees from the bounds *centroid*, this means that the service will *not* select *all* records that intersect with the provided reference geometry.

The service expects the following *path parameters*:

- \`what\`: This parameter determines the *type* of *service result*: \`KEY\`, \`SHAPE\` and \`DATA\` for a selection of records, and \`MIN\`, \`AVG\`, \`MAX\`, \`STD\` and \`VAR\` for the selection's quantitative data aggregation.
- \`min\`: This parameter represents the range's *minimum distance*. The value is inclusive.
- \`max\`: This parameter represents the range's *maximum distance*. The value is inclusive.
- \`sort\`: This parameter determines whether results should be *sorted* and in what *order*.

And the following body parameters:

- \`geometry\`: This parameter represents the *reference geometry* whose *centroid* will be used to select all WorldClim records within the provided distance range.
- \`start\`: *Initial record index*, zero based, for returned selection of records.
- \`limit\`: *Number of records* to return.
`
const DescriptionIntersects = `
The service will select all WorldClim records whose *data bounds* is intersect the *provided reference geometry*. Since the data bounds extend for a *radius* of *0.004166665* decimal degrees from the bounds *centroid*, this means that the service will select *all* records whose data bounds intersect with the provided reference geometry.

The service expects the following *path parameters*:

- \`what\`: This parameter determines the *type* of *service result*: \`KEY\`, \`SHAPE\` and \`DATA\` for a selection of records, and \`MIN\`, \`AVG\`, \`MAX\`, \`STD\` and \`VAR\` for the selection's quantitative data aggregation.
- \`min\`: This parameter represents the range's *minimum distance*. The value is inclusive.
- \`max\`: This parameter represents the range's *maximum distance*. The value is inclusive.
- \`sort\`: This parameter determines whether results should be *sorted* and in what *order*.

And the following body parameters:

- \`geometry\`: This parameter represents the *reference geometry* whose *centroid* will be used to select all WorldClim records within the provided distance range.
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
router.get('click/:lat/:lon', function (req, res)
{
	///
	// Path parameters.
	///
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

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

	/*
		LET radius = 0.004166665
		LET box = GEO_POLYGON([
		    [ ${lon}-radius, ${lat}-radius ],
		    [ ${lon}+radius, ${lat}-radius ],
		    [ ${lon}+radius, ${lat}+radius ],
		    [ ${lon}-radius, ${lat}+radius ],
		    [ ${lon}-radius, ${lat}-radius ]
		])
		FOR doc IN ${collection_map}
			FOR dat IN ${collection_data}
				FILTER dat._key == doc._key
				FILTER GEO_CONTAINS(
					box,
					doc.geometry
				)
		RETURN {
			geometry_hash: doc._key,
			geometry_point: doc.geometry,
			geometry_bounds: doc.geometry_bounds,
			properties: dat.properties
		}
	 */

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
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelClick], DescriptionModelClick)

	///
	// Summary.
	///
	.summary('Return record that contains the provided point')

	///
	// Description.
	///
	.description(dd`
		The service will return the WorldClim data record that contains the provided coordinate.
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
router.post('dist/:what/:min/:max/:sort', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort

	///
	// Body parameters.
	///
	const reference = req.body.geometry
	const start = req.body.start
	const limit = req.body.limit

	///
	// Build query.
	//
	let query =
		WorldClimDistanceAQL(
			collection_data,
			collection_map,
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
	.pathParam('what', whatSchema)
	.pathParam('min', minDistanceSchema)
	.pathParam('max', maxDistanceSchema)
	.pathParam('sort', sortSchema)

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
	.summary('Return selection or aggregation of records within a distance range')

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
router.post('contain/:what', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what

	///
	// Body parameters.
	///
	const reference = req.body.geometry
	const start = req.body.start
	const limit = req.body.limit

	///
	// Build query.
	//
	let query =
		WorldClimContainsAQL(
			collection_data,
			collection_map,
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
	.pathParam('what', whatSchema)

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
	.summary('Return selection or aggregation of records contained by the provided reference geometry')

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
router.post('intersect/:what', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what

	///
	// Body parameters.
	///
	const reference = req.body.geometry
	const start = req.body.start
	const limit = req.body.limit

	///
	// Build query.
	//
	let query =
		WorldClimIntersectsAQL(
			collection_data,
			collection_map,
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
	.pathParam('what', whatSchema)

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
	.summary('Return selection or aggregation of records that intersect the provided reference geometry')

	///
	// Description.
	///
	.description(DescriptionIntersects)
