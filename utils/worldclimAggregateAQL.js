'use strict'

///
// Modules.
///
const {aql} = require('@arangodb')


/**
 * This function can be used to retrieve the AQL query required for selecting
 * the WorldClim data records whose centroids are within a certain distance from
 * the centroid of thw provided reference geometry.
 *
 * Parameters:
 * - theCollection {String}: Data collection.
 * - theCollectionMap {String}: Map collection.
 * - theGeometry {Object}: GeoJSON reference geometry, provide either a Point, MultiPoint, Polygon, MultiPolygon, LineString, or a MultiLineString.
 * - theWhat {String}: Query result: `KEY` geometry hash; `SHAPE` geometries; `DATA` all properties; `MIN` the minimum of all quantitative  properties; `AVG` the average of all quantitative  properties; `MAX` the maximum of all quantitative  properties; `STD` the standard deviation of all quantitative  properties.; `VAR` the variance of all quantitative  properties.
 * - theMin {Number}: Minimum distance in meters.
 * - theMax {Number}: Maximum distance in meters.
 * - theSort {String}: `NO` for no sorting,`ASC` for ascending or `DESC` for descending. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 * - theStart {Integer}: The results start index, 0 based. Default: 0. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 * - theLimit {Integer}: Number of records to return. Default 10. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 *
 * Returns:
 * - {String}: The AQL query.
 */
function WorldClimDistanceAQL(theCollection, theGeometry, theWhat, theMin, theMax, theSort, theStart = 0, theLimit = 10)
{
	///
	// Handle result limits.
	// Only consider if selection of records and provided at least the limit.
	///
	let paging = aql``
	if(['KEY', 'SHAPE', 'DATA'].includes(theWhat)) {
		if(theLimit !== null) {
			if(theStart !== null) {
				paging = aql`LIMIT ${theStart}, ${theLimit}`
			} else {
				paging = aql`LIMIT 0, ${theLimit}`
			}
		}
	}

	///
	// Parse request type.
	///
	let query
	switch(theWhat)
	{
		///
		// Return data record keys.
		///
		case 'KEY':
			query = (theSort === 'NO') ?
				aql`
				    LET target = ${theGeometry}
					FOR doc IN ${theCollection}
						LET distance = GEO_DISTANCE(target, doc.geometry_point)
						FILTER distance >= ${theMin}
						FILTER distance <= ${theMax}
						${paging}
					RETURN doc._key
				` :
				aql`
				    LET target = ${theGeometry}
					FOR doc IN ${theCollection}
						LET distance = GEO_DISTANCE(target, doc.geometry_point)
						FILTER distance >= ${theMin}
						FILTER distance <= ${theMax}
						SORT distance ${theSort}
						${paging}
					RETURN doc._key
				`
			break

		///
		// Return data record geometries.
		///
		case 'SHAPE':
			query = (theSort === 'NO') ?
				aql`
				    LET target = ${theGeometry}
					FOR doc IN ${theCollection}
						LET distance = GEO_DISTANCE(target, doc.geometry_point)
						FILTER distance >= ${theMin}
						FILTER distance <= ${theMax}
						${paging}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry_point,
						geometry_bounds: doc.geometry_bounds
					}
				` :
				aql`
				    LET target = ${theGeometry}
					FOR doc IN ${theCollection}
						LET distance = GEO_DISTANCE(target, doc.geometry_point)
						FILTER distance >= ${theMin}
						FILTER distance <= ${theMax}
						SORT distance ${theSort}
						${paging}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry_point,
						geometry_bounds: doc.geometry_bounds
					}
				`
			break

		///
		// Return full data records.
		///
		case 'DATA':
			query = (theSort === 'NO') ?
				aql`
				    LET target = ${theGeometry}
					FOR doc IN ${theCollection}
						LET distance = GEO_DISTANCE(target, doc.geometry_point)
						FILTER distance >= ${theMin}
						FILTER distance <= ${theMax}
						${paging}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry_point,
						geometry_bounds: doc.geometry_bounds,
						properties: doc.properties
					}
				` :
				aql`
				    LET target = ${theGeometry}
					FOR doc IN ${theCollection}
						LET distance = GEO_DISTANCE(target, doc.geometry_point)
						FILTER distance >= ${theMin}
						FILTER distance <= ${theMax}
						SORT distance ${theSort}
						${paging}
					RETURN {
						geometry_hash: doc._key,
						distance: distance,
						geometry_point: doc.geometry_point,
						geometry_bounds: doc.geometry_bounds,
						properties: doc.properties
					}
				`
			break

		///
		// Return selection minimum.
		///
		case 'MIN':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					LET dist = GEO_DISTANCE(target, doc.geometry_point)
					FILTER dist >= ${theMin}
					FILTER dist <= ${theMax}
					COLLECT AGGREGATE count = COUNT(),
									  distance = MIN(dist),
									  period0_elevation = MIN(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = MIN(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = MIN(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = MIN(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = MIN(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = MIN(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = MIN(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = MIN(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = MIN(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = MIN(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = MIN(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = MIN(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = MIN(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = MIN(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = MIN(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = MIN(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = MIN(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = MIN(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = MIN(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = MIN(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					distance: distance,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		case 'AVG':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					LET dist = GEO_DISTANCE(target, doc.geometry_point)
					FILTER dist >= ${theMin}
					FILTER dist <= ${theMax}
					COLLECT AGGREGATE count = COUNT(),
									  distance = AVERAGE(dist),
									  period0_elevation = AVERAGE(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					distance: distance,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		case 'MAX':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					LET dist = GEO_DISTANCE(target, doc.geometry_point)
					FILTER dist >= ${theMin}
					FILTER dist <= ${theMax}
					COLLECT AGGREGATE count = COUNT(),
									  distance = MAX(dist),
									  period0_elevation = MAX(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = MAX(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = MAX(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = MAX(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = MAX(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = MAX(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = MAX(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = MAX(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = MAX(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = MAX(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = MAX(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = MAX(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = MAX(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = MAX(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = MAX(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = MAX(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = MAX(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = MAX(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = MAX(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = MAX(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					distance: distance,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		case 'STD':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					LET dist = GEO_DISTANCE(target, doc.geometry_point)
					FILTER dist >= ${theMin}
					FILTER dist <= ${theMax}
					COLLECT AGGREGATE count = COUNT(),
									  distance = STDDEV(dist),
									  period0_elevation = STDDEV(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					distance: distance,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		case 'VAR':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					LET dist = GEO_DISTANCE(target, doc.geometry_point)
					FILTER dist >= ${theMin}
					FILTER dist <= ${theMax}
					COLLECT AGGREGATE count = COUNT(),
									  distance = VARIANCE(dist),
									  period0_elevation = VARIANCE(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					distance: distance,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

	} // switch(theWhat)

	return query

} // WorldClimDistanceAQL()

/**
 * This function can be used to retrieve the AQL query required for selecting
 * the WorldClim data records whose centroids are contained in the provided reference geometry.
 *
 * Parameters:
 * - theCollection {String}: Data collection.
 * - theCollectionMap {String}: Map collection.
 * - theGeometry {Object}: GeoJSON reference geometry, provide either a Point, MultiPoint, Polygon, MultiPolygon, LineString, or a MultiLineString.
 * - theWhat {String}: Query result: `KEY` geometry hash; `SHAPE` geometries; `DATA` all properties; `MIN` the minimum of all quantitative  properties; `AVG` the average of all quantitative  properties; `MAX` the maximum of all quantitative  properties; `STD` the standard deviation of all quantitative  properties.; `VAR` the variance of all quantitative  properties.
 * - theStart {Integer}: The results start index, 0 based. Default: 0. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 * - theLimit {Integer}: Number of records to return. Default 10. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 *
 * Returns:
 * - {String}: The AQL query.
 */
function WorldClimContainsAQL(theCollection, theGeometry, theWhat, theStart = 0, theLimit = 10)
{
	///
	// Handle result limits.
	// Only consider if selection of records and provided at least the limit.
	///
	let paging = aql``
	if(['KEY', 'SHAPE', 'DATA'].includes(theWhat)) {
		if(theLimit !== null) {
			if(theStart !== null) {
				paging = aql`LIMIT ${theStart}, ${theLimit}`
			} else {
				paging = aql`LIMIT 0, ${theLimit}`
			}
		}
	}

	///
	// Parse request type.
	///
	let query
	switch(theWhat)
	{
		///
		// Return data record keys.
		///
		case 'KEY':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					${paging}
				RETURN doc._key
			`
			break

		///
		// Return data record geometries.
		///
		case 'SHAPE':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					${paging}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry_point,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		///
		// Return full data records.
		///
		case 'DATA':
			query = aql`
			    LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					${paging}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry_point,
					geometry_bounds: doc.geometry_bounds,
					properties: doc.properties
				}
			`
			break

		///
		// Return selection minimum.
		///
		case 'MIN':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = MIN(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = MIN(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = MIN(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = MIN(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = MIN(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = MIN(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = MIN(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = MIN(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = MIN(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = MIN(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = MIN(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = MIN(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = MIN(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = MIN(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = MIN(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = MIN(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = MIN(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = MIN(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = MIN(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = MIN(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection average.
		///
		case 'AVG':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = AVERAGE(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection maximum.
		///
		case 'MAX':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = MAX(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = MAX(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = MAX(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = MAX(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = MAX(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = MAX(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = MAX(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = MAX(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = MAX(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = MAX(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = MAX(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = MAX(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = MAX(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = MAX(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = MAX(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = MAX(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = MAX(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = MAX(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = MAX(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = MAX(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection standard deviation.
		///
		case 'STD':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = STDDEV(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection variance.
		///
		case 'VAR':
			query = aql`
				LET target = ${theGeometry}
				FOR doc IN ${theCollection}
					FILTER GEO_CONTAINS(${theGeometry}, doc.geometry_point)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = VARIANCE(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

	} // switch(theWhat)

	return query

} // WorldClimContainsAQL()

/**
 * This function can be used to retrieve the AQL query required for selecting
 * the WorldClim data records that intersect with the provided reference geometry.
 *
 * Parameters:
 * - theCollection {String}: Data collection.
 * - theCollectionMap {String}: Map collection.
 * - theGeometry {Object}: GeoJSON reference geometry, provide either a Point, MultiPoint, Polygon, MultiPolygon, LineString, or a MultiLineString.
 * - theWhat {String}: Query result: `KEY` geometry hash; `SHAPE` geometries; `DATA` all properties; `MIN` the minimum of all quantitative  properties; `AVG` the average of all quantitative  properties; `MAX` the maximum of all quantitative  properties; `STD` the standard deviation of all quantitative  properties.; `VAR` the variance of all quantitative  properties.
 * - theStart {Integer}: The results start index, 0 based. Default: 0. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 * - theLimit {Integer}: Number of records to return. Default 10. Only relevant for theWhat == `KEY`, `SHAPE` and `DATA`.
 *
 * Returns:
 * - {String}: The AQL query.
 */
function WorldClimIntersectsAQL(theCollection, theGeometry, theWhat, theStart = 0, theLimit = 10)
{
	///
	// Handle result limits.
	// Only consider if selection of records and provided at least the limit.
	///
	let paging = aql``
	if(['KEY', 'SHAPE', 'DATA'].includes(theWhat)) {
		if(theLimit !== null) {
			if(theStart !== null) {
				paging = aql`LIMIT ${theStart}, ${theLimit}`
			} else {
				paging = aql`LIMIT 0, ${theLimit}`
			}
		}
	}

	///
	// Parse request type.
	///
	let query
	switch(theWhat)
	{
		///
		// Return data record keys.
		///
		case 'KEY':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					${paging}
				RETURN doc._key
			`
			break

		///
		// Return data record geometries.
		///
		case 'SHAPE':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					${paging}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry_point,
					geometry_bounds: doc.geometry_bounds
				}
			`
			break

		///
		// Return full data records.
		///
		case 'DATA':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					${paging}
				RETURN {
					geometry_hash: doc._key,
					geometry_point: doc.geometry_point,
					geometry_bounds: doc.geometry_bounds,
					properties: doc.properties
				}
			`
			break

		///
		// Return selection minimum.
		///
		case 'MIN':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = MIN(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = MIN(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = MIN(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = MIN(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = MIN(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = MIN(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = MIN(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = MIN(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = MIN(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = MIN(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = MIN(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = MIN(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = MIN(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = MIN(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = MIN(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = MIN(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = MIN(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = MIN(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = MIN(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = MIN(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = MIN(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = MIN(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = MIN(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = MIN(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = MIN(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection average.
		///
		case 'AVG':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = AVERAGE(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = AVERAGE(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = AVERAGE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = AVERAGE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = AVERAGE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = AVERAGE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = AVERAGE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection maximum.
		///
		case 'MAX':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = MAX(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = MAX(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = MAX(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = MAX(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = MAX(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = MAX(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = MAX(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = MAX(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = MAX(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = MAX(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = MAX(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = MAX(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = MAX(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = MAX(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = MAX(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = MAX(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = MAX(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = MAX(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = MAX(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = MAX(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = MAX(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = MAX(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = MAX(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = MAX(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = MAX(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection standard deviation.
		///
		case 'STD':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = STDDEV(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = STDDEV(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = STDDEV(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = STDDEV(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = STDDEV(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = STDDEV(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = STDDEV(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

		///
		// Return selection variance.
		///
		case 'VAR':
			query = aql`
				FOR doc IN ${theCollection}
					FILTER GEO_INTERSECTS(${theGeometry}, doc.geometry_bounds)
					COLLECT AGGREGATE count = COUNT(),
									  period0_elevation = VARIANCE(doc.properties.topography.geo_shape_elevation),
									  period1_bio01 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio01),
									  period1_bio02 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio02),
									  period1_bio03 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio03),
									  period1_bio04 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio04),
									  period1_bio05 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio05),
									  period1_bio06 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio06),
									  period1_bio07 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio07),
									  period1_bio08 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio08),
									  period1_bio09 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio09),
									  period1_bio10 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio10),
									  period1_bio11 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio11),
									  period1_bio12 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio12),
									  period1_bio13 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio13),
									  period1_bio14 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio14),
									  period1_bio15 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio15),
									  period1_bio16 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio16),
									  period1_bio17 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio17),
									  period1_bio18 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio18),
									  period1_bio19 = VARIANCE(doc.properties.\`1970-2000\`.env_climate_bio19),
									  period1_01_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_pr),
									  period1_01_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_srad),
									  period1_01_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tas),
									  period1_01_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmax),
									  period1_01_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_tasmin),
									  period1_01_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_vapr),
									  period1_01_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[0].env_climate_wind),
									  period1_02_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_pr),
									  period1_02_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_srad),
									  period1_02_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tas),
									  period1_02_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmax),
									  period1_02_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_tasmin),
									  period1_02_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_vapr),
									  period1_02_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[1].env_climate_wind),
									  period1_03_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_pr),
									  period1_03_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_srad),
									  period1_03_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tas),
									  period1_03_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmax),
									  period1_03_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_tasmin),
									  period1_03_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_vapr),
									  period1_03_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[2].env_climate_wind),
									  period1_04_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_pr),
									  period1_04_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_srad),
									  period1_04_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tas),
									  period1_04_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmax),
									  period1_04_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_tasmin),
									  period1_04_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_vapr),
									  period1_04_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[3].env_climate_wind),
									  period1_05_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_pr),
									  period1_05_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_srad),
									  period1_05_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tas),
									  period1_05_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmax),
									  period1_05_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_tasmin),
									  period1_05_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_vapr),
									  period1_05_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[4].env_climate_wind),
									  period1_06_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_pr),
									  period1_06_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_srad),
									  period1_06_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tas),
									  period1_06_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmax),
									  period1_06_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_tasmin),
									  period1_06_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_vapr),
									  period1_06_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[5].env_climate_wind),
									  period1_07_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_pr),
									  period1_07_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_srad),
									  period1_07_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tas),
									  period1_07_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmax),
									  period1_07_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_tasmin),
									  period1_07_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_vapr),
									  period1_07_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[6].env_climate_wind),
									  period1_08_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_pr),
									  period1_08_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_srad),
									  period1_08_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tas),
									  period1_08_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmax),
									  period1_08_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_tasmin),
									  period1_08_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_vapr),
									  period1_08_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[7].env_climate_wind),
									  period1_09_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_pr),
									  period1_09_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_srad),
									  period1_09_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tas),
									  period1_09_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmax),
									  period1_09_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_tasmin),
									  period1_09_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_vapr),
									  period1_09_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[8].env_climate_wind),
									  period1_10_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_pr),
									  period1_10_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_srad),
									  period1_10_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tas),
									  period1_10_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmax),
									  period1_10_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_tasmin),
									  period1_10_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_vapr),
									  period1_10_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[9].env_climate_wind),
									  period1_11_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_pr),
									  period1_11_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_srad),
									  period1_11_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tas),
									  period1_11_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmax),
									  period1_11_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_tasmin),
									  period1_11_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_vapr),
									  period1_11_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[10].env_climate_wind),
									  period1_12_pr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_pr),
									  period1_12_srad = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_srad),
									  period1_12_tas = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tas),
									  period1_12_tasmax = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmax),
									  period1_12_tasmin = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_tasmin),
									  period1_12_vapr = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_vapr),
									  period1_12_wind = VARIANCE(doc.properties.\`1970-2000\`.std_date_span_month[11].env_climate_wind),
									  period2_bio01 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period2_bio02 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period2_bio03 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period2_bio04 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period2_bio05 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period2_bio06 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period2_bio07 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period2_bio08 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period2_bio09 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period2_bio10 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period2_bio11 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period2_bio12 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period2_bio13 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period2_bio14 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period2_bio15 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period2_bio16 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period2_bio17 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period2_bio18 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period2_bio19 = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period2_01_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period2_01_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period2_01_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period2_01_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period2_02_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period2_02_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period2_02_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period2_02_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period2_03_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period2_03_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period2_03_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period2_03_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period2_04_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period2_04_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period2_04_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period2_04_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period2_05_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period2_05_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period2_05_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period2_05_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period2_06_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period2_06_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period2_06_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period2_06_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period2_07_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period2_07_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period2_07_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period2_07_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period2_08_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period2_08_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period2_08_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period2_08_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period2_09_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period2_09_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period2_09_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period2_09_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period2_10_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period2_10_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period2_10_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period2_10_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period2_11_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period2_11_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period2_11_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period2_11_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period2_12_pr = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period2_12_tas = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period2_12_tasmax = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period2_12_tasmin = VARIANCE(doc.properties.\`2021-2040\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period3_bio01 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period3_bio02 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period3_bio03 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period3_bio04 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period3_bio05 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period3_bio06 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period3_bio07 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period3_bio08 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period3_bio09 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period3_bio10 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period3_bio11 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period3_bio12 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period3_bio13 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period3_bio14 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period3_bio15 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period3_bio16 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period3_bio17 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period3_bio18 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period3_bio19 = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period3_01_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period3_01_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period3_01_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period3_01_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period3_02_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period3_02_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period3_02_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period3_02_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period3_03_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period3_03_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period3_03_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period3_03_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period3_04_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period3_04_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period3_04_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period3_04_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period3_05_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period3_05_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period3_05_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period3_05_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period3_06_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period3_06_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period3_06_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period3_06_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period3_07_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period3_07_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period3_07_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period3_07_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period3_08_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period3_08_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period3_08_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period3_08_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period3_09_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period3_09_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period3_09_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period3_09_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period3_10_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period3_10_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period3_10_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period3_10_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period3_11_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period3_11_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period3_11_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period3_11_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period3_12_pr = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period3_12_tas = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period3_12_tasmax = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period3_12_tasmin = VARIANCE(doc.properties.\`2041-2060\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period4_bio01 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period4_bio02 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period4_bio03 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period4_bio04 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period4_bio05 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period4_bio06 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period4_bio07 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period4_bio08 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period4_bio09 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period4_bio10 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period4_bio11 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period4_bio12 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period4_bio13 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period4_bio14 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period4_bio15 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period4_bio16 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period4_bio17 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period4_bio18 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period4_bio19 = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period4_01_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period4_01_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period4_01_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period4_01_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period4_02_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period4_02_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period4_02_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period4_02_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period4_03_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period4_03_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period4_03_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period4_03_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period4_04_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period4_04_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period4_04_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period4_04_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period4_05_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period4_05_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period4_05_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period4_05_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period4_06_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period4_06_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period4_06_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period4_06_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period4_07_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period4_07_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period4_07_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period4_07_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period4_08_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period4_08_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period4_08_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period4_08_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period4_09_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period4_09_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period4_09_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period4_09_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period4_10_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period4_10_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period4_10_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period4_10_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period4_11_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period4_11_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period4_11_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period4_11_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period4_12_pr = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period4_12_tas = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period4_12_tasmax = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period4_12_tasmin = VARIANCE(doc.properties.\`2061-2080\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin),
									  period5_bio01 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio01),
									  period5_bio02 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio02),
									  period5_bio03 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio03),
									  period5_bio04 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio04),
									  period5_bio05 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio05),
									  period5_bio06 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio06),
									  period5_bio07 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio07),
									  period5_bio08 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio08),
									  period5_bio09 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio09),
									  period5_bio10 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio10),
									  period5_bio11 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio11),
									  period5_bio12 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio12),
									  period5_bio13 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio13),
									  period5_bio14 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio14),
									  period5_bio15 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio15),
									  period5_bio16 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio16),
									  period5_bio17 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio17),
									  period5_bio18 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio18),
									  period5_bio19 = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.env_climate_bio19),
									  period5_01_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_pr),
									  period5_01_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tas),
									  period5_01_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmax),
									  period5_01_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[0].env_climate_tasmin),
									  period5_02_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_pr),
									  period5_02_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tas),
									  period5_02_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmax),
									  period5_02_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[1].env_climate_tasmin),
									  period5_03_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_pr),
									  period5_03_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tas),
									  period5_03_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmax),
									  period5_03_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[2].env_climate_tasmin),
									  period5_04_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_pr),
									  period5_04_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tas),
									  period5_04_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmax),
									  period5_04_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[3].env_climate_tasmin),
									  period5_05_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_pr),
									  period5_05_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tas),
									  period5_05_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmax),
									  period5_05_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[4].env_climate_tasmin),
									  period5_06_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_pr),
									  period5_06_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tas),
									  period5_06_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmax),
									  period5_06_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[5].env_climate_tasmin),
									  period5_07_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_pr),
									  period5_07_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tas),
									  period5_07_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmax),
									  period5_07_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[6].env_climate_tasmin),
									  period5_08_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_pr),
									  period5_08_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tas),
									  period5_08_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmax),
									  period5_08_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[7].env_climate_tasmin),
									  period5_09_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_pr),
									  period5_09_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tas),
									  period5_09_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmax),
									  period5_09_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[8].env_climate_tasmin),
									  period5_10_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_pr),
									  period5_10_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tas),
									  period5_10_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmax),
									  period5_10_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[9].env_climate_tasmin),
									  period5_11_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_pr),
									  period5_11_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tas),
									  period5_11_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmax),
									  period5_11_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[10].env_climate_tasmin),
									  period5_12_pr = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_pr),
									  period5_12_tas = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tas),
									  period5_12_tasmax = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmax),
									  period5_12_tasmin = VARIANCE(doc.properties.\`2081-2100\`.\`MPI-ESM1-2-HR\`.ssp370.std_date_span_month[11].env_climate_tasmin)
				RETURN {
					count: count,
					properties: {
						topography: { geo_shape_elevation: period0_elevation },
						\`1970-2000\`: {
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
							std_date_span_month: [
								{
									std_month: 1,
									env_climate_pr: 	period1_01_pr,
									env_climate_srad:	period1_01_srad,
									env_climate_tas: 	period1_01_tas,
									env_climate_tasmax: period1_01_tasmax,
									env_climate_tasmin: period1_01_tasmin,
									env_climate_vapr: 	period1_01_vapr,
									env_climate_wind: 	period1_01_wind
								},
								{
									std_month: 2,
									env_climate_pr: 	period1_02_pr,
									env_climate_srad:	period1_02_srad,
									env_climate_tas: 	period1_02_tas,
									env_climate_tasmax: period1_02_tasmax,
									env_climate_tasmin: period1_02_tasmin,
									env_climate_vapr: 	period1_02_vapr,
									env_climate_wind: 	period1_02_wind
								},
								{
									std_month: 3,
									env_climate_pr: 	period1_03_pr,
									env_climate_srad:	period1_03_srad,
									env_climate_tas: 	period1_03_tas,
									env_climate_tasmax: period1_03_tasmax,
									env_climate_tasmin: period1_03_tasmin,
									env_climate_vapr: 	period1_03_vapr,
									env_climate_wind: 	period1_03_wind
								},
								{
									std_month: 4,
									env_climate_pr: 	period1_04_pr,
									env_climate_srad:	period1_04_srad,
									env_climate_tas: 	period1_04_tas,
									env_climate_tasmax: period1_04_tasmax,
									env_climate_tasmin: period1_04_tasmin,
									env_climate_vapr: 	period1_04_vapr,
									env_climate_wind: 	period1_04_wind
								},
								{
									std_month: 5,
									env_climate_pr: 	period1_05_pr,
									env_climate_srad:	period1_05_srad,
									env_climate_tas: 	period1_05_tas,
									env_climate_tasmax: period1_05_tasmax,
									env_climate_tasmin: period1_05_tasmin,
									env_climate_vapr: 	period1_05_vapr,
									env_climate_wind: 	period1_05_wind
								},
								{
									std_month: 6,
									env_climate_pr: 	period1_06_pr,
									env_climate_srad:	period1_06_srad,
									env_climate_tas: 	period1_06_tas,
									env_climate_tasmax: period1_06_tasmax,
									env_climate_tasmin: period1_06_tasmin,
									env_climate_vapr: 	period1_06_vapr,
									env_climate_wind: 	period1_06_wind
								},
								{
									std_month: 7,
									env_climate_pr: 	period1_07_pr,
									env_climate_srad:	period1_07_srad,
									env_climate_tas: 	period1_07_tas,
									env_climate_tasmax: period1_07_tasmax,
									env_climate_tasmin: period1_07_tasmin,
									env_climate_vapr: 	period1_07_vapr,
									env_climate_wind: 	period1_07_wind
								},
								{
									std_month: 8,
									env_climate_pr: 	period1_08_pr,
									env_climate_srad:	period1_08_srad,
									env_climate_tas: 	period1_08_tas,
									env_climate_tasmax: period1_08_tasmax,
									env_climate_tasmin: period1_08_tasmin,
									env_climate_vapr: 	period1_08_vapr,
									env_climate_wind: 	period1_08_wind
								},
								{
									std_month: 9,
									env_climate_pr: 	period1_09_pr,
									env_climate_srad:	period1_09_srad,
									env_climate_tas: 	period1_09_tas,
									env_climate_tasmax: period1_09_tasmax,
									env_climate_tasmin: period1_09_tasmin,
									env_climate_vapr: 	period1_09_vapr,
									env_climate_wind: 	period1_09_wind
								},
								{
									std_month: 10,
									env_climate_pr: 	period1_10_pr,
									env_climate_srad:	period1_10_srad,
									env_climate_tas: 	period1_10_tas,
									env_climate_tasmax: period1_10_tasmax,
									env_climate_tasmin: period1_10_tasmin,
									env_climate_vapr: 	period1_10_vapr,
									env_climate_wind: 	period1_10_wind
								},
								{
									std_month: 11,
									env_climate_pr: 	period1_11_pr,
									env_climate_srad:	period1_11_srad,
									env_climate_tas: 	period1_11_tas,
									env_climate_tasmax: period1_11_tasmax,
									env_climate_tasmin: period1_11_tasmin,
									env_climate_vapr: 	period1_11_vapr,
									env_climate_wind: 	period1_11_wind
								},
								{
									std_month: 12,
									env_climate_pr: 	period1_12_pr,
									env_climate_srad:	period1_12_srad,
									env_climate_tas: 	period1_12_tas,
									env_climate_tasmax: period1_12_tasmax,
									env_climate_tasmin: period1_12_tasmin,
									env_climate_vapr: 	period1_12_vapr,
									env_climate_wind: 	period1_12_wind
								}
							]
						},
						\`2021-2040\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period2_01_pr,
											env_climate_tasmax: period2_01_tasmax,
											env_climate_tasmin: period2_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period2_02_pr,
											env_climate_tasmax: period2_02_tasmax,
											env_climate_tasmin: period2_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period2_03_pr,
											env_climate_tasmax: period2_03_tasmax,
											env_climate_tasmin: period2_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period2_04_pr,
											env_climate_tasmax: period2_04_tasmax,
											env_climate_tasmin: period2_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period2_05_pr,
											env_climate_tasmax: period2_05_tasmax,
											env_climate_tasmin: period2_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period2_06_pr,
											env_climate_tasmax: period2_06_tasmax,
											env_climate_tasmin: period2_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period2_07_pr,
											env_climate_tasmax: period2_07_tasmax,
											env_climate_tasmin: period2_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period2_08_pr,
											env_climate_tasmax: period2_08_tasmax,
											env_climate_tasmin: period2_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period2_09_pr,
											env_climate_tasmax: period2_09_tasmax,
											env_climate_tasmin: period2_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period2_10_pr,
											env_climate_tasmax: period2_10_tasmax,
											env_climate_tasmin: period2_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period2_11_pr,
											env_climate_tasmax: period2_11_tasmax,
											env_climate_tasmin: period2_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period2_12_pr,
											env_climate_tasmax: period2_12_tasmax,
											env_climate_tasmin: period2_12_tasmin
										}
									]
								}
							}
						},
						\`2041-2060\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period3_01_pr,
											env_climate_tasmax: period3_01_tasmax,
											env_climate_tasmin: period3_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period3_02_pr,
											env_climate_tasmax: period3_02_tasmax,
											env_climate_tasmin: period3_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period3_03_pr,
											env_climate_tasmax: period3_03_tasmax,
											env_climate_tasmin: period3_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period3_04_pr,
											env_climate_tasmax: period3_04_tasmax,
											env_climate_tasmin: period3_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period3_05_pr,
											env_climate_tasmax: period3_05_tasmax,
											env_climate_tasmin: period3_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period3_06_pr,
											env_climate_tasmax: period3_06_tasmax,
											env_climate_tasmin: period3_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period3_07_pr,
											env_climate_tasmax: period3_07_tasmax,
											env_climate_tasmin: period3_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period3_08_pr,
											env_climate_tasmax: period3_08_tasmax,
											env_climate_tasmin: period3_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period3_09_pr,
											env_climate_tasmax: period3_09_tasmax,
											env_climate_tasmin: period3_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period3_10_pr,
											env_climate_tasmax: period3_10_tasmax,
											env_climate_tasmin: period3_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period3_11_pr,
											env_climate_tasmax: period3_11_tasmax,
											env_climate_tasmin: period3_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period3_12_pr,
											env_climate_tasmax: period3_12_tasmax,
											env_climate_tasmin: period3_12_tasmin
										}
									]
								}
							}
						},
						\`2061-2080\`: {
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
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period4_01_pr,
											env_climate_tasmax: period4_01_tasmax,
											env_climate_tasmin: period4_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period4_02_pr,
											env_climate_tasmax: period4_02_tasmax,
											env_climate_tasmin: period4_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period4_03_pr,
											env_climate_tasmax: period4_03_tasmax,
											env_climate_tasmin: period4_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period4_04_pr,
											env_climate_tasmax: period4_04_tasmax,
											env_climate_tasmin: period4_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period4_05_pr,
											env_climate_tasmax: period4_05_tasmax,
											env_climate_tasmin: period4_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period4_06_pr,
											env_climate_tasmax: period4_06_tasmax,
											env_climate_tasmin: period4_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period4_07_pr,
											env_climate_tasmax: period4_07_tasmax,
											env_climate_tasmin: period4_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period4_08_pr,
											env_climate_tasmax: period4_08_tasmax,
											env_climate_tasmin: period4_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period4_09_pr,
											env_climate_tasmax: period4_09_tasmax,
											env_climate_tasmin: period4_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period4_10_pr,
											env_climate_tasmax: period4_10_tasmax,
											env_climate_tasmin: period4_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period4_11_pr,
											env_climate_tasmax: period4_11_tasmax,
											env_climate_tasmin: period4_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period4_12_pr,
											env_climate_tasmax: period4_12_tasmax,
											env_climate_tasmin: period4_12_tasmin
										}
									]
								}
							}
						},
						\`2081-2100\`: {
							\`MPI-ESM1-2-HR\`: {
								ssp370: {
									env_climate_bio01: period5_bio01,
									env_climate_bio02: period5_bio02,
									env_climate_bio03: period5_bio03,
									env_climate_bio04: period5_bio04,
									env_climate_bio05: period5_bio05,
									env_climate_bio06: period5_bio06,
									env_climate_bio07: period5_bio07,
									env_climate_bio08: period5_bio08,
									env_climate_bio09: period5_bio09,
									env_climate_bio10: period5_bio10,
									env_climate_bio11: period5_bio11,
									env_climate_bio12: period5_bio12,
									env_climate_bio13: period5_bio13,
									env_climate_bio14: period5_bio14,
									env_climate_bio15: period5_bio15,
									env_climate_bio16: period5_bio16,
									env_climate_bio17: period5_bio17,
									env_climate_bio18: period5_bio18,
									env_climate_bio19: period5_bio19,
									std_date_span_month: [
										{
											std_month: 1,
											env_climate_pr: 	period5_01_pr,
											env_climate_tasmax: period5_01_tasmax,
											env_climate_tasmin: period5_01_tasmin
										},
										{
											std_month: 2,
											env_climate_pr: 	period5_02_pr,
											env_climate_tasmax: period5_02_tasmax,
											env_climate_tasmin: period5_02_tasmin
										},
										{
											std_month: 3,
											env_climate_pr: 	period5_03_pr,
											env_climate_tasmax: period5_03_tasmax,
											env_climate_tasmin: period5_03_tasmin
										},
										{
											std_month: 4,
											env_climate_pr: 	period5_04_pr,
											env_climate_tasmax: period5_04_tasmax,
											env_climate_tasmin: period5_04_tasmin
										},
										{
											std_month: 5,
											env_climate_pr: 	period5_05_pr,
											env_climate_tasmax: period5_05_tasmax,
											env_climate_tasmin: period5_05_tasmin
										},
										{
											std_month: 6,
											env_climate_pr: 	period5_06_pr,
											env_climate_tasmax: period5_06_tasmax,
											env_climate_tasmin: period5_06_tasmin
										},
										{
											std_month: 7,
											env_climate_pr: 	period5_07_pr,
											env_climate_tasmax: period5_07_tasmax,
											env_climate_tasmin: period5_07_tasmin
										},
										{
											std_month: 8,
											env_climate_pr: 	period5_08_pr,
											env_climate_tasmax: period5_08_tasmax,
											env_climate_tasmin: period5_08_tasmin
										},
										{
											std_month: 9,
											env_climate_pr: 	period5_09_pr,
											env_climate_tasmax: period5_09_tasmax,
											env_climate_tasmin: period5_09_tasmin
										},
										{
											std_month: 10,
											env_climate_pr: 	period5_10_pr,
											env_climate_tasmax: period5_10_tasmax,
											env_climate_tasmin: period5_10_tasmin
										},
										{
											std_month: 11,
											env_climate_pr: 	period5_11_pr,
											env_climate_tasmax: period5_11_tasmax,
											env_climate_tasmin: period5_11_tasmin
										},
										{
											std_month: 12,
											env_climate_pr: 	period5_12_pr,
											env_climate_tasmax: period5_12_tasmax,
											env_climate_tasmin: period5_12_tasmin
										}
									]
								}
							}
						}
					}
				}
			`
			break

	} // switch(theWhat)

	return query

} // WorldClimIntersectsAQL()


module.exports = {
	WorldClimDistanceAQL,
	WorldClimContainsAQL,
	WorldClimIntersectsAQL
}
