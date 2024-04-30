'use strict'

///
// Modules.
///
const {aql} = require('@arangodb')


/**
 * This function can be used to generate the AQL query required to return
 * drought observatory data grouped by measurement geometry or resolution.
 * The function expects the point coordinate provided in the path and
 * the filter provided as an object in the body: the function will return
 * the resulting AQL query.
 * The filter contains the following elements:
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - geometry_point_radius: the list of observation area radius (array of numbers).
 *
 * Parameters:
 * - theLatitude {Number}: Point latitude.
 * - theLongitude {Number}: Point longitude.
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {String}: The AQL query (aql\`query\`).
 */
function DataByGeometry(theLatitude, theLongitude, theFilter = {})
{
	///
	// Generate AQL filters.
	///
	const filter = QueryFilter(theFilter)

	///
	// Generate query.
	///
	return aql`
			LET click = GEO_POINT(${theLongitude}, ${theLatitude})
			FOR shape IN DroughtObservatoryMap
				${filter.shape}
				
				FOR data IN DroughtObservatory
					${filter.data}
			      
			        SORT data.std_date ASC
			  
				    COLLECT radius = shape.geometry_point_radius,
				            bounds = shape.geometry,
				            point = shape.geometry_point
				    AGGREGATE sets = UNIQUE(data.std_dataset_ids)
				    INTO groups
			
			RETURN {
			    geometry_point_radius: radius,
			    geometry_point: point,
			    geometry_bounds: bounds,
			    std_dataset_ids: UNIQUE(FLATTEN(sets)),
			    properties: (
			        FOR doc IN groups[*].data
			        RETURN MERGE_RECURSIVE(
			            { std_date: doc.std_date },
			            doc.properties
			        )
			    )
			}
        `                                                               // ==>

} // DataByGeometry()

/**
 * This function can be used to convert query filter in body
 * to a series of AQL filters.
 * The function expects the filter provided as an object in the body:
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - geometry_point_radius: the list of observation area radius (array of numbers).
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {Object}: An object composed of two elements: `data` containing
 *             the AQL filter applying to the data and `shape` containing
 *             the AQL filter applying to the shape.
 */
function QueryFilter(theFilter)
{
	///
	// Init filters.
	///
	const filter = {
		data: [
			aql`FILTER data.geometry_hash == shape._key`
		],
		shape: [
			aql`FILTER GEO_INTERSECTS(click, shape.geometry)`
		]
	}

	///
	// Collect body parameters.
	///
	for(const [key, value] of Object.entries(theFilter)) {
		switch(key) {
			case 'std_date_start':
				filter.data.push(aql`FILTER data.std_date >= ${value}`)
				break

			case 'std_date_end':
				filter.data.push(aql`FILTER data.std_date <= ${value}`)
				break

			case 'std_terms':
				filter.data.push(aql`FILTER ${value} ANY IN data.std_terms`)
				break

			case 'std_dataset_ids':
				filter.data.push(aql`FILTER ${value} ANY IN data.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filter.shape.push(aql`FILTER shape.geometry_point_radius IN ${value}`)
				break
		}
	}

	return {
		data: aql.join(filter.data),
		shape: aql.join(filter.shape)
	}                                                                   // ==>

} // QueryFilter()


module.exports = {
	DataByGeometry
}
