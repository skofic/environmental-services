///
// Service that does not work.
// Need to check it out.
///

/**
 * Get remote sensing data by geometry_hash, date range, spans and variable names.
 *
 * This service will return remote sensing data related to the provided unit shape,
 * the data
 *
 * This service will return remote sensing data for the provided unit shape
 * where the provided observation variables are featured in observations,
 * where the time range lies between the provided start and end dates,
 * where the time span is among the provided daily, monthly and annual time spans,
 * the resulting data will be grouped by time span.
 *
 * Parameters:
 * - `:shape`: The key of the unit shape.
 * - ':startDate': The start date.
 * - ':endDate': The end date.
 * - body.std_date_span: The list of spans.
 * - body.std_terms: The list of descriptors.
 */
const ModelBodySpanDescriptors = require("../models/remoteSensingBodySpanDescriptors");
const ModelData = require("../models/remoteSensingData");

router.post('span/terms/:shape/:startDate/:endDate', function (req, res)
{
	///
	// Parameters.
	///
	const shape = req.pathParams.key
	const startDate = req.pathParams.startDate
	const endDate = req.pathParams.endDate
	const spans = req.body.std_date_span
	const terms = req.body.std_terms

	///
	// Perform service.
	///
	let result
	///
	// MILKO - This questy fails here, but works outside of service.
	//         Need to find the reason, hopefully my error and not a bug.
	///
	try {
		result = db._query(aql`
			FOR doc IN VIEW_SHAPE_DATA
				SEARCH  doc.geometry_hash == ${shape} AND
			    		doc.std_terms IN ${terms} AND
			            doc.std_date >= ${startDate} AND
			            doc.std_date <= ${endDate} AND
			            doc.std_date_span == ${spans}
			    SORT doc.std_date
			    LET data = {
			        std_date: doc.std_date,
			        properties: KEEP(doc.properties, ${terms})
			    }
			    COLLECT span = doc.std_date_span
			    INTO groups
			    KEEP data
			RETURN {
			    std_date_span: span,
			    std_date_series: groups[*].data
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
	res.send(result);

}, 'list')
	.pathParam('shape', geometryHashSchema)
	.pathParam('startDate', startDateSchema)
	.pathParam('endDate', endDateSchema)
	.body(ModelBodySpanDescriptors, "The list of requested *observation variable names* and the list of *requested time spans*.")
	.response([ModelData], ModelDataDescription)
	.summary('Get remote sensing data by unit shape, date range, time spans and observation variables, grouped by time span')
	.description(dd`
  Retrieves remote sensing data for the provided *unit shape*, for the provided *date range*, for the provided *time spans* and for the provided *list of observation variables*.

Provide the *geometry ID* of the *unit shape*, the *start* and *end* dates of the *requested time period*, one or more *time span codes* and one or more *observation variable names*.

The returned data will only feature the provided variables and time spans, if found.
`)
