# Environmental Data Services

This [repository](https://github.com/skofic/environmental-services.git) contains the [ArangoDB](https://www.arangodb.com/) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) for publishing *remote sensing* and *climate data* related to dynamic conservation units of forest trees, published in the [EUFGIS](http://www.eufgis.org) information system.

This work is being conducted for the [upgrade](https://www.forgenius.eu/eufgis) of the [EUFGIS](http://www.eufgis.org/) information system within the framework of the [FORGENIUS](https://www.forgenius.eu/) project.

## Database

The database is implemented using [ArangoDB](https://www.arangodb.com/). The data is not included in this repository, you will have to run a [Google Earth Engine](https://earthengine.google.com/) [Colab](https://colab.research.google.com/) sheet to populate the remote sensing data, while a series of scripts can be used to download, clip, process, combine and merge [Chelsa](https://chelsa-climate.org/), [WorldClim](https://worldclim.org/) and [EDO](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) data, it is available in [this](https://github.com/skofic/ClimateService.git) repository.

The database contains the following collections:

### Chelsa

[CHELSA](https://chelsa-climate.org) [version 2.1](https://chelsa-climate.org/wp-admin/download-page/CHELSA_tech_specification_V2.pdf) is based on a mechanistical statistical downscaling of global reanalysis data or global circulation model output, it is a [model](https://chelsa-climate.org/wp-admin/download-page/CHELSA_tech_specification_V2.pdf) that aims at representing reality as precise as possible. It provides high spatial resolution (30 arc seconds) grid of global weather and climate data for historical data, *1981-2010*, and future modelled climate scenarios.

Future climate scenarios come from the [Max Plank Institute Earth System Model](https://mpimet.mpg.de/en/research/department-climate-variability/earth-system-modeling-and-prediction) version [MPI-ESM1-2-HR](https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MPI-M.MPI-ESM1-2-HR), a [climate model](https://www.carbonbrief.org/cmip6-the-next-generation-of-climate-models-explained/) developed as part of the internationally-coordinated Coupled Model Intercomparison Project Phase 6 ([CMIP6](https://pcmdi.llnl.gov/CMIP6/)). The values were averages over 3 20 year periods: *2011-2040*, *2041-2070* and *2071-2100*. 

Shared Socioeconomic Pathways (SSPs) are climate change scenarios of projected socioeconomic global changes up to 2100 as defined in the IPCC Sixth Assessment Report on climate change in 2021. Of these the [Shared Socioeconomic Pathway](https://climatedata.ca/resource/understanding-shared-socio-economic-pathways-ssps/) [SSP3-RCP7](https://www.meteomatics.com/en/api/available-parameters/climate-data/#scenario3) was selected: *regional rivalry* (a rocky road).

*\"The world follows a path in which social, economic, and technological trends do not shift markedly from historical patterns. Development and income growth proceeds unevenly, with some countries making relatively good progress while others fall short of expectations. Global and national institutions work toward but make slow progress in achieving sustainable development goals. Environmental systems experience degradation, although there are some improvements and overall the intensity of resource and energy use declines. Global population growth is moderate and levels off in the second half of the century. Income inequality persists or improves only slowly and challenges to reducing vulnerability to societal and environmental changes remain.\"*

#### Data

The collection contains over 36 million data records, one for each grid cell. This data source is usually interrogated providing a point and selecting the grid cell that contains it. There are also services that provide a selection of grid cells within a specific distance range, contained by or intersecting a provided geometric shape, the results can also be aggregated.

The records are structured as follows:

```json
{
  "_key": "e017884385d8e18e97067453578f8bc3",
  "std_dataset_ids": [
    "4badf85d-270a-463c-89d3-04bc52d806bd"
  ],
  "geometry_point": {
    "type": "Point",
    "coordinates": [
       /* data */
    ]
  },
  "geometry_bounds": {
    "type": "Polygon",
    "coordinates": [
      /* data */
    ]
  },
  "properties": {
    "1981-2010": {
      /* data */
      "std_date_span_month": [
        /* data */
      ]
    },
    "2011-2040": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    },
    "2041-2070": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    },
    "2071-2100": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    }
  }
}
```

The `_key` represents the *primary key* of the record, it is the *MD5 hash* of the `geometry_bounds` field.

The `std_dataset_ids` field contains the list of all datasets present in the record; the values are references to the corresponding `Dataset` records.

The `geometry_point` contains the GeoJSON point coordinates of the center of the measurement grid cell.

The `geometry_bounds` contains the GeoJSON polygon coordinates of the grid cell.

The `properties` field contains all the data, it is subdivided into the four time periods:

- `1981-2010`: Historical data averaged for the period ranging from 1981 to 2010. At the top level we find yearly period averages and the `std_date_span_month` field contains monthly data averages for the same period.
- `2011-2040`: Modelled data for the period ranging from 2011 to 2040. The `MPI-ESM1-2-HR` and `ssp370` fields indicate respectively the *climate model* and the *shared socioeconomic pathway* used in the modelling. At the top level of the `ssp370` property we find yearly period averages and the `std_date_span_month` field contains monthly data averages for the same period.
- `2041-2070`: Modelled data for the period ranging from 2041 to 2070. The structure of the data is the same as the previously described section.
- `2071-2100`: Modelled data for the period ranging from 2071 to 2100. The structure of the data is the same as the previously described section.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git)

#### Indexes

Both the `geometry_point` and the `geometry_bounds` fields are indexed with type `geo`.

### WorldClim

[WorldClim](https://worldclim.org) version 2.1 is a database of high spatial resolution (30 arc seconds) global weather and climate data, it provides historical data, 1970-2000, and future modelled climate scenarios ranging from 2021 to 2100.

Future climate scenarios come from the [Max Plank Institute Earth System Model](https://mpimet.mpg.de/en/research/department-climate-variability/earth-system-modeling-and-prediction) version [MPI-ESM1-2-HR](https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MPI-M.MPI-ESM1-2-HR), a [climate model](https://www.carbonbrief.org/cmip6-the-next-generation-of-climate-models-explained/) developed as part of the internationally-coordinated Coupled Model Intercomparison Project Phase 6 ([CMIP6](https://pcmdi.llnl.gov/CMIP6/)). The monthly values were averages over 4 20 year periods, 2021-2040, 2041-2060, 2061-2080 and 2081-2100. 

Shared Socioeconomic Pathways (SSPs) are climate change scenarios of projected socioeconomic global changes up to 2100 as defined in the IPCC Sixth Assessment Report on climate change in 2021. Of these the [Shared Socioeconomic Pathway](https://climatedata.ca/resource/understanding-shared-socio-economic-pathways-ssps/) [SSP3-RCP7](https://www.meteomatics.com/en/api/available-parameters/climate-data/#scenario3) was selected: *regional rivalry* (a rocky road).

*\"The world follows a path in which social, economic, and technological trends do not shift markedly from historical patterns. Development and income growth proceeds unevenly, with some countries making relatively good progress while others fall short of expectations. Global and national institutions work toward but make slow progress in achieving sustainable development goals. Environmental systems experience degradation, although there are some improvements and overall the intensity of resource and energy use declines. Global population growth is moderate and levels off in the second half of the century. Income inequality persists or improves only slowly and challenges to reducing vulnerability to societal and environmental changes remain.\"*

#### Data

The collection contains over 21 million data records, one for each grid cell. This data source is usually interrogated providing a point and selecting the grid cell that contains it. There are also services that provide a selection of grid cells within a specific distance range, contained by or intersecting a provided geometric shape, the results can also be aggregated.

The data is structured as follows:

```json
{
  "_key": "aa4de6613be35882252cbd4a4ab80660",
  "std_dataset_ids": [
    "bf102320-3726-48d1-b3fc-421f131c6666"
  ],
  "geometry_point": {
    "type": "Point",
    "coordinates": [
      /* data */
    ]
  },
  "geometry_bounds": {
    "type": "Polygon",
    "coordinates": [
      /* data */
    ]
  },
  "properties": {
    "topography": {
      "geo_shape_elevation": /* data */
    },
    "1970-2000": {
      /* data */
      "std_date_span_month": [
        /* data */
      ]
    },
    "2021-2040": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    },
    "2041-2060": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    },
    "2061-2080": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    }
  },
    "2081-2100": {
      "MPI-ESM1-2-HR": {
        "ssp370": {
          /* data */
          "std_date_span_month": [
            /* data */
          ]
        }
      }
    }
  }
}
```

The `_key` represents the *primary key* of the record, it is the *MD5 hash* of the `geometry_bounds` field.

The `std_dataset_ids` field contains the list of all datasets present in the record; the values are references to the corresponding `Dataset` records.

The `geometry_point` contains the GeoJSON point coordinates of the center of the measurement grid cell.

The `geometry_bounds` contains the GeoJSON polygon coordinates of the grid cell.

The `properties` field contains all the data, it is subdivided into the four time periods:

- `topography`: This section contains the average elevation of the current grid cell, provided by WorldClim.
- `1970-2000`: Historical data averaged for the period ranging from 1970 to 2000. At the top level we find yearly period averages and the `std_date_span_month` field contains monthly data averages for the same period.
- `2021-2040`: Modelled data for the period ranging from 2021 to 2040. The `MPI-ESM1-2-HR` and `ssp370` fields indicate respectively the *climate model* and the *shared socioeconomic pathway* used in the modelling. At the top level of the `ssp370` property we find yearly period averages and the `std_date_span_month` field contains monthly data averages for the same period.
- `2041-2060`: Modelled data for the period ranging from 2041 to 2060. The structure of the data is the same as the previously described section.
- `2061-2080`: Modelled data for the period ranging from 2061 to 2080. The structure of the data is the same as the previously described section.
- `2081-2100`: Modelled data for the period ranging from 2081 to 2100. The structure of the data is the same as the previously described section.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

Both the `geometry_point` and the `geometry_bounds` fields are indexed with type `geo`.

### Shapes

Each dynamic conservation unit can be divided or partitioned into one or more geographic shapes of which averaged climatic and remote sensing data is made available. The idea is to distinguish specific topographic or biological regions, within the conservation unit, and link these polygons or multi-polygons to a set of data records contained in the `ShapeData` collection.

#### Data

Each record represents a shape that can either be a polygon or a multi-polygon. This collection serves the purpose of selecting the remote sensing geographic area of interest and features records with this structure:

```json
{
  "_key": "9ed33336159e121b4b0a733c09afa3c4",
  "std_dataset_ids": [
    /* data */
  ],
  "properties": {
    "chr_AvElevation": 720.3393477368861,
    "chr_AvSlope": 3.946183211837736,
    "chr_StdElevation": 15.414407563646472,
    "geo_shape_area": 211311.56794387152,
    "chr_AvAspect": 186.5400898699804
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [ /* data */ ]
  },
  "geometry_bounds": {
    "type": "Polygon",
    "geodesic": false,
    "coordinates": [ /* data */ ]
  }
}
```

The `_key` represents the *primary key* of the record, it is the *MD5 hash* of the `geometry_bounds` field.

The `std_dataset_ids` field contains the list of all datasets featuring data for the current record; the values are references to the corresponding `Dataset` records.

The `properties` field contains averaged topographic data related to the current shape area, `geometry`. Note that all *other* data referring to the shape is stored in the `ShapeData` collection.

The `geometry` contains the shape area in GeoJSON format. It may either be a `Polygon` or a `MultiPolygon`, in the latter case data is averaged on all enclosed polygons. All data referring to the current shape is averaged on this geometry.

The `geometry_bounds` contains the GeoJSON shape bounding box.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### View

This collection is referenced and indexed using a view:

```json
{
  "name": "VIEW_SHAPE",
  "type": "arangosearch",
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
        "properties": {
          "fields": {
            "chr_StdElevation": {},
            "geo_shape_area": {},
            "chr_AvAspect": {},
            "chr_AvElevation": {},
            "chr_AvSlope": {}
          }
        },
        "std_dataset_ids": {}
      },
      "includeAllFields": false,
      "storeValues": "none",
      "trackListPositions": false
    }
  }
}
```

### ShapeData

This collection contains all data related to the `Shapes` collection. All data is grouped by *shape*, *date span* and *date*.

#### Data

The collection currently contains over 47 million records, the size depends on the number of shapes and the date ranges. Each record represents the data of a shape, period (*either daily, monthly or annual*) and for a specific date:

```json
{
  "geometry_hash": "fffb23800ee30d6d375209178d2aa8fa",
  "std_date_span": "std_date_span_day",
  "std_date": "20020924",
  "properties": {
    "chr_RelHumid": 77.64464378356934,
    "env_climate_slhf": -523102.2151717557,
    "env_climate_snsrad": 2490879.274758454,
    "env_climate_soil_temp_100": 286.17160225885215,
    "env_climate_soil_temp_28": 281.53329886613614,
    "env_climate_soil_temp_289": 288.1548304327269,
    "env_climate_soil_temp_7": 280.5713157945008,
    "env_climate_soil_water_100": 0.1484261311344215,
    "env_climate_soil_water_28": 0.09974415854339987,
    "env_climate_soil_water_289": 0.24916233179223451,
    "env_climate_soil_water_7": 0.09919899777905027,
    "env_climate_tpr": 0.18919283813317658,
    "env_climate_wind": 3.872064370471018,
    "env_climate_temp-2m": 281.08772537483816
  },
  "std_terms": [
    "chr_RelHumid",
    "env_climate_wind",
    "env_climate_slhf",
    "env_climate_snsrad",
    "env_climate_soil_temp_100",
    "env_climate_tpr",
    "env_climate_soil_temp_28",
    "env_climate_soil_water_289",
    "env_climate_soil_temp_289",
    "env_climate_temp-2m",
    "env_climate_soil_temp_7",
    "env_climate_soil_water_100",
    "env_climate_soil_water_28",
    "env_climate_soil_water_7"
  ],
  "std_dataset_ids": [
    "5f9c61fc-8a82-41b5-b2ae-42c0068cfb6e"
  ]
}
```

The `geometry_hash` points to the `Shapes` record, it is the MD5 hash of the shape `geometry` property.

The `std_date_span` field represents the time period associated with the measurement: `std_date_span_day` for daily data, `std_date_span_month` for monthly averages and `std_date_span_year` for yearly averages.

The `std_date` field represents the measurement date in `YYYYMMDD` format, `Y` for year, `M` for month and `D` for day. Daily data requires the full date, monthly data can omit the month and yearly data can omit month and day.

The `properties` field contains the remote sensing data, above is an example. All remote sensing data is aggregated and grouped by *shape*, *span* and *date*.

The `std_terms` field contains the list of featured data properties.

The `std_dataset_ids` field contains the list of referenced datasets, the values are links to `Dataset` collection records.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

The collection features three indexes, besides the default primary key:

- An index comprising the `geometry_hash`, `std_date_span` and `std_date`, respectively representing the shape, the date span and the date. This index is *unique*.
- An index comprising the `geometry_hash` and `std_dataset_ids[*]`, respectively representing the shape and the individual dataset references.
- An index comprising the `geometry_hash` and `std_terms[*]`, respectively representing the shape and the individual featured data property names.

### UnitShapes

This collection links the unity identifiers to the shape identifiers, it is used to group all shapes belonging to a conservation unit and conservation unit version.

#### Data

The data contains the reference to the shape, the reference to the unit and the reference to the specific unit version:

```json
{
  "geometry_hash": "554a3bb9ef58e60223845bfa6e78a6ad",
  "gcu_id_number": "ALB00002",
  "gcu_id_unit-id": "ALB000022020"
}
```

The `geometry_hash` references the `Shapes` record primary key, it is the MD5 hash of the shape GeoJSON geometry.

The `gcu_id_number` is the unique identifier of the conservation unit.

The `gcu_id_unit-id` is the identifier of the specific data version of the unit; *each unit has a set of data corresponding to the observation date, the code is the unit ID and the observation year*.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

All fields feature an individual index: `geometry_hash`, `gcu_id_number` and `gcu_id_unit-id`.

### DroughtObservatory

This collection contains over 1.2 billion records from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) repository. It is a collection of measurements subdivided into a set of 1km., 5km. and 25 km. resolution grids covering the extended European region. Each record references a *specific layer cell* and *date*, all dates are daily.

#### Data

The records have the following structure:

```json
{
    "geometry_hash": "7e142bf917dbf13cd8c106142cabc9f9",
    "geometry_point_radius": 0.125,
    "geometry_point": {
      "type": "Point",
      "coordinates": [ /* data */ ]
    },
    "geometry_bounds": {
      "type": "Polygon",
      "coordinates": [ /* data */ ]
    },
    "std_date": "19991224",
    "properties": {
      "env_climate_hcwi_min": -20.879,
      "env_climate_hcwi_max": -18.879
    },
    "std_terms": [
      "env_climate_hcwi_max",
      "env_climate_hcwi_min"
    ],
    "std_dataset_ids": [
      "6b12011e-ef30-47d4-b4a3-3c8bdc4b4464"
    ]
  }
```

The `geometry_hash` references the record in the `DroughtObservatoryMap` collection that represents the grid cell, it is the MD5 hash of the `geometry` property in the `DroughtObservatoryMap` collection, which exists in this record in `geometry_bounds`.

The `geometry_point_radius` field represents the latitude radius, in decimal degrees, of the grid cell: it represents the grid resolution.

The `geometry_point` property contains the GeoJSON point of the grid cell center.

The `geometry_bounds` property contains the GeoJSON polygon of the grid cell.

The `std_date` field represents the measurement date in `YYYYMMDD` format, `Y` for year, `M` for month and `D` for day. All dates have a daily span.

The `properties` field contains the indicators, above is an example. All data is aggregated and grouped by *grid cell shape*and *date*.

The `std_terms` field contains the list of featured data properties.

The `std_dataset_ids` field contains the list of referenced datasets, the values are links to `Dataset` collection records.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Index

The collection features a *unique* index on the `geometry_hash` and `std_date` fields.

### DroughtObservatoryMap

This collection contains one record for each grid cell from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) repository, it contains almost 1.5 million records. It is used to select `DroughtObservatory` collection data according to location.

#### Data

Records follow this structure:

```json
{
  "_key": "2b79886df88dbac9822a7a1a00426fc2",
  "geometry": {
    "type": "Polygon",
    "coordinates": [ /* data */ ]
  },
  "geometry_point": {
    "type": "Point",
    "coordinates": [ /* data */ ]
  },
  "geometry_point_radius": 0.020833335
}
```

The `_key` field represents the record primary key, it is the MD5 hash of `geometry`.

The `geometry` field contains the GeoJSON geometry of the grid cell.

The `geometry_point` field contains the GeoJSON point representing the center of the grid cell.

The `geometry_point_radius` field represents the latitude radius, in decimal degrees, of the grid cell: it represents the grid resolution.

#### Index

The collection features a single Geo index on the `geometry` property.

### Dataset

This collection contains one record for each dataset featured in the database. A dataset represents a set of indicators belonging to the same repository, having the same resolution and sharing the same time series resolution. You have seen references to elements of this collection in almost all collections of the database.

#### Data

Records of this collection contain a set of fields that record the metadata of the dataset, this is a typical record example:

```json
{
  "_key": "4badf85d-270a-463c-89d3-04bc52d806bd",
  "_collection": "Chelsa",
  "std_project": "EUFGIS",
  "std_dataset": "CHELSA_V2.1",
  "std_dataset_group": "CLIMATE",
  "std_date_submission": "20210524",
  "std_date_start": "1981",
  "std_date_end": "2100",
  "_title": {
    "iso_639_3_eng": /* data */
  },
  "_description": {
    "iso_639_3_eng": /* data */
  },
  "_citation": [ /* data */ ],
  "_url": [ /* data */ ],
  "count": 36125747,
  "std_terms_key": [ /* data */ ],
  "std_terms": [ /* data */ ],
  "std_terms_quant": [ /* data */ ],
}
```

The `_key` contains the primary key of the record, here it is in UUID format, the contents do not matter as long as it is unique for each dataset.

The `_collection` contains the collection name in which data from the current dataset is stored. It is implied that all data in the dataset is stored in one collection.

The `std_project` represents the code of the project that is tasked to collect and provide data.

The `std_dataset` is the public identifier of the dataset. In the example we have the Chelsa version 2.1 dataset code.

The `std_dataset_group` is the identifier of the datasets group to which the current dataset belongs. In the example we assume there is a group of datasets that deal with climate data.

The `std_date_submission` contains the submission date of the dataset in `YYYYMMDD` format, `Y` for the year, `M` for the month and `D` for the day.

The `std_date_start` and `std_date_end` represent the time series start and end dates, also in `YYYYMMDD` format.

The `_title` contains the dataset title or label in Markdown format, note that `iso_639_3_eng` represents the english language code.

The `_description` contains the dataset full description in Markdown format, note that `iso_639_3_eng` represents the english language code.

The `_citation` is an array of Markdown texts that contain the required or recommended data citations.

The `_url` contains the internet references for the dataset.

The  `count` contains the dataset data record count.

The `std_terms_key` contains the list of fields that uniquely identify each record.

The `std_terms` contains the list of featured indicators.

The `std_terms_quant` contains the list of featured quantitative indicators.

#### View

The records are served and searched using a view:

```json
{
  "name": "VIEW_DATASET",
  "type": "arangosearch",
  "links": {
    "Dataset": {
      "analyzers": [
        "identity"
      ],
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
        "std_date_start": {},
        "_tag": {},
        "std_date_submission": {},
        "subjects": {},
        "count": {},
        "std_terms_quant": {},
        "std_dataset": {},
        "std_dataset_group": {},
        "_subjects": {},
        "_classes": {},
        "_collection": {},
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
        "_key": {},
        "std_date_end": {},
        "std_terms_key": {},
        "std_terms_summary": {},
        "_subject": {},
        "std_date": {},
        "_domain": {},
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
        "species_list": {
          "analyzers": [
            "text_en",
            "identity"
          ]
        },
        "std_terms": {},
        "std_project": {}
      },
      "includeAllFields": false,
      "storeValues": "id",
      "trackListPositions": false
    }
  }
}
```

You may have noticed that there are a more fields in the view than those shown in the example: this is because there are several types of datasets, each having some specific fields.

## Installation

1. You must first install ArangoDB or plan to use an existing installation.
2. You must create a new database that will be used to host the data and services.
3. Install 