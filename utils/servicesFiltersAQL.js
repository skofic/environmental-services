'use strict'

///
// Modules.
///
const {db, aql} = require('@arangodb')


/**
 * This function can be used to retrieve the summary drought observatory
 * data related to the provided coordinates and selection criteria.
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
function EDOMetadata(theLatitude, theLongitude, theFilter = {})
{
	///
	// Collections.
	///
	const DroughtObservatory = db._collection(module.context.configuration.collectionDroughtObservatory)
	const DroughtObservatoryMap = db._collection(module.context.configuration.collectionDroughtObservatoryMap)

	///
	// Generate AQL filters.
	///
	const filter = EDOQueryFilter(theFilter)

	///
	// Generate query.
	///
	return aql`
		LET click = GEO_POINT(${theLongitude}, ${theLatitude})
		FOR shape IN ${DroughtObservatoryMap}
		    ${filter.shape}
		    
		    FOR data IN ${DroughtObservatory}
				${filter.data}
		    
			    COLLECT AGGREGATE start = MIN(data.std_date),
			                      end   = MAX(data.std_date),
			                      terms = UNIQUE(data.std_terms),
			                      sets = UNIQUE(data.std_dataset_ids),
			                      radius = UNIQUE(shape.geometry_point_radius),
			                      points = UNIQUE(shape.geometry_point),
			                      bounds = UNIQUE(shape.geometry),
			                      count = COUNT()
			                      
			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms)),
			        std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null),
			        geometry_point_radius: UNIQUE(FLATTEN(radius)),
			        geometry_point: UNIQUE(FLATTEN(points)),
			        geometry_bounds: UNIQUE(FLATTEN(bounds))
			    }
        `                                                               // ==>

} // EDOMetadata()

/**
 * This function can be used to retrieve the summary drought observatory
 * data related to the provided coordinates and selection criteria grouped
 * by measurement geometry.
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
function EDOMetadataByGeometry(theLatitude, theLongitude, theFilter = {})
{
	///
	// Collections.
	///
	const DroughtObservatory = db._collection(module.context.configuration.collectionDroughtObservatory)
	const DroughtObservatoryMap = db._collection(module.context.configuration.collectionDroughtObservatoryMap)

	///
	// Generate AQL filters.
	///
	const filter = EDOQueryFilter(theFilter)

	///
	// Generate query.
	///
	return aql`
		LET click = GEO_POINT(${theLongitude}, ${theLatitude})
		FOR shape IN ${DroughtObservatoryMap}
			${filter.shape}

			FOR data IN ${DroughtObservatory}
				${filter.data}

			    COLLECT bounds = shape.geometry,
			            points = shape.geometry_point,
			            radius = shape.geometry_point_radius

			    AGGREGATE start = MIN(data.std_date),
			              end   = MAX(data.std_date),
			              terms = UNIQUE(data.std_terms),
			              sets = UNIQUE(data.std_dataset_ids),
			              count = COUNT()

			    RETURN {
			        count: count,
			        std_date_start: start,
			        std_date_end: end,
			        std_terms: UNIQUE(FLATTEN(terms)),
			        std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null),
					geometry_point_radius: radius,
					geometry_point: points,
			        geometry_bounds: bounds
			    }
        `                                                               // ==>

} // EDOMetadataByGeometry()

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
function EDODataByGeometry(theLatitude, theLongitude, theFilter = {})
{
	///
	// Collections.
	///
	const DroughtObservatory = db._collection(module.context.configuration.collectionDroughtObservatory)
	const DroughtObservatoryMap = db._collection(module.context.configuration.collectionDroughtObservatoryMap)

	///
	// Generate AQL filters.
	///
	const filter = EDOQueryFilter(theFilter)

	///
	// Generate query.
	///
	return aql`
			LET click = GEO_POINT(${theLongitude}, ${theLatitude})
			FOR shape IN ${DroughtObservatoryMap}
				${filter.shape}

				FOR data IN ${DroughtObservatory}
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

} // EDODataByGeometry()

/**
 * This function can be used to generate the AQL query required to return
 * drought observatory data grouped by date.
 * The function expects the point coordinate provided in the path and
 * the filter provided as an object in the body: the function will return
 * the resulting AQL query.
 * The filter contains the following elements:
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - geometry_point_radius: the list of observation area radius (array of numbers).
 * - paging: Paging parameters as an object with `offset` and `limit` properties.
 *
 * Parameters:
 * - theLatitude {Number}: Point latitude.
 * - theLongitude {Number}: Point longitude.
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {String}: The AQL query (aql\`query\`).
 */
function EDODataByDate(theLatitude, theLongitude, theFilter = {})
{
	///
	// Collections.
	///
	const DroughtObservatory = db._collection(module.context.configuration.collectionDroughtObservatory)
	const DroughtObservatoryMap = db._collection(module.context.configuration.collectionDroughtObservatoryMap)

	///
	// Generate AQL filters.
	///
	const filter = EDOQueryFilter(theFilter)

	///
	// Collect paging parameters.
	///
	const paging = (filter.paging.hasOwnProperty('limit'))
		? aql`LIMIT ${filter.paging.offset}, ${filter.paging.limit}`
		: aql``

	///
	// Handle descriptors selection.
	///
	const properties = (filter.terms.length > 0)
		? aql`KEEP(MERGE_RECURSIVE(groups[*].data.properties), ${filter.terms})`
		: aql`MERGE_RECURSIVE(groups[*].data.properties)`
	const datasets   = (filter.terms.length > 0)
		? aql``
		: aql`,std_dataset_ids: UNIQUE(FLATTEN(sets))`

	///
	// Generate query.
	///
	return aql`
			LET click = GEO_POINT(${theLongitude}, ${theLatitude})
			FOR shape IN ${DroughtObservatoryMap}
				${filter.shape}
				
				FOR data IN ${DroughtObservatory}
					${filter.data}
			      
				    SORT data.std_date ASC
			  
				    COLLECT date = data.std_date
				    AGGREGATE sets = UNIQUE(data.std_dataset_ids)
				    INTO groups
				    
				    ${paging}
			
			RETURN {
			    std_date: date,
			    properties: ${properties}
			    ${datasets}
			}
 	`                                                                 // ==>

} // EDODataByDate()

/**
 * This function can be used to generate the AQL query required to return
 * GCU shape summary data related to the provided search criteria,
 * grouped by date span.
 * The function expects the filter provided as an object in the body,
 * the function will return the resulting AQL query.
 * The filter contains the following elements:
 * - geometry_hash_list: List of shape references.
 * - std_date_span: The date spans (array of strings).
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {String}: The AQL query (aql\`query\`).
 */
function ShapeMetadataBySpan(theFilter = {})
{
	///
	// Collections.
	///
	const Shapes = db._collection(module.context.configuration.collectionShapes)
	const ShapeData = db._collection(module.context.configuration.collectionShapeData)

	///
	// Generate AQL filters.
	///
	const filter = ShapesQueryFilter(theFilter)

	///
	// Generate query.
	///
	return aql`
		FOR shape IN ${Shapes}
			${filter.shape}

			FOR data IN ${ShapeData}
		        ${filter.data}

			    COLLECT span = data.std_date_span
			    AGGREGATE terms = UNIQUE(data.std_terms),
			              sets = UNIQUE(data.std_dataset_ids),
			              start = MIN(data.std_date),
			              end = MAX(data.std_date),
			              count = COUNT()

				RETURN {
				    count: count,
				    std_date_span: span,
				    std_date_start: start,
				    std_date_end: end,
				    std_terms: UNIQUE(FLATTEN(terms)),
				    std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null)
				}
        `                                                               // ==>

} // ShapeMetadataBySpan()

/**
 * This function can be used to generate the AQL query required to return
 * GCU shape summary data related to the provided search criteria,
 * grouped by shaoe and date span.
 * The function expects the filter provided as an object in the body,
 * the function will return the resulting AQL query.
 * The filter contains the following elements:
 * - geometry_hash_list: List of shape references.
 * - std_date_span: The date spans (array of strings).
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - paging: Paging parameters as an object with `offset` and `limit` properties.
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {String}: The AQL query (aql\`query\`).
 */
function ShapeMetadataByShape(theFilter = {})
{
	///
	// Collections.
	///
	const Shapes = db._collection(module.context.configuration.collectionShapes)
	const ShapeData = db._collection(module.context.configuration.collectionShapeData)

	///
	// Generate AQL filters.
	///
	const filter = ShapesQueryFilter(theFilter)

	///
	// Generate query.
	///
	return aql`
		FOR shape IN ${Shapes}
			${filter.shape}
			
			LET summary = (
				FOR data IN ${ShapeData}
			        ${filter.data}
	
				    COLLECT span = data.std_date_span
				    AGGREGATE terms = UNIQUE(data.std_terms),
				              sets = UNIQUE(data.std_dataset_ids),
				              start = MIN(data.std_date),
				              end = MAX(data.std_date),
				              count = COUNT()
	
					RETURN {
					    count: count,
					    std_date_span: span,
					    std_date_start: start,
					    std_date_end: end,
					    std_terms: UNIQUE(FLATTEN(terms)),
					    std_dataset_ids: REMOVE_VALUE(UNIQUE(FLATTEN(sets)), null)
					}
			)
			
			RETURN {
				geometry_hash: shape._key,
				properties: summary
			}
        `                                                               // ==>

} // ShapeMetadataByShape()

/**
 * This function can be used to generate the AQL query required to return
 * GCU shape data related to the provided search criteria,
 * grouped by shaoe and date span.
 * The function expects the filter provided as an object in the body,
 * the function will return the resulting AQL query.
 * The filter contains the following elements:
 * - geometry_hash_list: List of shape references.
 * - std_date_span: List of date spans (array of strings).
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - paging: Paging parameters as an object with `offset` and `limit` properties.
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 * - theShape: {String}: The shape reference.
 *
 * Returns:
 * - {String}: The AQL query (aql\`query\`).
 */
function ShapeDataByShape(theFilter, theShape = {})
{
	///
	// Collections.
	///
	const ShapeData = db._collection(module.context.configuration.collectionShapeData)

	///
	// Generate AQL filters.
	///
	const filter = ShapeQueryFilter(theFilter, theShape)

	///
	// Generate query.
	///
	return aql`
		FOR data IN ${ShapeData}
			${filter.data}
			
			SORT data.std_date_span, data.std_date ASC
			
			LET props = {
				std_date: data.std_date,
				properties: data.properties
			}
			
			COLLECT span = data.std_date_span
			INTO groups
			KEEP props
			
			RETURN {
				std_date_span: span,
				std_date_series: groups[*].props
			}
    `                                                                   // ==>

} // ShapeDataByShape()

/**
 * LOCAL FUNCTIONS
 */

/**
 * This function can be used to convert European Drought Observatory
 * query filters into a series of AQL filters.
 * The function expects the filter provided as an object in the body:
 * - std_date_span: Date span, daily, monthly and yearly.
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - geometry_point_radius: the list of observation area radius (array of numbers).
 * - paging: Query results paging information.
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {Object}: An object composed of four elements: `data` containing
 *             the AQL filter applying to the data, `shape` containing
 *             the AQL filter applying to the shape `terms` containing
 *             the list of requested variables and `paging` containing
 *             query paging information.
 */
function EDOQueryFilter(theFilter)
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
		],
		terms: [],
		paging: {}
	}

	///
	// Collect body parameters.
	///
	for(const [key, value] of Object.entries(theFilter)) {
		switch(key) {
			case 'std_date_span':
				filter.data.push(aql`FILTER ${value} ANY IN data.std_date_span`)
				break

			case 'std_date_start':
				filter.data.push(aql`FILTER data.std_date >= ${value}`)
				break

			case 'std_date_end':
				filter.data.push(aql`FILTER data.std_date <= ${value}`)
				break

			case 'std_terms':
				filter.terms.push(...value)
				filter.data.push(aql`FILTER ${value} ANY IN data.std_terms`)
				break

			case 'std_dataset_ids':
				filter.data.push(aql`FILTER ${value} ANY IN data.std_dataset_ids`)
				break

			case 'geometry_point_radius':
				filter.shape.push(aql`FILTER shape.geometry_point_radius IN ${value}`)
				break

			case 'paging':
				///
				// We check if there is limit, if so we normalise offset.
				///
				if(value.hasOwnProperty('limit')) {
					filter.paging['limit'] = value.limit
					if(! value.hasOwnProperty('offset')) {
						filter.paging['offset'] = 0
					} else {
						filter.paging.offset = value.offset
					}
				}
		}
	}

	return {
		data: aql.join(filter.data),
		shape: aql.join(filter.shape),
		terms: filter.terms,
		paging: filter.paging
	}                                                                   // ==>

} // EDOQueryFilter()

/**
 * This function can be used to convert remote sensing data query clauses
 * into a series of AQL filters.
 * The function expects the filter provided as an object in the body:
 * - std_date_span: Date span, daily, monthly and yearly.
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - geometry_point_radius: the list of observation area radius (array of numbers).
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 * - theShape {Object}: Shape reference.
 *
 * Returns:
 * - {Object}: An object composed of two elements: `data` containing
 *             the AQL filter applying to the data and `terms` containing
 *             the list of eventual requested variables.
 */
function ShapeQueryFilter(theFilter, theShape)
{
	///
	// Init filters.
	///
	const filter = {
		data: [
			aql`FILTER data.geometry_hash == ${theShape}`
		],
		terms: []
	}

	///
	// Collect body parameters.
	///
	for(const [key, value] of Object.entries(theFilter)) {
		switch(key) {
			case 'std_date_span':
				filter.data.push(aql`FILTER data.std_date_span IN ${value}`)
				break

			case 'std_date_start':
				filter.data.push(aql`FILTER data.std_date >= ${value}`)
				break

			case 'std_date_end':
				filter.data.push(aql`FILTER data.std_date <= ${value}`)
				break

			case 'std_terms':
				filter.terms.push(...value)
				filter.data.push(aql`FILTER ${value} ANY IN data.std_terms`)
				break

			case 'std_dataset_ids':
				filter.data.push(aql`FILTER ${value} ANY IN data.std_dataset_ids`)
				break
		}
	}

	return {
		data: aql.join(filter.data),
		terms: filter.terms
	}                                                                   // ==>

} // ShapeQueryFilter()

/**
 * This function can be used to convert remote sensing query clauses
 * into a series of AQL filters.
 * The function expects the filter provided as an object in the body:
 * - geometry_hash_list: List of shape identifiers (required array of strings).
 * - std_date_span: Date span, daily, monthly and yearly.
 * - std_date_start: The start date (string).
 * - std_date_end: The end date (string).
 * - std_terms: The list of variables (array of strings).
 * - std_dataset_ids: the list of dataset identifiers (array of strings).
 * - geometry_point_radius: the list of observation area radius (array of numbers).
 * - paging: Query results paging information.
 *
 * Note that the `geometry_hash_list` filter is mandatory.
 *
 * Parameters:
 * - theFilter {Object}: Query filter in body.
 *
 * Returns:
 * - {Object}: An object composed of four elements: `data` containing
 *             the AQL filter applying to the data, `shape` containing
 *             the AQL filter applying to the shape `terms` containing
 *             the list of requested variables and `paging` containing
 *             query paging information.
 */
function ShapesQueryFilter(theFilter)
{
	///
	// Init filters.
	///
	const filter = {
		data: [
			aql`FILTER data.geometry_hash == shape._key`
		],
		shape: [],
		terms: [],
		paging: {}
	}

	///
	// Collect body parameters.
	///
	for(const [key, value] of Object.entries(theFilter)) {
		switch(key) {
			case 'geometry_hash_list':
				filter.shape.push(aql`FILTER shape._key IN ${value}`)
				break

			case 'std_date_span':
				filter.data.push(aql`FILTER data.std_date_span IN ${value}`)
				break

			case 'std_date_start':
				filter.data.push(aql`FILTER data.std_date >= ${value}`)
				break

			case 'std_date_end':
				filter.data.push(aql`FILTER data.std_date <= ${value}`)
				break

			case 'std_terms':
				filter.terms.push(...value)
				filter.data.push(aql`FILTER ${value} ANY IN data.std_terms`)
				break

			case 'std_dataset_ids':
				filter.data.push(aql`FILTER ${value} ANY IN data.std_dataset_ids`)
				break

			case 'paging':
				///
				// We check if there is limit, if so we normalise offset.
				///
				if(value.hasOwnProperty('limit')) {
					filter.paging['limit'] = value.limit
					if(! value.hasOwnProperty('offset')) {
						filter.paging['offset'] = 0
					} else {
						filter.paging.offset = value.offset
					}
				}
		}
	}

	return {
		data: aql.join(filter.data),
		shape: aql.join(filter.shape),
		terms: filter.terms,
		paging: filter.paging
	}                                                                   // ==>

} // ShapesQueryFilter()


module.exports = {
	EDOMetadata,
	EDOMetadataByGeometry,
	EDODataByGeometry,
	EDODataByDate,
	ShapeMetadataBySpan,
	ShapeMetadataByShape,
	ShapeDataByShape
}
