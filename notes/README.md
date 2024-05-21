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

This collection contains over 1.2 billion records from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) repository. It is a collection of measurements subdivided into a set of 1km., 5km. and 25 km. resolution grids covering the European region. Each record references a *specific layer cell* and *date*, all dates are daily.

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

1. You must first [install](https://docs.arangodb.com/stable/operations/installation/) [ArangoDB](https://arangodb.com) or plan to use an existing deployment.
2. You must create a new database that will be used to host the data and services.
3. Install the [Foxx micro services](https://docs.arangodb.com/stable/develop/foxx-microservices/), here are the instructions using the web interface:
    ![](/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/env/APP/images/1-AddService.png)
    Create a new service by clicking the Add Service button,
    ![](/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/env/APP/images/2-SelectService.png)
    Select the GitHub option and and fill as in the above image, press install,
    ![](/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/env/APP/images/3-MountPoint.png)
    Set the mount point as you wish, remember to keep the Run setup? checkbox selected: this will create the collections, indexes and views.

## Services

Once the services are installed you will have an empty configured database and microservices to query the data. To fill the data refer to this [repository](https://github.com/skofic/ClimateService.git).

The directory containing the services has the following elements:

- **`api`**: This directory contains a set of microservices definition documents, of which `GeoService API Document.paw`, a [RapidAPI](https://rapidapi.com) document, is the original. The directory contains also a [Postman](https://www.postman.com) version. The files contain example service calls.
- **`images`**: Images used in this README.md file.
- **`notes`**: Miscellaneous notes and files.

*All other files and directories* represent the source files, please refer to the [Foxx microservices documentation](https://docs.arangodb.com/stable/develop/foxx-microservices/) for more information.

The microservices are divided into the following sections:

### Chelsa

This section contains the services used to query and aggregate [Chelsa](https://chelsa-climate.org) data. Each record represents a 30 seconds arc grid cell containing historic and future modelled data covering yearly and monthly statistics.

Records are structured as follows:

- **`geometry_hash`**: This is the MD5 hash of the geometry_bounds property, it represents the primary key of the record.
- **`geometry_point`**: This is the GeoJSON point corresponding to the center of the measurement area.
- **`geometry_bounds`**: This is the GeoJSON polygon corresponding to the measurement area.
- **`properties`**: This contains the data properties, this is the list of indicators:
    - ***`env_climate_ai`***: Aridity index.
    - ***`env_climate_bio01`***: Mean annual air temperature.
    - ***`env_climate_bio02`***: Mean diurnal air temperature range.
    - ***`env_climate_bio03`***: Isothermality.
    - ***`env_climate_bio04`***: Temperature seasonality.
    - ***`env_climate_bio05`***: Mean daily maximum air temperture of the warmest month.
    - ***`env_climate_bio06`***: Mean daily minimum air temperature of the coldest month.
    - ***`env_climate_bio07`***: Annual range of air temperature.
    - ***`env_climate_bio08`***: Mean daily mean air tempertures of the wettest quarter.
    - ***`env_climate_bio09`***: Mean daily mean air tempertures of the driest quarter.
    - ***`env_climate_bio10`***: Mean daily mean air tempertures of the warmest quarter.
    - ***`env_climate_bio11`***: Mean daily mean air tempertures of the coldest quarter.
    - ***`env_climate_bio12`***: Annual precipitation amount.
    - ***`env_climate_bio13`***: Precipitation amount of the wettest month.
    - ***`env_climate_bio14`***: Precipitation amount of the driest month.
    - ***`env_climate_bio15`***: Precipitation seasonality.
    - ***`env_climate_bio16`***: Mean monthly precipitation amount of the wettest quarter.
    - ***`env_climate_bio17`***: Mean monthly precipitation amount of the driest quarter.
    - ***`env_climate_bio18`***: Mean monthly precipitation amount of the warmest quarter.
    - ***`env_climate_bio19`***: Mean monthly precipitation amount of the coldest quarter.
    - ***`env_climate_clt_max`***: Maximum monthly total cloud cover.
    - ***`env_climate_clt_mean`***: Mean monthly total cloud cover.
    - ***`env_climate_clt_min`***: Minimum monthly total cloud cover.
    - ***`env_climate_clt_range`***: Annual range of monthly total cloud cover.
    - ***`env_climate_cmi_max`***: Maximum monthly climate moisture index.
    - ***`env_climate_cmi_mean`***: Mean monthly climate moisture index.
    - ***`env_climate_cmi_min`***: Minimum monthly climate moisture index.
    - ***`env_climate_cmi_range`***: Annual range of monthly climate moisture index.
    - ***`env_climate_fcf`***: Frost change frequency.
    - ***`env_climate_fgd`***: First day of the growing season.
    - ***`env_climate_gdd0`***: Growing degree days heat sum above 0°C.
    - ***`env_climate_gdd10`***: Growing degree days heat sum above 10°C.
    - ***`env_climate_gdd5`***: Growing degree days heat sum above 5°C.
    - ***`env_climate_gddlgd0`***: Last growing degree day above 0°C.
    - ***`env_climate_gddlgd10`***: Last growing degree day above 10°C.
    - ***`env_climate_gddlgd5`***: Last growing degree day above 5°C.
    - ***`env_climate_gdgfgd0`***: First growing degree day above 0°C.
    - ***`env_climate_gdgfgd10`***: First growing degree day above 10°C.
    - ***`env_climate_gdgfgd5`***: First growing degree day above 5°C.
    - ***`env_climate_gsl`***: Growing season length.
    - ***`env_climate_gsp`***: Accumulated precipiation amount on growing season days.
    - ***`env_climate_gst`***: Mean temperature of the growing season.
    - ***`env_climate_hurs_max`***: Maximum monthly near-surface relative humidity.
    - ***`env_climate_hurs_mean`***: Mean monthly near-surface relative humidity.
    - ***`env_climate_hurs_min`***: Minimum monthly near-surface relative humidity.
    - ***`env_climate_hurs_range`***: Annual range of monthly near-surface relative humidity.
    - ***`env_climate_kg0`***: Köppen-Geiger climate classification (kg0).
    - ***`env_climate_kg1`***: Köppen-Geiger climate classification (kg1).
    - ***`env_climate_kg2`***: Köppen-Geiger climate classification (kg2).
    - ***`env_climate_kg3`***: Köppen-Geiger climate classification (kg3).
    - ***`env_climate_kg4`***: Köppen-Geiger climate classification (kg4).
    - ***`env_climate_kg5`***: Köppen-Geiger climate classification (kg5).
    - ***`env_climate_lgd`***: Last day of the growing season.
    - ***`env_climate_ngd0`***: Number of growing degree days above 0°C.
    - ***`env_climate_ngd10`***: Number of growing degree days above 10°C.
    - ***`env_climate_ngd5`***: Number of growing degree days above 5°C.
    - ***`env_climate_npp`***: Net primary productivity.
    - ***`env_climate_pet_penman_max`***: Maximum monthly potential evapotranspiration.
    - ***`env_climate_pet_penman_mean`***: Mean monthly potential evapotranspiration.
    - ***`env_climate_pet_penman_min`***: Minimum monthly potential evapotranspiration.
    - ***`env_climate_pet_penman_range`***: Annual range of monthly potential evapotranspiration.
    - ***`env_climate_rsds_max`***: Maximum monthly surface downwelling shortwave flux in air.
    - ***`env_climate_rsds_mean`***: Mean monthly surface downwelling shortwave flux in air.
    - ***`env_climate_rsds_min`***: Minimum monthly surface downwelling shortwave flux in air.
    - ***`env_climate_rsds_range`***: Annual range of monthly surface downwelling shortwave flux in air.
    - ***`env_climate_sfcWind_max`***: Maximum monthly near-surface wind speed.
    - ***`env_climate_sfcWind_mean`***: Mean monthly near-surface wind speed.
    - ***`env_climate_sfcWind_min`***: Minimum monthly near-surface wind speed.
    - ***`env_climate_sfcWind_range`***: Annual range of monthly near-surface wind speed.
    - ***`env_climate_swb`***: Soil water balance.
    - ***`env_climate_swe`***: Snow water equivalent.
    - ***`env_climate_vpd_max`***: Maximum monthly vapor pressure deficit.
    - ***`env_climate_vpd_mean`***: Mean monthly vapor pressure deficit.
    - ***`env_climate_vpd_min`***: Minimum monthly vapor pressure deficit.
    - ***`env_climate_vpd_range`***: Annual range of monthly vapor pressure deficit.

This `properties` field is divided into four sections:

- `1981-2010`: Data averages for the period starting in 1981 and ending in 2010. Monthly data is available under the `std_date_span_month` property.
- `2011-2040`: Future modelled averages for the period starting in 2011 and ending in 2040. This property contains two additional child sections that indicate respectively the climate scenario model and the shared socioeconomic pathway used to calculate the values, the indicators are found under the latter level. See the database Chelsa data section in this document for more information.
- `2041-2070`: Future modelled averages for the period starting in 2041 and ending in 2070, the structure is the same as the previous section.
- `2071-2100`: Future modelled averages for the period starting in 2071 and ending in 2100, the structure is the same as the previous section.

#### Get data corresponding to the provided coordinates

This service can be used to get the Chelsa record corresponding to the provided coordinates, the service expects the latitude, `lat`, and longitude, `lon`, in decimal degrees, provided as *query parameters*. The service will return the record whose measurement bounding box, `geometry_bounds`, contains that point.

#### Get selection or aggregation of records within a distance range

The service will select all Chelsa records that lie within a *distance range* from the provided *reference geometry* query parameter, `geometry`. The distance is calculated from the *wgs84 centroids* of both the *reference geometry* and the Chelsa measurement area center, `geometry_point`.

The service expects the following *query path parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the list of geometry hashes, `geometry_hash`, or primary key values.
        -  `SHAPE`: Returns the geometry information of the selected records:
            - `geometry_hash`: The MD5 hash of the GeoJSON measurement area polygon, or record primary key.
            - `distance`: The distance in meters between the centroid of the provided reference geometry and the record's `geometry_point`.
            - `geometry_point`: The GeoJSON center point of the measurement area, `geometry_bounds`.
            - `geometry_bounds`: The GeoJSON polygon corresponding to the measurement area.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the number of records in the selection; `distance`, the aggregated distance according to the `what` parameter and `properties`, containing the indicators as described above in the `properties` field aggregated according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.
- `min`: This *required* parameter represents the range's *minimum distance*. The value is inclusive.
- `max`: This *required* parameter represents the range's *maximum distance*. The value is inclusive.
- `sort`: This *optional* parameter determines whether results should be *sorted* and in what *order*. The parameter is relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`. The sort order is determined by the *distance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the GeoJSON *reference geometry* whose *centroid* will be used to select all Chelsa records *within* the provided *distance range*. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records contained by the provided geometry

The service will select all Chelsa records whose measurement area centers, `geometry_point`, are *fully contained* by the provided *reference geometry* query parameter, `geometry`.

The service expects the following *query path parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the list of geometry hashes, `geometry_hash`, or primary key values.
        -  `SHAPE`: Returns the geometry information of the selected records:
            - `geometry_hash`: The MD5 hash of the GeoJSON measurement area polygon, or record primary key.
            - `geometry_point`: The GeoJSON center point of the measurement area, `geometry_bounds`.
            - `geometry_bounds`: The GeoJSON polygon corresponding to the measurement area.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the number of records in the selection and `properties`, containing the indicators as described above in the `properties` field aggregated according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the GeoJSON *reference geometry* that should contain the Chelsa record `geometry_point` coordinates. It may be a *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records intersecting with the provided geometry

The service will select all Chelsa records whose measurement area, `geometry_bounds`, *intersect* with the provided *reference geometry* query parameter, `geometry`.

The service expects the following *query path parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the list of geometry hashes, `geometry_hash`, or primary key values.
        -  `SHAPE`: Returns the geometry information of the selected records:
            - `geometry_hash`: The MD5 hash of the GeoJSON measurement area polygon, or record primary key.
            - `geometry_point`: The GeoJSON center point of the measurement area, `geometry_bounds`.
            - `geometry_bounds`: The GeoJSON polygon corresponding to the measurement area.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the number of records in the selection and `properties`, containing the indicators as described above in the `properties` field aggregated according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the GeoJSON *reference geometry* that should contain the Chelsa record `geometry_point` coordinates. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

### WorldClim

This section contains the services used to query and aggregate [WorldClim](https://worldclim.org) data. Each record represents a 30 seconds arc grid cell containing historic and future modelled data covering yearly and monthly statistics.

Records are structured as follows:

- **`geometry_hash`**: This is the MD5 hash of the geometry_bounds property, it represents the primary key of the record.
- **`geometry_point`**: This is the GeoJSON point corresponding to the center of the measurement area.
- **`geometry_bounds`**: This is the GeoJSON polygon corresponding to the measurement area.
- **`properties`**: This contains the data properties, this is the list of indicators:
    - ***`geo_shape_elevation`***: Mean elevation for the measurement area.
    - ***`env_climate_bio01`***: Mean annual air temperature.
    - ***`env_climate_bio02`***: Mean diurnal air temperature range.
    - ***`env_climate_bio03`***: Isothermality.
    - ***`env_climate_bio04`***: Temperature seasonality.
    - ***`env_climate_bio05`***: Mean daily maximum air temperture of the warmest month.
    - ***`env_climate_bio06`***: Mean daily minimum air temperature of the coldest month.
    - ***`env_climate_bio07`***: Annual range of air temperature.
    - ***`env_climate_bio08`***: Mean daily mean air tempertures of the wettest quarter.
    - ***`env_climate_bio09`***: Mean daily mean air tempertures of the driest quarter.
    - ***`env_climate_bio10`***: Mean daily mean air tempertures of the warmest quarter.
    - ***`env_climate_bio11`***: Mean daily mean air tempertures of the coldest quarter.
    - ***`env_climate_bio12`***: Annual precipitation amount.
    - ***`env_climate_bio13`***: Precipitation amount of the wettest month.
    - ***`env_climate_bio14`***: Precipitation amount of the driest month.
    - ***`env_climate_bio15`***: Precipitation seasonality.
    - ***`env_climate_bio16`***: Mean monthly precipitation amount of the wettest quarter.
    - ***`env_climate_bio17`***: Mean monthly precipitation amount of the driest quarter.
    - ***`env_climate_bio18`***: Mean monthly precipitation amount of the warmest quarter.
    - ***`env_climate_bio19`***: Mean monthly precipitation amount of the coldest quarter.
    - ***`env_climate_pr`***: Monthly precipitation amount.
    - ***`env_climate_srad`***: Solar radiation.
    - ***`env_climate_tas`***: Mean daily air temperature.
    - ***`env_climate_tasmax`***: Mean daily maximum air temperature.
    - ***`env_climate_tasmin`***: Mean daily minimum air temperature.
    - ***`env_climate_vapr`***: Water vapor pressure.
    - ***`env_climate_wind`***: Wind speed.

This `properties` field is divided into five sections:

- `1970-2000`: Data averages for the period starting in 1970 and ending in 2000. Monthly data is available under the `std_date_span_month` property.
- `2021-2040`: Future modelled averages for the period starting in 2021 and ending in 2040. This property contains two additional child sections that indicate respectively the climate scenario model and the shared socioeconomic pathway used to calculate the values, the indicators are found under the latter level. See the database WorldClim data section in this document for more information.
- `2041-2060`: Future modelled averages for the period starting in 2041 and ending in 2060, the structure is the same as the previous section.
- `2061-2080`: Future modelled averages for the period starting in 2061 and ending in 2080, the structure is the same as the previous section.
- `2081-2100`: Future modelled averages for the period starting in 2081 and ending in 2100, the structure is the same as the previous section.

#### Get data corresponding to the provided coordinates

This service can be used to get the WorldClim record corresponding to the provided coordinates, the service expects the latitude, `lat`, and longitude, `lon`, in decimal degrees, provided as *query parameters*. The service will return the record whose measurement bounding box, `geometry_bounds`, contains that point.

#### Get selection or aggregation of records within a distance range

The service will select all WorldClim records that lie within a *distance range* from the provided *reference geometry* query parameter, `geometry`. The distance is calculated from the *wgs84 centroids* of both the *reference geometry* and the WorldClim measurement area center, `geometry_point`.

The service expects the following *query path parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the list of geometry hashes, `geometry_hash`, or primary key values.
        -  `SHAPE`: Returns the geometry information of the selected records:
            - `geometry_hash`: The MD5 hash of the GeoJSON measurement area polygon, or record primary key.
            - `distance`: The distance in meters between the centroid of the provided reference geometry and the record's `geometry_point`.
            - `geometry_point`: The GeoJSON center point of the measurement area, `geometry_bounds`.
            - `geometry_bounds`: The GeoJSON polygon corresponding to the measurement area.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the number of records in the selection; `distance`, the aggregated distance according to the `what` parameter and `properties`, containing the indicators as described above in the `properties` field aggregated according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.
- `min`: This *required* parameter represents the range's *minimum distance*. The value is inclusive.
- `max`: This *required* parameter represents the range's *maximum distance*. The value is inclusive.
- `sort`: This *optional* parameter determines whether results should be *sorted* and in what *order*. The parameter is relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`. The sort order is determined by the *distance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the GeoJSON *reference geometry* whose *centroid* will be used to select all WorldClim records *within* the provided *distance range*. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records contained by the provided geometry

The service will select all WorldClim records whose measurement area centers, `geometry_point`, are *fully contained* by the provided *reference geometry* query parameter, `geometry`.

The service expects the following *query path parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the list of geometry hashes, `geometry_hash`, or primary key values.
        -  `SHAPE`: Returns the geometry information of the selected records:
            - `geometry_hash`: The MD5 hash of the GeoJSON measurement area polygon, or record primary key.
            - `geometry_point`: The GeoJSON center point of the measurement area, `geometry_bounds`.
            - `geometry_bounds`: The GeoJSON polygon corresponding to the measurement area.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the number of records in the selection and `properties`, containing the indicators as described above in the `properties` field aggregated according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the GeoJSON *reference geometry* that should contain the Chelsa record `geometry_point` coordinates. It may be a *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records intersecting with the provided geometry

The service will select all WorldClim records whose measurement area, `geometry_bounds`, *intersect* with the provided *reference geometry* query parameter, `geometry`.

The service expects the following *query path parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the list of geometry hashes, `geometry_hash`, or primary key values.
        -  `SHAPE`: Returns the geometry information of the selected records:
            - `geometry_hash`: The MD5 hash of the GeoJSON measurement area polygon, or record primary key.
            - `geometry_point`: The GeoJSON center point of the measurement area, `geometry_bounds`.
            - `geometry_bounds`: The GeoJSON polygon corresponding to the measurement area.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the number of records in the selection and `properties`, containing the indicators as described above in the `properties` field aggregated according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the GeoJSON *reference geometry* that should contain the WorldClim record `geometry_point` coordinates. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

### Shape Hashes

This set of services should be used to safely generate MD5 hashes of GeoJSON shapes. These shapes can be grid cells or regions, the hash is used as a primary key to uniquely identify the shape with a 32 character string.

Since the MD5 hash is applied to a string representing the GeoJSON shape, it is important that the conversion from JSON to string is consistent, or the hash cannot be safely used. Whenever you see the `geometry_hash` property in a record, this has been generated by one of these services.

All services return a record structured as follows:

- `geometry`: The provided shape as a GeoJSON geometry.
- `geometry_hash`: A 32 character hexadecimal string representing the MD5 hash of the provided shape in GeoJSON format.

Shapes that have *data attached* are expected to be only *Points*, *Polygons* or *MultiPolygons*.

#### Get Point hash

This service expects two query path parameters: `lat` for the latitude and `lon` for the longitude. The service will return the hash for the GeoJSON point of the provided coordinates.

#### Polygon hash

This service expects a single body parameter, `coordinates`, that represents the GeoJSON coordinates part of a polygon. When creating the coordinates follow these rules:

- The polygon shape should be provided *at least* as *one array* representing a *linear ring*.
- *Each linear ring* should consist of an *array* with at least *four longitude/latitude pairs*.
- The *first* linear ring *must be the outermost*, while any *subsequent* linear ring will be *interpreted as holes*.
- The *order* of the *sequence of coordinates* is important: *counter-clock* means the polygon area is *inside*, *clockwise* means the area of the polygon is *outside*.

#### MultiPolygon hash

This service expects a single body parameter, `coordinates`, that represents the GeoJSON coordinates part of a multi-polygon. When creating the coordinates follow these rules:

- The MultiPolygon shape should be provided as an *array* of *Polygon shapes*.
- The *polygon shape* should be provided *at least* as *one array* representing a *linear ring*.
- Each *linear ring* should consist of an *array* with at least *four longitude/latitude pairs*.
- The *first* linear ring *must be the outermost*, while any *subsequent* linear ring will be *interpreted as holes*.
- The *order* of the *sequence of coordinates* is important: *counter-clock* means the polygon area is *inside*, *clockwise* means the area of the polygon is *outside*.