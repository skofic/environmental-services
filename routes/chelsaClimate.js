'use strict'

/**
 * chelsaClimate.js
 *
 * This script contains the routes for the Chelsa climate services.
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
const collection_map = db._collection('ChelsaMap')
const collection_data = db._collection('Chelsa')

///
// Models.
///
const ModelShape = require("../models/shapeTarget");
const ModelShapeContains = require("../models/shapeContains");
const ModelRecord = require('../models/chelsa')
const minDistanceSchema = joi.number().required()
	.description('Minimum distance inclusive in meters.')
const maxDistanceSchema = joi.number().required()
	.description('Maximum distance inclusive in meters.')
const sortSchema = joi.string().valid('NO', 'ASC', 'DESC').required()
	.description("Sort order: \`NO\` to ignore sorting, \`ASC\` for ascending, \`DESC\` for descending.")
const whatSchema = joi.string().valid('KEY', 'SHAPE', 'DATA').required()
	.description("Result type: \`KEY\` return geometry hash, \`SHAPE\` return geometry, \`DATA\` return properties.")
const latSchema = joi.number().min(-90).max(90).required()
	.description('Coordinate decimal latitude.')
const lonSchema = joi.number().min(-180).max(180).required()
	.description('Coordinate decimal longitude.')
const startLimitSchema = joi.number().required()
	.description('Start index for results list, 0 is first.')
const itemsLimitSchema = joi.number().required()
	.description('Number of records to return, if found.')
const ModelRecordDescription = `
Chelsa location record.

Depending on the value of the \`what\` parameter:

- \`KEY\`: The service will only return the \`geometry_hash\` which is the hash of the point geometry and key of the record.
- \`SHAPE\`: The service will return, in addition of the above, \`geometry_point\` representing the data point and \
 \`geometry_bounds\` representing the data bounding box. If the query involves a distance, the \`distance\` property \
 will also be returned.
- \`DATA\`: The service will return, in addition of the above, all properties of the data point.
`

///
// Create and export router.
//
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Chelsa')


/**
 * Return the Chelsa data record that contains the provided point.
 *
 * This service will return the Chelsa record that contains the provided coordinate..
 *
 * Parameters:
 * - `:what`: The result type, `KEY` only geometry key, `SHAPE` key and geometry, `DATA` all.
 * - `:lat`: The latitude.
 * - `:lon`: The longitude.
 **/
router.get('click/:what/:lat/:lon', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const lat = req.pathParams.lat
	const lon = req.pathParams.lon

	///
	// Build query.
	//
	let query
	switch(what) {
		case 'KEY':
			query = aql`
				LET radius = 0.004167
				LET box = GEO_POLYGON([
				    [ ${lon}-radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}-radius ]
				])
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(
						box,
						doc.geometry
					)
				RETURN doc._key
			`
			break

		case 'SHAPE':
			query = aql`
				LET radius = 0.004167
				LET box = GEO_POLYGON([
				    [ ${lon}-radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}-radius ],
				    [ ${lon}+radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}+radius ],
				    [ ${lon}-radius, ${lat}-radius ]
				])
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(
						box,
						doc.geometry
					)
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		case 'DATA':
			query = aql`
				LET radius = 0.004167
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
			`
			break
	}

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
	.pathParam('lat', latSchema)
	.pathParam('lon', lonSchema)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get chelsa record containing the provided coordinate')

	///
	// Description.
	///
	.description(dd`
		The service will return the Chelsa data record that contains the provided coordinate.
		Provide \`KEY\` in the \`:what\` path paraneter to return just the geometry hash, \
		\`SHAPE\` to return the record geomnetries, or \`DATA\` to return all properties.
	`)

/**
 * Return the Chelsa data record that contains the provided point.
 *
 * This service will return the Chelsa map points whose distance to the provided reference
 * geometry is larger or equal to the provided minimum distance and smaller or equal to
 * the provided maximum distance.
 *
 * Parameters:
 * - `:what`: The result type, `KEY` only geometry key, `SHAPE` key and geometry, `DATA` all.
 * - `:min`: The minimum distance inclusive.
 * - `:max`: The maximum distance inclusive.
 * - `:sort`: The sort order: `ASC` for ascending, `DESC` for descending.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('dist/:what/:min/:max/:sort/:start/:limit', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const min = req.pathParams.min
	const max = req.pathParams.max
	const sort = req.pathParams.sort
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query
	switch(what) {
		case 'KEY':
			query = (sort === 'NO') ?
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						LIMIT ${start}, ${limit}
					RETURN doc._key
				` :
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						SORT distance ${sort}
						LIMIT ${start}, ${limit}
					RETURN doc._key
				`
			break

		case 'SHAPE':
			query = (sort === 'NO') ?
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds
					}
				` :
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						LET distance = GEO_DISTANCE(target, doc.geometry)
						FILTER distance >= ${min}
						FILTER distance <= ${max}
						SORT distance ${sort}
						LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds
					}
				`
			break

		case 'DATA':
			query = (sort === 'NO') ?
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						FOR dat IN ${collection_data}
							FILTER dat._key == doc._key
							LET distance = GEO_DISTANCE(target, doc.geometry)
							FILTER distance >= ${min}
							FILTER distance <= ${max}
							LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds,
						properties: dat.properties
					}
				` :
				aql`
				    LET target = ${reference}
					FOR doc IN ${collection_map}
						FOR dat IN ${collection_data}
							FILTER dat._key == doc._key
							LET distance = GEO_DISTANCE(target, doc.geometry)
							FILTER distance >= ${min}
							FILTER distance <= ${max}
							SORT distance ${sort}
							LIMIT ${start}, ${limit}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry,
						geometry_bounds: doc.geometry_bounds,
						properties: dat.properties
					}
				`
			break
	}

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
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get all Chelsa data point locations within the provided distance range')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *Chelsa data points* whose *distance* to the *provided reference geometry* is within the *provided range*.
		The distance is calculated the *wgs84 centroids* of both the provided reference geometry and the shape geometry.
		If you provide \`ALL\` in the \`what\` paraneter, the service will return the geometries of the Chelsa data location; if you provide \`HASH\`, it will only return the geometry *hash*, or data record primary key.
	`)

/**
 * Return all Chelsa data points fully contained by the provided reference geometry.
 *
 * This service will return all the occurrence records which are fully contained
 * by the provided reference geometry, the latter may be a Polygon or MultiPolugon.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('contain/:what/:start/:limit', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query
	switch(what) {
		case 'KEY':
			query = aql`
				LET target = ${reference}
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN doc._key
			`
			break

		case 'SHAPE':
			query = aql`
				LET target = ${reference}
				FOR doc IN ${collection_map}
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		case 'DATA':
			query = aql`
				LET target = ${reference}
				FOR doc IN ${collection_map}
					FOR dat IN ${collection_data}
						FILTER dat._key == doc._key
					FILTER GEO_CONTAINS(${reference}, doc.geometry)
					LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds,
					properties: dat.properties
				}
				`
			break
	}

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
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get all Chelsa data point locations fully contained by the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *Chelsa data points* that are *contained* in the *provided reference geometry*.
		If you provide \`ALL\` in the \`what\` paraneter, the service will return the geometries of the Chelsa data location; if you provide \`HASH\`, it will only return the geometry *hash*, or data record primary key.
	`)

/**
 * Return Chelsa average contained in the provided geometry.
 *
 * This service expects a GeoJSON object that may be a Polygon or MultiPolugon,
 * it will return the average of all Chelsa points contained in the provided geometry.
 **/
router.post('mean/contain', function (req, res)
{
	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query = aql`
		LET target = ${reference}
		FOR doc IN ${collection_map}
			FOR dat IN ${collection_data}
				FILTER dat._key == doc._key
			FILTER GEO_CONTAINS(target, doc.geometry)
			COLLECT AGGREGATE period1_bio01 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio01),
							  period1_bio02 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio02),
							  period1_bio03 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio03),
							  period1_bio04 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio04),
							  period1_bio05 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio05),
							  period1_bio06 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio06),
							  period1_bio07 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio07),
							  period1_bio08 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio08),
							  period1_bio09 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio09),
							  period1_bio10 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio10),
							  period1_bio11 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio11),
							  period1_bio12 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio12),
							  period1_bio13 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio13),
							  period1_bio14 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio14),
							  period1_bio15 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio15),
							  period1_bio16 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio16),
							  period1_bio17 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio17),
							  period1_bio18 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio18),
							  period1_bio19 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_bio19),
							  period1_gdd0 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_gdd0),
							  period1_gdd10 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_gdd10),
							  period1_gdd5 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_gdd5),
							  period1_gsl = AVERAGE(dat.properties.\`1981-2010\`.env_climate_gsl),
							  period1_gsp = AVERAGE(dat.properties.\`1981-2010\`.env_climate_gsp),
							  period1_gst = AVERAGE(dat.properties.\`1981-2010\`.env_climate_gst),
							  period1_hurs_max = AVERAGE(dat.properties.\`1981-2010\`.env_climate_hurs_max),
							  period1_hurs_mean = AVERAGE(dat.properties.\`1981-2010\`.env_climate_hurs_mean),
							  period1_hurs_min = AVERAGE(dat.properties.\`1981-2010\`.env_climate_hurs_min),
							  period1_hurs_range = AVERAGE(dat.properties.\`1981-2010\`.env_climate_hurs_range),
							  period1_ngd0 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_ngd0),
							  period1_ngd10 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_ngd10),
							  period1_ngd5 = AVERAGE(dat.properties.\`1981-2010\`.env_climate_ngd5),
							  period1_npp = AVERAGE(dat.properties.\`1981-2010\`.env_climate_npp),
							  period1_rsds_max = AVERAGE(dat.properties.\`1981-2010\`.env_climate_rsds_max),
							  period1_rsds_mean = AVERAGE(dat.properties.\`1981-2010\`.env_climate_rsds_mean),
							  period1_rsds_min = AVERAGE(dat.properties.\`1981-2010\`.env_climate_rsds_min),
							  period1_rsds_range = AVERAGE(dat.properties.\`1981-2010\`.env_climate_rsds_range),
							  period1_scd = AVERAGE(dat.properties.\`1981-2010\`.env_climate_scd),
							  period1_vpd_max = AVERAGE(dat.properties.\`1981-2010\`.env_climate_vpd_max),
							  period1_vpd_mean = AVERAGE(dat.properties.\`1981-2010\`.env_climate_vpd_mean),
							  period1_vpd_min = AVERAGE(dat.properties.\`1981-2010\`.env_climate_vpd_min),
							  period1_vpd_range = AVERAGE(dat.properties.\`1981-2010\`.env_climate_vpd_range),
							  period1_01_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[0].env_climate_pr),
							  period1_01_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[0].env_climate_tas),
							  period1_01_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[0].env_climate_tasmax),
							  period1_01_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[0].env_climate_tasmin),
							  period1_02_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[1].env_climate_pr),
							  period1_02_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[1].env_climate_tas),
							  period1_02_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[1].env_climate_tasmax),
							  period1_02_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[1].env_climate_tasmin),
							  period1_03_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[2].env_climate_pr),
							  period1_03_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[2].env_climate_tas),
							  period1_03_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[2].env_climate_tasmax),
							  period1_03_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[2].env_climate_tasmin),
							  period1_04_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[3].env_climate_pr),
							  period1_04_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[3].env_climate_tas),
							  period1_04_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[3].env_climate_tasmax),
							  period1_04_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[3].env_climate_tasmin),
							  period1_05_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[4].env_climate_pr),
							  period1_05_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[4].env_climate_tas),
							  period1_05_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[4].env_climate_tasmax),
							  period1_05_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[4].env_climate_tasmin),
							  period1_06_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[5].env_climate_pr),
							  period1_06_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[5].env_climate_tas),
							  period1_06_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[5].env_climate_tasmax),
							  period1_06_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[5].env_climate_tasmin),
							  period1_07_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[6].env_climate_pr),
							  period1_07_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[6].env_climate_tas),
							  period1_07_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[6].env_climate_tasmax),
							  period1_07_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[6].env_climate_tasmin),
							  period1_08_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[7].env_climate_pr),
							  period1_08_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[7].env_climate_tas),
							  period1_08_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[7].env_climate_tasmax),
							  period1_08_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[7].env_climate_tasmin),
							  period1_09_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[8].env_climate_pr),
							  period1_09_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[8].env_climate_tas),
							  period1_09_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[8].env_climate_tasmax),
							  period1_09_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[8].env_climate_tasmin),
							  period1_10_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[9].env_climate_pr),
							  period1_10_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[9].env_climate_tas),
							  period1_10_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[9].env_climate_tasmax),
							  period1_10_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[9].env_climate_tasmin),
							  period1_11_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[10].env_climate_pr),
							  period1_11_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[10].env_climate_tas),
							  period1_11_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[10].env_climate_tasmax),
							  period1_11_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[10].env_climate_tasmin),
							  period1_12_pr = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[11].env_climate_pr),
							  period1_12_tas = 	  AVERAGE(dat.properties.\`1981-2010\`.monthly[11].env_climate_tas),
							  period1_12_tasmax = AVERAGE(dat.properties.\`1981-2010\`.monthly[11].env_climate_tasmax),
							  period1_12_tasmin = AVERAGE(dat.properties.\`1981-2010\`.monthly[11].env_climate_tasmin),
							  period2_bio01 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
							  period2_bio02 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
							  period2_bio03 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
							  period2_bio04 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
							  period2_bio05 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
							  period2_bio06 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
							  period2_bio07 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
							  period2_bio08 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
							  period2_bio09 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
							  period2_bio10 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
							  period2_bio11 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
							  period2_bio12 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
							  period2_bio13 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
							  period2_bio14 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
							  period2_bio15 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
							  period2_bio16 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
							  period2_bio17 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
							  period2_bio18 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
							  period2_bio19 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
							  period2_gdd0 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd0),
							  period2_gdd10 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd10),
							  period2_gdd5 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd5),
							  period2_gsl = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gsl),
							  period2_gsp = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gsp),
							  period2_gst = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gst),
							  period2_ngd0 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd0),
							  period2_ngd10 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd10),
							  period2_ngd5 = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd5),
							  period2_npp = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_npp),
							  period2_scd = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_scd),
							  period2_01_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_pr),
							  period2_01_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tas),
							  period2_01_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tasmax),
							  period2_01_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tasmin),
							  period2_02_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_pr),
							  period2_02_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tas),
							  period2_02_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tasmax),
							  period2_02_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tasmin),
							  period2_03_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_pr),
							  period2_03_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tas),
							  period2_03_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tasmax),
							  period2_03_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tasmin),
							  period2_04_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_pr),
							  period2_04_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tas),
							  period2_04_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tasmax),
							  period2_04_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tasmin),
							  period2_05_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_pr),
							  period2_05_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tas),
							  period2_05_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tasmax),
							  period2_05_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tasmin),
							  period2_06_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_pr),
							  period2_06_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tas),
							  period2_06_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tasmax),
							  period2_06_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tasmin),
							  period2_07_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_pr),
							  period2_07_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tas),
							  period2_07_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tasmax),
							  period2_07_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tasmin),
							  period2_08_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_pr),
							  period2_08_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tas),
							  period2_08_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tasmax),
							  period2_08_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tasmin),
							  period2_09_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_pr),
							  period2_09_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tas),
							  period2_09_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tasmax),
							  period2_09_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tasmin),
							  period2_10_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_pr),
							  period2_10_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tas),
							  period2_10_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tasmax),
							  period2_10_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tasmin),
							  period2_11_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_pr),
							  period2_11_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tas),
							  period2_11_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tasmax),
							  period2_11_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tasmin),
							  period2_12_pr = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_pr),
							  period2_12_tas = 	  AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tas),
							  period2_12_tasmax = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tasmax),
							  period2_12_tasmin = AVERAGE(dat.properties.\`2011-2040\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tasmin),
							  period3_bio01 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
							  period3_bio02 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
							  period3_bio03 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
							  period3_bio04 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
							  period3_bio05 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
							  period3_bio06 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
							  period3_bio07 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
							  period3_bio08 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
							  period3_bio09 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
							  period3_bio10 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
							  period3_bio11 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
							  period3_bio12 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
							  period3_bio13 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
							  period3_bio14 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
							  period3_bio15 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
							  period3_bio16 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
							  period3_bio17 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
							  period3_bio18 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
							  period3_bio19 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
							  period3_gdd0 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd0),
							  period3_gdd10 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd10),
							  period3_gdd5 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd5),
							  period3_gsl = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gsl),
							  period3_gsp = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gsp),
							  period3_gst = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gst),
							  period3_ngd0 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd0),
							  period3_ngd10 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd10),
							  period3_ngd5 = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd5),
							  period3_npp = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_npp),
							  period3_scd = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_scd),
							  period3_01_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_pr),
							  period3_01_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tas),
							  period3_01_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tasmax),
							  period3_01_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tasmin),
							  period3_02_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_pr),
							  period3_02_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tas),
							  period3_02_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tasmax),
							  period3_02_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tasmin),
							  period3_03_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_pr),
							  period3_03_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tas),
							  period3_03_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tasmax),
							  period3_03_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tasmin),
							  period3_04_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_pr),
							  period3_04_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tas),
							  period3_04_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tasmax),
							  period3_04_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tasmin),
							  period3_05_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_pr),
							  period3_05_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tas),
							  period3_05_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tasmax),
							  period3_05_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tasmin),
							  period3_06_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_pr),
							  period3_06_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tas),
							  period3_06_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tasmax),
							  period3_06_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tasmin),
							  period3_07_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_pr),
							  period3_07_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tas),
							  period3_07_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tasmax),
							  period3_07_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tasmin),
							  period3_08_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_pr),
							  period3_08_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tas),
							  period3_08_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tasmax),
							  period3_08_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tasmin),
							  period3_09_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_pr),
							  period3_09_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tas),
							  period3_09_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tasmax),
							  period3_09_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tasmin),
							  period3_10_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_pr),
							  period3_10_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tas),
							  period3_10_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tasmax),
							  period3_10_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tasmin),
							  period3_11_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_pr),
							  period3_11_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tas),
							  period3_11_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tasmax),
							  period3_11_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tasmin),
							  period3_12_pr = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_pr),
							  period3_12_tas = 	  AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tas),
							  period3_12_tasmax = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tasmax),
							  period3_12_tasmin = AVERAGE(dat.properties.\`2041-2070\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tasmin),
							  period4_bio01 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
							  period4_bio02 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
							  period4_bio03 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
							  period4_bio04 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
							  period4_bio05 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
							  period4_bio06 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
							  period4_bio07 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
							  period4_bio08 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
							  period4_bio09 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
							  period4_bio10 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
							  period4_bio11 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
							  period4_bio12 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
							  period4_bio13 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
							  period4_bio14 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
							  period4_bio15 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
							  period4_bio16 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
							  period4_bio17 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
							  period4_bio18 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
							  period4_bio19 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
							  period4_gdd0 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd0),
							  period4_gdd10 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd10),
							  period4_gdd5 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gdd5),
							  period4_gsl = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gsl),
							  period4_gsp = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gsp),
							  period4_gst = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_gst),
							  period4_ngd0 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd0),
							  period4_ngd10 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd10),
							  period4_ngd5 = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_ngd5),
							  period4_npp = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_npp),
							  period4_scd = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_scd),
							  period4_01_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_pr),
							  period4_01_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tas),
							  period4_01_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tasmax),
							  period4_01_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[0].env_climate_tasmin),
							  period4_02_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_pr),
							  period4_02_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tas),
							  period4_02_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tasmax),
							  period4_02_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[1].env_climate_tasmin),
							  period4_03_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_pr),
							  period4_03_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tas),
							  period4_03_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tasmax),
							  period4_03_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[2].env_climate_tasmin),
							  period4_04_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_pr),
							  period4_04_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tas),
							  period4_04_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tasmax),
							  period4_04_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[3].env_climate_tasmin),
							  period4_05_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_pr),
							  period4_05_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tas),
							  period4_05_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tasmax),
							  period4_05_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[4].env_climate_tasmin),
							  period4_06_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_pr),
							  period4_06_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tas),
							  period4_06_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tasmax),
							  period4_06_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[5].env_climate_tasmin),
							  period4_07_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_pr),
							  period4_07_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tas),
							  period4_07_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tasmax),
							  period4_07_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[6].env_climate_tasmin),
							  period4_08_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_pr),
							  period4_08_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tas),
							  period4_08_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tasmax),
							  period4_08_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[7].env_climate_tasmin),
							  period4_09_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_pr),
							  period4_09_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tas),
							  period4_09_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tasmax),
							  period4_09_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[8].env_climate_tasmin),
							  period4_10_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_pr),
							  period4_10_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tas),
							  period4_10_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tasmax),
							  period4_10_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[9].env_climate_tasmin),
							  period4_11_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_pr),
							  period4_11_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tas),
							  period4_11_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tasmax),
							  period4_11_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[10].env_climate_tasmin),
							  period4_12_pr = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_pr),
							  period4_12_tas = 	  AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tas),
							  period4_12_tasmax = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tasmax),
							  period4_12_tasmin = AVERAGE(dat.properties.\`2071-2100\`.\`MPI-ESM1-2-HR\`.ssp370.monthly[11].env_climate_tasmin)
		RETURN {
			geometry: target,
			properties: {
				\`1981-2010\`: {
					env_climate_bio01: period1_bio01,
					env_climate_bio02: period1_bio02,
					env_climate_bio03: period1_bio03,
					env_climate_bio04: period1_bio04,
					env_climate_bio05: period1_bio05,
					env_climate_bio06: period1_bio06,
					env_climate_bio07: period1_bio07,
					env_climate_bio08: period1_bio08,
					env_climate_bio09: period1_bio09,
					env_climate_bio10: period1_bio10,
					env_climate_bio11: period1_bio11,
					env_climate_bio12: period1_bio12,
					env_climate_bio13: period1_bio13,
					env_climate_bio14: period1_bio14,
					env_climate_bio15: period1_bio15,
					env_climate_bio16: period1_bio16,
					env_climate_bio17: period1_bio17,
					env_climate_bio18: period1_bio18,
					env_climate_bio19: period1_bio19,
					env_climate_gdd0: period1_gdd0,
					env_climate_gdd10: period1_gdd10,
					env_climate_gdd5: period1_gdd5,
					env_climate_gsl: period1_gsl,
					env_climate_gsp: period1_gsp,
					env_climate_gst: period1_gst,
					env_climate_hurs_max: period1_hurs_max,
					env_climate_hurs_mean: period1_hurs_mean,
					env_climate_hurs_min: period1_hurs_min,
					env_climate_hurs_range: period1_hurs_range,
					env_climate_ngd0: period1_ngd0,
					env_climate_ngd10: period1_ngd10,
					env_climate_ngd5: period1_ngd5,
					env_climate_npp: period1_npp,
					env_climate_rsds_max: period1_rsds_max,
					env_climate_rsds_mean: period1_rsds_mean,
					env_climate_rsds_min: period1_rsds_min,
					env_climate_rsds_range: period1_rsds_range,
					env_climate_scd: period1_scd,
					env_climate_vpd_max: period1_vpd_max,
					env_climate_vpd_mean: period1_vpd_mean,
					env_climate_vpd_min: period1_vpd_min,
					env_climate_vpd_range: period1_vpd_range,
					monthly: [
						{
							std_month: 1,
							env_climate_pr: 	period1_01_pr,
							env_climate_tas: 	period1_01_tas,
							env_climate_tasmax: period1_01_tasmax,
							env_climate_tasmin: period1_01_tasmin
						},
						{
							std_month: 2,
							env_climate_pr: 	period1_02_pr,
							env_climate_tas: 	period1_02_tas,
							env_climate_tasmax: period1_02_tasmax,
							env_climate_tasmin: period1_02_tasmin
						},
						{
							std_month: 3,
							env_climate_pr: 	period1_03_pr,
							env_climate_tas: 	period1_03_tas,
							env_climate_tasmax: period1_03_tasmax,
							env_climate_tasmin: period1_03_tasmin
						},
						{
							std_month: 4,
							env_climate_pr: 	period1_04_pr,
							env_climate_tas: 	period1_04_tas,
							env_climate_tasmax: period1_04_tasmax,
							env_climate_tasmin: period1_04_tasmin
						},
						{
							std_month: 5,
							env_climate_pr: 	period1_05_pr,
							env_climate_tas: 	period1_05_tas,
							env_climate_tasmax: period1_05_tasmax,
							env_climate_tasmin: period1_05_tasmin
						},
						{
							std_month: 6,
							env_climate_pr: 	period1_06_pr,
							env_climate_tas: 	period1_06_tas,
							env_climate_tasmax: period1_06_tasmax,
							env_climate_tasmin: period1_06_tasmin
						},
						{
							std_month: 7,
							env_climate_pr: 	period1_07_pr,
							env_climate_tas: 	period1_07_tas,
							env_climate_tasmax: period1_07_tasmax,
							env_climate_tasmin: period1_07_tasmin
						},
						{
							std_month: 8,
							env_climate_pr: 	period1_08_pr,
							env_climate_tas: 	period1_08_tas,
							env_climate_tasmax: period1_08_tasmax,
							env_climate_tasmin: period1_08_tasmin
						},
						{
							std_month: 9,
							env_climate_pr: 	period1_09_pr,
							env_climate_tas: 	period1_09_tas,
							env_climate_tasmax: period1_09_tasmax,
							env_climate_tasmin: period1_09_tasmin
						},
						{
							std_month: 10,
							env_climate_pr: 	period1_10_pr,
							env_climate_tas: 	period1_10_tas,
							env_climate_tasmax: period1_10_tasmax,
							env_climate_tasmin: period1_10_tasmin
						},
						{
							std_month: 11,
							env_climate_pr: 	period1_11_pr,
							env_climate_tas: 	period1_11_tas,
							env_climate_tasmax: period1_11_tasmax,
							env_climate_tasmin: period1_11_tasmin
						},
						{
							std_month: 12,
							env_climate_pr: 	period1_12_pr,
							env_climate_tas: 	period1_12_tas,
							env_climate_tasmax: period1_12_tasmax,
							env_climate_tasmin: period1_12_tasmin
						}
					]
				},
				\`2011-2040\`: {
					\`MPI-ESM1-2-HR\`: {
						ssp370: {
							env_climate_bio01: period2_bio01,
							env_climate_bio02: period2_bio02,
							env_climate_bio03: period2_bio03,
							env_climate_bio04: period2_bio04,
							env_climate_bio05: period2_bio05,
							env_climate_bio06: period2_bio06,
							env_climate_bio07: period2_bio07,
							env_climate_bio08: period2_bio08,
							env_climate_bio09: period2_bio09,
							env_climate_bio10: period2_bio10,
							env_climate_bio11: period2_bio11,
							env_climate_bio12: period2_bio12,
							env_climate_bio13: period2_bio13,
							env_climate_bio14: period2_bio14,
							env_climate_bio15: period2_bio15,
							env_climate_bio16: period2_bio16,
							env_climate_bio17: period2_bio17,
							env_climate_bio18: period2_bio18,
							env_climate_bio19: period2_bio19,
							env_climate_gdd0: period2_gdd0,
							env_climate_gdd10: period2_gdd10,
							env_climate_gdd5: period2_gdd5,
							env_climate_gsl: period2_gsl,
							env_climate_gsp: period2_gsp,
							env_climate_gst: period2_gst,
							env_climate_ngd0: period2_ngd0,
							env_climate_ngd10: period2_ngd10,
							env_climate_ngd5: period2_ngd5,
							env_climate_npp: period2_npp,
							env_climate_scd: period2_scd,
							monthly: [
								{
									std_month: 1,
									env_climate_pr: 	period2_01_pr,
									env_climate_tas: 	period2_01_tas,
									env_climate_tasmax: period2_01_tasmax,
									env_climate_tasmin: period2_01_tasmin
								},
								{
									std_month: 2,
									env_climate_pr: 	period2_02_pr,
									env_climate_tas: 	period2_02_tas,
									env_climate_tasmax: period2_02_tasmax,
									env_climate_tasmin: period2_02_tasmin
								},
								{
									std_month: 3,
									env_climate_pr: 	period2_03_pr,
									env_climate_tas: 	period2_03_tas,
									env_climate_tasmax: period2_03_tasmax,
									env_climate_tasmin: period2_03_tasmin
								},
								{
									std_month: 4,
									env_climate_pr: 	period2_04_pr,
									env_climate_tas: 	period2_04_tas,
									env_climate_tasmax: period2_04_tasmax,
									env_climate_tasmin: period2_04_tasmin
								},
								{
									std_month: 5,
									env_climate_pr: 	period2_05_pr,
									env_climate_tas: 	period2_05_tas,
									env_climate_tasmax: period2_05_tasmax,
									env_climate_tasmin: period2_05_tasmin
								},
								{
									std_month: 6,
									env_climate_pr: 	period2_06_pr,
									env_climate_tas: 	period2_06_tas,
									env_climate_tasmax: period2_06_tasmax,
									env_climate_tasmin: period2_06_tasmin
								},
								{
									std_month: 7,
									env_climate_pr: 	period2_07_pr,
									env_climate_tas: 	period2_07_tas,
									env_climate_tasmax: period2_07_tasmax,
									env_climate_tasmin: period2_07_tasmin
								},
								{
									std_month: 8,
									env_climate_pr: 	period2_08_pr,
									env_climate_tas: 	period2_08_tas,
									env_climate_tasmax: period2_08_tasmax,
									env_climate_tasmin: period2_08_tasmin
								},
								{
									std_month: 9,
									env_climate_pr: 	period2_09_pr,
									env_climate_tas: 	period2_09_tas,
									env_climate_tasmax: period2_09_tasmax,
									env_climate_tasmin: period2_09_tasmin
								},
								{
									std_month: 10,
									env_climate_pr: 	period2_10_pr,
									env_climate_tas: 	period2_10_tas,
									env_climate_tasmax: period2_10_tasmax,
									env_climate_tasmin: period2_10_tasmin
								},
								{
									std_month: 11,
									env_climate_pr: 	period2_11_pr,
									env_climate_tas: 	period2_11_tas,
									env_climate_tasmax: period2_11_tasmax,
									env_climate_tasmin: period2_11_tasmin
								},
								{
									std_month: 12,
									env_climate_pr: 	period2_12_pr,
									env_climate_tas: 	period2_12_tas,
									env_climate_tasmax: period2_12_tasmax,
									env_climate_tasmin: period2_12_tasmin
								}
							]
						}
					}
				},
				\`2041-2070\`: {
					\`MPI-ESM1-2-HR\`: {
						ssp370: {
							env_climate_bio01: period3_bio01,
							env_climate_bio02: period3_bio02,
							env_climate_bio03: period3_bio03,
							env_climate_bio04: period3_bio04,
							env_climate_bio05: period3_bio05,
							env_climate_bio06: period3_bio06,
							env_climate_bio07: period3_bio07,
							env_climate_bio08: period3_bio08,
							env_climate_bio09: period3_bio09,
							env_climate_bio10: period3_bio10,
							env_climate_bio11: period3_bio11,
							env_climate_bio12: period3_bio12,
							env_climate_bio13: period3_bio13,
							env_climate_bio14: period3_bio14,
							env_climate_bio15: period3_bio15,
							env_climate_bio16: period3_bio16,
							env_climate_bio17: period3_bio17,
							env_climate_bio18: period3_bio18,
							env_climate_bio19: period3_bio19,
							env_climate_gdd0: period3_gdd0,
							env_climate_gdd10: period3_gdd10,
							env_climate_gdd5: period3_gdd5,
							env_climate_gsl: period3_gsl,
							env_climate_gsp: period3_gsp,
							env_climate_gst: period3_gst,
							env_climate_ngd0: period3_ngd0,
							env_climate_ngd10: period3_ngd10,
							env_climate_ngd5: period3_ngd5,
							env_climate_npp: period3_npp,
							env_climate_scd: period3_scd,
							monthly: [
								{
									std_month: 1,
									env_climate_pr: 	period3_01_pr,
									env_climate_tas: 	period3_01_tas,
									env_climate_tasmax: period3_01_tasmax,
									env_climate_tasmin: period3_01_tasmin
								},
								{
									std_month: 2,
									env_climate_pr: 	period3_02_pr,
									env_climate_tas: 	period3_02_tas,
									env_climate_tasmax: period3_02_tasmax,
									env_climate_tasmin: period3_02_tasmin
								},
								{
									std_month: 3,
									env_climate_pr: 	period3_03_pr,
									env_climate_tas: 	period3_03_tas,
									env_climate_tasmax: period3_03_tasmax,
									env_climate_tasmin: period3_03_tasmin
								},
								{
									std_month: 4,
									env_climate_pr: 	period3_04_pr,
									env_climate_tas: 	period3_04_tas,
									env_climate_tasmax: period3_04_tasmax,
									env_climate_tasmin: period3_04_tasmin
								},
								{
									std_month: 5,
									env_climate_pr: 	period3_05_pr,
									env_climate_tas: 	period3_05_tas,
									env_climate_tasmax: period3_05_tasmax,
									env_climate_tasmin: period3_05_tasmin
								},
								{
									std_month: 6,
									env_climate_pr: 	period3_06_pr,
									env_climate_tas: 	period3_06_tas,
									env_climate_tasmax: period3_06_tasmax,
									env_climate_tasmin: period3_06_tasmin
								},
								{
									std_month: 7,
									env_climate_pr: 	period3_07_pr,
									env_climate_tas: 	period3_07_tas,
									env_climate_tasmax: period3_07_tasmax,
									env_climate_tasmin: period3_07_tasmin
								},
								{
									std_month: 8,
									env_climate_pr: 	period3_08_pr,
									env_climate_tas: 	period3_08_tas,
									env_climate_tasmax: period3_08_tasmax,
									env_climate_tasmin: period3_08_tasmin
								},
								{
									std_month: 9,
									env_climate_pr: 	period3_09_pr,
									env_climate_tas: 	period3_09_tas,
									env_climate_tasmax: period3_09_tasmax,
									env_climate_tasmin: period3_09_tasmin
								},
								{
									std_month: 10,
									env_climate_pr: 	period3_10_pr,
									env_climate_tas: 	period3_10_tas,
									env_climate_tasmax: period3_10_tasmax,
									env_climate_tasmin: period3_10_tasmin
								},
								{
									std_month: 11,
									env_climate_pr: 	period3_11_pr,
									env_climate_tas: 	period3_11_tas,
									env_climate_tasmax: period3_11_tasmax,
									env_climate_tasmin: period3_11_tasmin
								},
								{
									std_month: 12,
									env_climate_pr: 	period3_12_pr,
									env_climate_tas: 	period3_12_tas,
									env_climate_tasmax: period3_12_tasmax,
									env_climate_tasmin: period3_12_tasmin
								}
							]
						}
					}
				},
				\`2071-2100\`: {
					\`MPI-ESM1-2-HR\`: {
						ssp370: {
							env_climate_bio01: period4_bio01,
							env_climate_bio02: period4_bio02,
							env_climate_bio03: period4_bio03,
							env_climate_bio04: period4_bio04,
							env_climate_bio05: period4_bio05,
							env_climate_bio06: period4_bio06,
							env_climate_bio07: period4_bio07,
							env_climate_bio08: period4_bio08,
							env_climate_bio09: period4_bio09,
							env_climate_bio10: period4_bio10,
							env_climate_bio11: period4_bio11,
							env_climate_bio12: period4_bio12,
							env_climate_bio13: period4_bio13,
							env_climate_bio14: period4_bio14,
							env_climate_bio15: period4_bio15,
							env_climate_bio16: period4_bio16,
							env_climate_bio17: period4_bio17,
							env_climate_bio18: period4_bio18,
							env_climate_bio19: period4_bio19,
							env_climate_gdd0: period4_gdd0,
							env_climate_gdd10: period4_gdd10,
							env_climate_gdd5: period4_gdd5,
							env_climate_gsl: period4_gsl,
							env_climate_gsp: period4_gsp,
							env_climate_gst: period4_gst,
							env_climate_ngd0: period4_ngd0,
							env_climate_ngd10: period4_ngd10,
							env_climate_ngd5: period4_ngd5,
							env_climate_npp: period4_npp,
							env_climate_scd: period4_scd,
							monthly: [
								{
									std_month: 1,
									env_climate_pr: 	period4_01_pr,
									env_climate_tas: 	period4_01_tas,
									env_climate_tasmax: period4_01_tasmax,
									env_climate_tasmin: period4_01_tasmin
								},
								{
									std_month: 2,
									env_climate_pr: 	period4_02_pr,
									env_climate_tas: 	period4_02_tas,
									env_climate_tasmax: period4_02_tasmax,
									env_climate_tasmin: period4_02_tasmin
								},
								{
									std_month: 3,
									env_climate_pr: 	period4_03_pr,
									env_climate_tas: 	period4_03_tas,
									env_climate_tasmax: period4_03_tasmax,
									env_climate_tasmin: period4_03_tasmin
								},
								{
									std_month: 4,
									env_climate_pr: 	period4_04_pr,
									env_climate_tas: 	period4_04_tas,
									env_climate_tasmax: period4_04_tasmax,
									env_climate_tasmin: period4_04_tasmin
								},
								{
									std_month: 5,
									env_climate_pr: 	period4_05_pr,
									env_climate_tas: 	period4_05_tas,
									env_climate_tasmax: period4_05_tasmax,
									env_climate_tasmin: period4_05_tasmin
								},
								{
									std_month: 6,
									env_climate_pr: 	period4_06_pr,
									env_climate_tas: 	period4_06_tas,
									env_climate_tasmax: period4_06_tasmax,
									env_climate_tasmin: period4_06_tasmin
								},
								{
									std_month: 7,
									env_climate_pr: 	period4_07_pr,
									env_climate_tas: 	period4_07_tas,
									env_climate_tasmax: period4_07_tasmax,
									env_climate_tasmin: period4_07_tasmin
								},
								{
									std_month: 8,
									env_climate_pr: 	period4_08_pr,
									env_climate_tas: 	period4_08_tas,
									env_climate_tasmax: period4_08_tasmax,
									env_climate_tasmin: period4_08_tasmin
								},
								{
									std_month: 9,
									env_climate_pr: 	period4_09_pr,
									env_climate_tas: 	period4_09_tas,
									env_climate_tasmax: period4_09_tasmax,
									env_climate_tasmin: period4_09_tasmin
								},
								{
									std_month: 10,
									env_climate_pr: 	period4_10_pr,
									env_climate_tas: 	period4_10_tas,
									env_climate_tasmax: period4_10_tasmax,
									env_climate_tasmin: period4_10_tasmin
								},
								{
									std_month: 11,
									env_climate_pr: 	period4_11_pr,
									env_climate_tas: 	period4_11_tas,
									env_climate_tasmax: period4_11_tasmax,
									env_climate_tasmin: period4_11_tasmin
								},
								{
									std_month: 12,
									env_climate_pr: 	period4_12_pr,
									env_climate_tas: 	period4_12_tas,
									env_climate_tasmax: period4_12_tasmax,
									env_climate_tasmin: period4_12_tasmin
								}
							]
						}
					}
				}
			}
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
	// Body parameters schema.
	///
	.body(ModelShapeContains, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Polygon* or *MultiPolygon*.")

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get average of all Chelsa data point locations fully contained by the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
		The service will return the *average* of all *Chelsa data points* contained in the *provided reference geometry*.
		The reference shape must be provided as a GeoJSON *Polygon* or *MultiPolygon*.
	`)

/**
 * Return all Chelsa data points that intersect with the provided reference geometry.
 *
 * This service will return all the Chelsa data points which intersect
 * with the provided reference geometry.
 *
 * Parameters:
 * - `:what`: The result type, `ALL` all data, `HASH` only geometry hash.
 * - `:start`: The start index.
 * - `:limit`: The number of records.
 **/
router.post('intersect/:what/:start/:limit', function (req, res)
{
	///
	// Path parameters.
	///
	const what = req.pathParams.what
	const start = req.pathParams.start
	const limit = req.pathParams.limit

	///
	// Body parameters.
	///
	const reference = req.body.geometry

	///
	// Build query.
	//
	let query
	switch(what) {
		case 'KEY':
			query = aql`
			    LET target = ${reference}
				FOR doc IN ${collection_map}
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN doc._key
			`
			break

		case 'SHAPE':
			query = aql`
			    LET target = ${reference}
				FOR doc IN ${collection_map}
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		case 'DATA':
			query = aql`
			    LET target = ${reference}
				FOR doc IN ${collection_map}
					FOR dat IN ${collection_data}
						FILTER dat._key == doc._key
				    FILTER GEO_INTERSECTS(${reference}, doc.geometry)
				    LIMIT ${start}, ${limit}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry,
					geometry_bounds: doc.geometry_bounds,
					properties: dat.properties
				}
				`
			break
	}

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
	.pathParam('start', startLimitSchema)
	.pathParam('limit', itemsLimitSchema)

	///
	// Body parameters schema.
	///
	.body(ModelShape, "`geometry` represents the *reference shape* for the operation: " +
		"provide  a *GeoJSON object* representing a *Point*, *MultiPoint*, *LineString*, " +
		"*MultiLineString*, *Polygon* or *MultiPolygon*."
	)

	///
	// Response schema.
	///
	.response([ModelRecord], ModelRecordDescription)

	///
	// Summary.
	///
	.summary('Get all Chelsa data points that intersect the provided reference geometry')

	///
	// Description.
	///
	.description(dd`
		The service will return the *list* of *Chelsa data points* intersecting with the provided reference geometry.
		*Intersecting* is defined such that at least one point in the reference geometry is also in the shape geometry or vice-versa.
	`)
