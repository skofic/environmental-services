/**
 * constants.js
 * This file contains the constants used in the application.
 */

///
// Collections.
///
const documentCollections = {
	"chelsa": "Chelsa",
	"worldclim": "WorldClim",
	"shapes": "Shapes",
	"shape_data": "ShapeData",
	"unit_shapes": "UnitShapes",
	"drought_observatory": "DroughtObservatory",
	"drought_observatory_map": "DroughtObservatoryMap",
	"dataset": "Dataset"
}
const edgeCollections = {}

///
// Views.
///
const views = {
	"shapes": {
		"name": "VIEW_SHAPE",
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
		"name": "VIEW_DATASET",
		"type": "arangosearch",
		"properties": {
			"links": {
				"Dataset": {
					"analyzers": [
						"identity"
					],
					"fields": {
						"_key": {},
						"count": {},
						"_collection": {},
						"_domain": {},
						"_tag": {},
						"_classes": {},
						"_subject": {},
						"_subjects": {},
						"std_project": {},
						"std_dataset_group": {},
						"std_dataset": {},
						"std_date": {},
						"std_date_end": {},
						"std_date_start": {},
						"std_date_submission": {},
						"std_terms": {},
						"std_terms_key": {},
						"std_terms_summary": {},
						"std_terms_quant": {},
						"subjects": {},
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
						}
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
