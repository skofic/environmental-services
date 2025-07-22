/**
 * constants.js
 * This file contains the constants used in the application.
 */

///
// Collections.
///
const documentCollections = {
	"chelsa": module.context.configuration.collectionChelsa,
	"dataset": module.context.configuration.collectionDataset,
	"drought_observatory": module.context.configuration.collectionDroughtObservatory,
	"drought_observatory_map": module.context.configuration.collectionDroughtObservatoryMap,
	"shape_data": module.context.configuration.collectionShapeData,
	"shapes": module.context.configuration.collectionShapes,
	"unit_data": module.context.configuration.collectionUnitData,
	"unit_shapes": module.context.configuration.collectionUnitShapes,
	"unit": module.context.configuration.collectionUnit,
	"worldclim": module.context.configuration.collectionWorldClim,
	"terms": module.context.configuration.collectionTerm
}
const edgeCollections = {
	"edges": module.context.configuration.collectionEdge,
	"links": module.context.configuration.collectionLink
}

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
						"geometry": {
							"analyzers": [
								"geojson"
							]
						},
						"geometry_bounds": {
							"analyzers": [
								"geojson"
							]
						},
						"properties": {
							"fields": {
								"chr_AvElevation": {},
								"chr_StdElevation": {},
								"gcu_id_number": {},
								"chr_AvSlope": {},
								"geo_shape_area": {},
								"chr_AvAspect": {},
								"chr_MinElevation": {},
								"chr_MaxElevation": {}
							}
						}
					},
					"includeAllFields": false,
					"storeValues": "none",
					"trackListPositions": false
				}
			}
		}
	},
	"units": {
		"name": module.context.configuration.viewUnitsShape,
		"type": "arangosearch",
		"properties": {
			"links": {
				"UnitPolygons": {
					"analyzers": [
						"identity"
					],
					"fields": {
						"_key": {},
						"geometry": {
							"analyzers": [
								"geojson"
							]
						},
						"geometry_bounds": {
							"analyzers": [
								"geojson"
							]
						},
						"geometry_hash_list": {},
						"properties": {
							"fields": {
								"chr_AvElevation": {},
								"chr_StdElevation": {},
								"gcu_id_number": {},
								"chr_AvSlope": {},
								"geo_shape_area": {},
								"chr_AvAspect": {},
								"chr_MinElevation": {},
								"chr_MaxElevation": {}
							}
						}
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
						"_collection_list": {},
						"std_project": {},
						"std_dataset": {},
						"std_dataset_group": {},
						"std_date_submission": {},
						"std_date_start": {},
						"std_date_end": {},
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
						"_url": {},
						"count": {},
						"std_terms": {},
						"std_terms_key": {},
						"std_terms_quant": {},
						"std_dataset_scope": {},
						"std_dataset_extent": {}
					},
					"includeAllFields": false,
					"storeValues": "id",
					"trackListPositions": false
				}
			}
		}
	},
	"terms": {
		"name": module.context.configuration.viewTerm,
		"type": "arangosearch",
		"properties": {
			"links": {
				"terms": {
					"analyzers": [
						"identity"
					],
					"fields": {
						"_key": {},
						"_code": {
							"fields": {
								"_nid": {
									"analyzers": [
										"identity",
										"text_en"
									]
								},
								"_lid": {
									"analyzers": [
										"identity",
										"text_en"
									]
								},
								"_gid": {
									"analyzers": [
										"identity",
										"text_en"
									]
								},
								"_aid": {},
								"_pid": {
									"analyzers": [
										"identity",
										"text_en"
									]
								},
								"_name": {
									"analyzers": [
										"identity",
										"text_en"
									]
								}
							}
						},
						"_info": {
							"fields": {
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
								"_definition": {
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
								"_examples": {
									"fields": {
										"iso_639_3_eng": {
											"analyzers": [
												"text_en",
												"identity"
											]
										}
									}
								},
								"_notes": {
									"fields": {
										"iso_639_3_eng": {
											"analyzers": [
												"text_en",
												"identity"
											]
										}
									}
								},
								"_provider": {
									"analyzers": [
										"text_en",
										"identity"
									]
								}
							}
						},
						"_data": {
							"fields": {
								"_tag": {
									"analyzers": [
										"identity",
										"text_en"
									]
								},
								"_domain": {},
								"_subject": {},
								"_list": {},
								"_class": {}
							}
						},
						"_rule": {
							"fields": {
								"_required": {
									"fields": {
										"_selection-descriptors_any": {},
										"_selection-descriptors_one": {},
										"_selection-descriptors_one-none": {},
										"_selection-descriptors_one-none-of": {},
										"_selection-descriptors_all": {}
									}
								},
								"_recommended": {
									"fields": {
										"_selection-descriptors_any": {},
										"_selection-descriptors_one": {},
										"_selection-descriptors_one-none": {},
										"_selection-descriptors_one-none-of": {},
										"_selection-descriptors_all": {}
									}
								},
								"_banned": {},
								"_computed": {}
							}
						}
					},
					"includeAllFields": false,
					"storeValues": "none",
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
