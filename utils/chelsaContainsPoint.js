'use strict'

const {aql, db} = require('@arangodb')

/**
 * This script can be used to retrieve the AQL query required for selecting
 * the Chelsa data records whose centroids are contained by a reference geometry.
 *
 * Parameters:
 * - theGeometry {Object}: GeoJSON reference geometry, provide either a Polygon or a MultiPolygon.
 * - theWhat {String}: Query result: `KEY` geometry hash; `SHAPE` geometries; `DATA` all properties; `MEAN` the average of all quantitative  properties.
 * - theStart {Integer}: The results start index, 0 based. Default: 0. Only relevant for theWhat != MEAN.
 * - theLimit {Integer}: Number of records to return. Default 25. Only relevant for theWhat != MEAN.
 */
