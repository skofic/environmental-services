'use strict'

///
// Globals.
///
const {aql} = require('@arangodb')


/**
 * Create compare filter.
 *
 * This function creates a filter in which the target field will be compared to
 * the value depending on what value is passed in the third parameter:
 *
 *  - `EQ`: Equals.
 *  - `NE`: Not equals.
 *  - `GT`: Greater than.
 *  - `LT`: Less than.
 *  - `GE`: Greater than or equals.
 *  - `LE`: Less than or equals.
 *
 * The filter expects the search target to be a view and the document reference
 * is assumed to be `doc`.
 *
 * The result will be a `doc.field =<operator>> value` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {any}: Search value.
 * @param theOperator {String}: Filter operator.
 * @return {aql}: The filter clause.
 */
function filterCompare(
	theProperty,
	theValue,
	theOperator = 'EQ'
){
	///
	// Parse by operator.
	///
	switch(theOperator) {
		case "EQ":
			return aql`doc[${theProperty}] == ${theValue}`              // ==>
		case "NE":
			return aql`doc[${theProperty}] != ${theValue}`              // ==>
		case "GT":
			return aql`doc[${theProperty}] > ${theValue}`               // ==>
		case "LT":
			return aql`doc[${theProperty}] < ${theValue}`               // ==>
		case "GE":
			return aql`doc[${theProperty}] >= ${theValue}`              // ==>
		case "LE":
			return aql`doc[${theProperty}] <= ${theValue}`              // ==>
	}

	return null                                                         // ==>

} // filterCompare()

/**
 * Create range filter.
 *
 * This function creates a filter in which the target field must contain the
 * following structure:
 *  - `min`: the minimum limit,
 *  - `max`: the maximum limit,
 *  - `min_inc`: `true` means include minimum,
 *  - `max_inc`: `true` means include maximum.
 *
 * The filter expects the search target to be a view and the document reference
 * is assumed to be `doc`.
 *
 * The result will be a `IN_RANGE(field, min, max, inc_min, inc_max)` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {String}: Search tokens.
 * @return {aql}: The filter clause.
 */
function filterRange(
	theProperty,
	theValue
){
	return aql`
		IN_RANGE(
			doc[${theProperty}],
			${theValue.min}, ${theValue.max},
			${theValue.min_inc}, ${theValue.max_inc}
		)`                                                              // ==>

} // filterRange()

/**
 * Create date range filter.
 *
 * This function creates a filter to match date ranges, it expects the
 * provided value to be a structure with two elements: `std_date_start`,
 * representing the start date and `std_end_date` representing the end date.
 * The range is inclusive of the provided range bounds.
 *
 * Note that this filter is expected to be applied to records that feature
 * date ranges by featuring `std_start_date` and `std_end_date` fields at
 * the top level of the object.
 *
 * It is possible to omit one of the values.
 *
 * The filter expects the search target to be a view and the document reference
 * is assumed to be `doc`.
 *
 * The result will be a `doc.field >= min` and/or
 * `doc.field <= max` filter.
 *
 * @param theValue {Object}: Date range structure.
 * @return {aql}: The filter clause.
 */
function filterDateRange(
	theValue
){
	///
	// Collect filters.
	///
	const filters = []
	if(theValue.hasOwnProperty('std_date_start')) {
		filters.push(aql`doc.std_date_start >= ${theValue.std_date_start}`)
	}
	if(theValue.hasOwnProperty('std_date_end')) {
		filters.push(aql`doc.std_date_end <= ${theValue.std_date_end}`)
	}

	///
	// Handle two filters.
	///
	if(filters.length === 2) {
		return aql.join(filters, ' AND ')                               // ==>
	}

	///
	// Handle one filter.
	///
	if(filters.length === 1) {
		return filters[0]                                               // ==>
	}

	return null                                                         // ==>

} // filterDateRange()

/**
 * Create integer range filter.
 *
 * This function creates a filter to match integer ranges, it expects the
 * provided value to be a structure with two elements: `min`, representing the
 * lower bound date and `max` representing the upper bound.
 * The range is inclusive of the provided range bounds.
 *
 * It is possible to omit one of the values.
 *
 * The document reference is assumed to be `doc`.
 *
 * The result will be a `doc.field >= min` and/or
 * `doc.field <= max` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {Object}: Date range structure.
 * @return {aql}: The filter clause.
 */
function filterIntegerRange(
	theProperty,
	theValue
){
	///
	// Collect filters.
	///
	const filters = []
	if(theValue.hasOwnProperty('min')) {
		filters.push(aql`doc[${theProperty}] >= ${theValue.min}`)
	}
	if(theValue.hasOwnProperty('max')) {
		filters.push(aql`doc[${theProperty}] <= ${theValue.max}`)
	}

	///
	// Handle two filters.
	///
	if(filters.length === 2) {
		return aql.join(filters, ' AND ')                               // ==>
	}

	///
	// Handle one filter.
	///
	if(filters.length === 1) {
		return filters[0]                                               // ==>
	}

	return null                                                         // ==>

} // filterIntegerRange()

/**
 * Create list filter.
 *
 * This function creates a filter in which the target field is a scalar and
 * the filter value is an array of values to be matched.
 *
 * The filter expects the search target to be a view and the result will be
 * a string representing the SEARCH clause.
 *
 * The document reference is assumed to be `doc`.
 *
 * The result will be a `doc.field IN values` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {Array}: List of elements to match.
 * @return {aql}: The filter clause.
 */
function filterList(
	theProperty,
	theValue
){
	return aql`doc[${theProperty}] IN ${theValue}`                      // ==>

} // filterList()

/**
 * Create lists filter.
 *
 * This function creates a filter in which both the target field and the search
 * value are arrays.
 *
 * The last argument indicates whether matching should include *all* elements,
 * or if *any* of the search values may match.
 *
 * The filter expects the search target to be a view and the result will be
 * a string representing the SEARCH clause.
 *
 * The document reference is assumed to be `doc`.
 *
 * The result will be a `values ALL/ANY IN doc.field` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {Array}: List of elements to match.
 * @param doAll {Boolean}: `true` to match all values, `false` match any.
 * @return {aql}: The filter clause.
 */
function filterLists(
	theProperty,
	theValue,
	doAll = false
){
	return (doAll)
		? aql`${theValue.items} ALL IN doc[${theProperty}]`                   // ==>
		: aql`${theValue.items} ANY IN doc[${theProperty}]`                   // ==>

} // filterLists()

/**
 * Create pattern filter.
 *
 * This function creates a filter in which the target field is a string scalar
 * and the filter value is a wildcard pattern.
 *
 * The filter expects the search target to be a view and the document reference
 * is assumed to be `doc`.
 *
 * The result will be a `doc.field LIKE pattern` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {String}: Search pattern.
 * @return {aql}: The filter clause.
 */
function filterPattern(
	theProperty,
	theValue
){
	return aql`LIKE(doc[${theProperty}], ${theValue})`                     // ==>

} // filterPattern()

/**
 * Create keywords filter.
 *
 * This function creates a filter in which the target field must contain the
 * provided space delimited keywords.
 *
 * The filter expects the search target to be a view and the document reference
 * is assumed to be `doc`.
 *
 * The result will be a `ANALYZER(doc.field IN TOKENS(value, "text_en")` filter.
 *
 * @param theProperty {String}: Property name.
 * @param theValue {String}: Search tokens.
 * @param theAnalyzer {string}: Token analyzer.
 * @return {aql}: The filter clause.
 */
function filterTokens(
	theProperty,
	theValue,
	theAnalyzer = "text_en"
){
	return aql`
		ANALYZER(
			doc[${theProperty}] IN TOKENS(${theValue}, ${theAnalyzer}),
			${theAnalyzer}
		)`                                                              // ==>

} // filterTokens()


module.exports = {
	filterCompare,
	filterRange,
	filterDateRange,
	filterIntegerRange,
	filterList,
	filterLists,
	filterPattern,
	filterTokens
}
