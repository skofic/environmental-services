/**
 * constants.js
 * This file contains the constants used in the application.
 */

///
// Collections.
///
const documentCollections = {
	"chelsa": module.context.configuration.collectionChelsa,
	"worldclim": module.context.configuration.WorldClim,
	"shapes": module.context.configuration.Shapes,
	"shape_data": module.context.configuration.ShapeData,
	"unit_shapes": module.context.configuration.UnitShapes,
	"drought_observatory": module.context.configuration.DroughtObservatory,
	"drought_observatory_map": module.context.configuration.DroughtObservatoryMap,
	"dataset": module.context.configuration.Dataset
}
const edgeCollections = {}

///
// Views.
///
const views = {
	"shapes": {
		"name": module.context.configuration.viewShape,
		"type": "arangosearch",
		"properties": {
			"links": {
				"Shapes": {
					"analyzers": [
						"identity"
					],
					"fields": {
						"_key": {},
						"std_dataset_ids": {},
						"geometry": {
							"analyzers": [
								"geojson"
							]
						},
						"properties": {
							"fields": {
								"chr_AvElevation": {},
								"chr_AvSlope": {},
								"chr_StdElevation": {},
								"geo_shape_area": {},
								"chr_AvAspect": {}
							}
						},
					},
					"includeAllFields": false,
					"storeValues": "none",
					"trackListPositions": false
				}
			}
		}
	},
	"dataset": {
		"name": module.context.configuration.viewDataset,
		"type": "arangosearch",
		"properties": {
			"links": {
				"Dataset": {
					"analyzers": [
						"identity"
					],
					"fields": {
						"_key": {},
						"std_project": {},
						"std_dataset": {},
						"std_dataset_group": {},
						"std_date_end": {},
						"std_date_start": {},
						"std_date_submission": {},
						"count": {},
						"_collection": {},
						"_subject": {},
						"_subjects": {},
						"_classes": {},
						"_domain": {},
						"_tag": {},
						"_title": {
							"fields": {
								"iso_639_3_eng": {
									"analyzers": [
										"text_en",
										"identity"
									]
								}
							}
						},
						"_description": {
							"fields": {
								"iso_639_3_eng": {
									"analyzers": [
										"text_en",
										"identity"
									]
								}
							}
						},
						"_citation": {
							"fields": {
								"iso_639_3_eng": {
									"analyzers": [
										"text_en",
										"identity"
									]
								}
							}
						},
						"species_list": {
							"analyzers": [
								"text_en",
								"identity"
							]
						},
						"std_terms": {},
						"std_terms_key": {},
						"std_terms_quant": {},
						"std_terms_summary": {}
					},
					"includeAllFields": false,
					"storeValues": "id",
					"trackListPositions": false
				}
			}
		}
	}
}

///
// Exports.
///
module.exports = {
	documentCollections,
	edgeCollections,
	views
}
