'use strict'

/**
 * data.js
 *
 * This script contains the routes for the GCU data services.
 */

///
// Load modules.
///
const dd = require('dedent')
const joi = require('joi')
const {aql, db} = require('@arangodb')
const createRouter = require('@arangodb/foxx/router')

///
// Errors.
///
const status = require('statuses')
const httpError = require('http-errors')

//
// Error codes.
//
const HTTP_NOT_FOUND = status('not found');

///
// Query filters.
///
const queryFilters = require('../utils/queryFilters')

//
// Collections.
//
const collection_units = db._collection('Units')
const collection_chelsa = db._collection(module.context.configuration.collectionChelsa)
const collection_worldclim = db._collection(module.context.configuration.collectionWorldClim)
const collection_edo0 = db._collection(module.context.configuration.collectionDroughtObservatory)
const collection_edo_map = db._collection(module.context.configuration.collectionDroughtObservatoryMap)

///
// Models.
///

// Species list
const ModelUnitID = joi.string().regex(/[A-Z]{3}[0-9]{9}/)
const ModelSpeciesList = require('../models/containerSpeciesList')
const ModelSpeciesListDescription = dd`
	Provide the list of required species as an array of strings.`
const ModelUnitsList = require('../models/containerUnit')
const ModelUnitsListDescription = dd`
	The service returns a list of units records:
	- \`gcu_id_unit-id\`: The unit key.
	- \`gcu_id_number\`: The unit number.
	- \`gcu_loc_coordinates-restriction\`: Boolean indicating if coordinates are restricted.
	- \`gcu_loc_climate\`: GeoJSON Point for GCU climate.
	- \`species_list\`: List of target species.`
const ModelUnitClimate = require('../models/containerUnitClimate')
const ModelUnitClimateDescription = dd`
	The service returns the climate data of the unit:
	- \`Unit\`: The unit record.
	- \`Chelsa\`: The Chelsa climate data record.
	- \`WorldClim\`: WorldClim climate data record`
const ModelUnitSoil = require('../models/containerUnitSoil')
const ModelUnitSoilDescription = dd`
	The service returns the soil data of the unit:
	- \`Unit\`: The unit record.
	- \`Soil\`: List of soil data records grouped by bounding box size.`


///
// Create and export router.
///
const router = createRouter()
module.exports = router

///
// Tag router.
///
router.tag('Data')


/**
 * SERVICES
 */


/**
 * Query unit species.
 *
 * The service allows selecting units according to target species.
 * The service will return a list of matching Units keys.
 */
router.post(
	'species',
	(req, res) => {
		try{
			res.send(getUnitsBySpecies(req, res))
		} catch (error) {
			throw error                                                 // ==>
		}
	},
	'getUnitsBySpecies'
)
	.summary('Units by species')
	.description(dd`
		Get list of Units keys matching provided list of species.
	`)
	
	.body(ModelSpeciesList, ModelSpeciesListDescription)
	.response([ModelUnitsList], ModelUnitsListDescription)

/**
 * Get climate data.
 *
 * The service will return climate data for the provided unit.
 */
router.get(
	'climate',
	(req, res) => {
		try{
			res.send(getUnitClimate(req, res))
		} catch (error) {
			throw error                                                 // ==>
		}
	},
	'getUnitClimate'
)
	.summary('Unit climate')
	.description(dd`
		Get climate data of provided unit.
	`)
	
	.queryParam('gcu_id_unit-id', ModelUnitID)
	.response(ModelUnitClimate, ModelUnitClimateDescription)

/**
 * Get soil data.
 *
 * The service will return soil data for the provided unit.
 */
router.get(
	'soil',
	(req, res) => {
		try{
			res.send(getUnitSoil(req, res))
		} catch (error) {
			throw error                                                 // ==>
		}
	},
	'getUnitSoil'
)
	.summary('Unit soil')
	.description(dd`
		Get soil data of provided unit.
	`)
	
	.queryParam('gcu_id_unit-id', ModelUnitID)
	.response(ModelUnitSoil, ModelUnitSoilDescription)


/**
 * HANDLERS
 */


/**
 * Search units by species.
 *
 * This service allows querying units by species.
 *
 * @param request
 * @param response
 * @returns {[Object]}
 */
function getUnitsBySpecies(request, response)
{
	///
	// Get list of species.
	///
	const species = request.body.species_list
	
	///
	// Build query.
	///
	const query = aql`
		FOR doc IN ${collection_units}
			FILTER ${species} ANY IN doc.species_list
		RETURN {
			\`gcu_id_unit-id\`: doc._key,
			gcu_id_number: doc.gcu_id_number,
			\`gcu_loc_coordinates-restriction\`: doc.\`gcu_loc_coordinates-restriction\`,
			gcu_loc_climate: doc.gcu_loc_climate,
			species_list: doc.species_list
		}
	`
	
	///
	// Query.
	///
	return db._query(query).toArray()                                   // ==>
	
} // getUnitsBySpecies()

/**
 * Get unit climate.
 *
 * This service will return the climate data for the provided unit.
 *
 * @param request
 * @param response
 * @returns {[Object]}
 */
function getUnitClimate(request, response)
{
	///
	// Init local storage.
	///
	let query = aql``
	const data = {}
	
	///
	// Get unit.
	///
	const unit_id = request.queryParams['gcu_id_unit-id']
	query = aql`
		FOR doc IN ${collection_units}
		FILTER doc._key == ${unit_id}
		RETURN doc
	`
	const units = db._query(query).toArray()
	
	///
	// Handle query result.
	///
	if(units.length > 0)
	{
		///
		// Save unit record and climate point
		///
		const unit = units[0]
		const point = unit.gcu_loc_climate
		
		///
		// Add unit to data.
		///
		data['Unit'] = {
			'gcu_id_unit-id': unit['_key'],
			'gcu_id_number': unit['gcu_id_number'],
			'species_list': unit['species_list']
		}
		
		///
		// Check if climate point is defined.
		///
		if(unit.hasOwnProperty('gcu_loc_climate'))
		{
			///
			// Add unit climate point.
			///
			if(!unit['gcu_loc_coordinates-restriction']) {
				data['Unit']['gcu_loc_climate'] = unit['gcu_loc_climate']
			}
			
			///
			// Get Chelsa data.
			//
			query = aql`
				FOR dat IN ${collection_chelsa}
					FILTER GEO_INTERSECTS(
						${point},
						dat.geometry_bounds
					)
				RETURN {
					properties: dat.properties
				}
			`
			const data_chelsa = db._query(query).toArray()
			if(data_chelsa.length > 0) {
				data['Chelsa'] = data_chelsa[0].properties
			}
			
			///
			// Get Worldclim data.
			//
			query = aql`
				FOR dat IN ${collection_worldclim}
					FILTER GEO_INTERSECTS(
						${point},
						dat.geometry_bounds
					)
				RETURN {
					properties: dat.properties
				}
			`
			const data_worldclim = db._query(query).toArray()
			if(data_worldclim.length > 0) {
				data['WorldClim'] = data_worldclim[0].properties
			}
			
		} // Has climate point.
		
		return data                                                     // ==>
		
	} // Found unit.
	
	return {}
	
} // getUnitClimate()

/**
 * Get unit climate.
 *
 * This service will return the climate data for the provided unit.
 *
 * @param request
 * @param response
 * @returns {[Object]}
 */
function getUnitSoil(request, response)
{
	///
	// Init local storage.
	///
	let query = aql``
	const data = {}
	
	///
	// Get unit.
	///
	const unit_id = request.queryParams['gcu_id_unit-id']
	query = aql`
		FOR doc IN ${collection_units}
		FILTER doc._key == ${unit_id}
		RETURN doc
	`
	const units = db._query(query).toArray()
	
	///
	// Handle query result.
	///
	if(units.length > 0)
	{
		///
		// Save unit record and climate point
		///
		const unit = units[0]
		const point = unit.gcu_loc_climate
		
		///
		// Add unit to data.
		///
		data['Unit'] = {
			'gcu_id_unit-id': unit['_key'],
			'gcu_id_number': unit['gcu_id_number'],
			'species_list': unit['species_list']
		}
		
		///
		// Check if climate point is defined.
		///
		if(unit.hasOwnProperty('gcu_loc_climate'))
		{
			///
			// Add unit climate point.
			///
			if(!unit['gcu_loc_coordinates-restriction']) {
				data['Unit']['gcu_loc_climate'] = unit['gcu_loc_climate']
			}
			
			///
			// Get EDO data.
			//
			query = aql`
				FOR shape IN DroughtObservatoryMap
					FILTER GEO_INTERSECTS(${point}, shape.geometry)
					SORT shape.geometry_point_radius ASC
					
					LET data = (
					    FOR data IN DroughtObservatory
					        FILTER data.geometry_hash == shape._key
					        SORT data.std_date ASC
					    RETURN {
					      std_date: data.std_date,
					      properties: data.properties
					    }
					)
				
				RETURN {
				    geometry_point_radius: shape.geometry_point_radius,
				    data: data
				}
			`
			const data_soil = db._query(query).toArray()
			if(data_soil.length > 0) {
				data['Soil'] = data_soil[0]
			}
			
		} // Has climate point.
		
		return data                                                     // ==>
		
	} // Found unit.
	
	return {}
	
} // getUnitSoil()
