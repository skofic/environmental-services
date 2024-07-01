# Environmental Data Services

This [repository](https://github.com/skofic/environmental-services.git) contains the [ArangoDB](https://www.arangodb.com/) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) for publishing *remote sensing* and *climate data* related to dynamic conservation units of forest trees, published in the [EUFGIS](http://www.eufgis.org) information system.

This work is being conducted for the [upgrade](https://www.forgenius.eu/eufgis) of the [EUFGIS](http://www.eufgis.org/) information system within the framework of the [FORGENIUS](https://www.forgenius.eu/) project.

<details>
	<summary>Table of Contents</summary>
	<ol>
		<li><a href="#Database">Database</a></li>
    <li><a href="#Installation">Installation</a></li>
    <li><a href="#Services">Services</a></li>
    <li><a href="#Progress">Progress</a></li>
    <li><a href="#Licence">Licence</a></li>
	</ol>
</details>



## Database

The database is implemented using [ArangoDB](https://www.arangodb.com/). The data is not included in this repository, you will have to run a [Google Earth Engine](https://earthengine.google.com/) [Colab](https://colab.research.google.com/) sheet to populate the remote sensing data, and a series of scripts can be used to download, clip, process, combine and merge [Chelsa](https://chelsa-climate.org/), [WorldClim](https://worldclim.org/) and [EDO](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) data, all this is available in [this](https://github.com/skofic/ClimateService.git) repository.

The database contains the following collections:

### Chelsa

[CHELSA](https://chelsa-climate.org) [version 2.1](https://chelsa-climate.org/wp-admin/download-page/CHELSA_tech_specification_V2.pdf) is based on a mechanistical statistical downscaling of global reanalysis data or global circulation model output, it is a [model](https://chelsa-climate.org/wp-admin/download-page/CHELSA_tech_specification_V2.pdf) that aims at representing reality as precise as possible. It provides high spatial resolution (30 arc seconds) grid of global weather and climate data for historical data, *1981-2010*, and future modelled climate scenarios.

Future climate scenarios come from the [Max Plank Institute Earth System Model](https://mpimet.mpg.de/en/research/department-climate-variability/earth-system-modeling-and-prediction) version [MPI-ESM1-2-HR](https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MPI-M.MPI-ESM1-2-HR), a [climate model](https://www.carbonbrief.org/cmip6-the-next-generation-of-climate-models-explained/) developed as part of the internationally-coordinated Coupled Model Intercomparison Project Phase 6 ([CMIP6](https://pcmdi.llnl.gov/CMIP6/)). The values were averages over 3 20 year periods: *2011-2040*, *2041-2070* and *2071-2100*. 

*Shared Socioeconomic Pathways (SSPs)* are climate change scenarios of projected socioeconomic global changes up to 2100 as defined in the IPCC Sixth Assessment Report on climate change in 2021. Of these the [Shared Socioeconomic Pathway](https://climatedata.ca/resource/understanding-shared-socio-economic-pathways-ssps/) [SSP3-RCP7](https://www.meteomatics.com/en/api/available-parameters/climate-data/#scenario3) was selected: *regional rivalry* (a rocky road):

> The world follows a path in which social, economic, and technological trends do not shift markedly from historical patterns. Development and income growth proceeds unevenly, with some countries making relatively good progress while others fall short of expectations. Global and national institutions work toward but make slow progress in achieving sustainable development goals. Environmental systems experience degradation, although there are some improvements and overall the intensity of resource and energy use declines. Global population growth is moderate and levels off in the second half of the century. Income inequality persists or improves only slowly and challenges to reducing vulnerability to societal and environmental changes remain.

#### Data

The collection contains over 36 million data records, *one* for *each grid cell*. This data source is usually interrogated providing a *point* and *selecting* the *grid cell* that *contains it*. There are also services that allow *selecting* a *set of grid cells* based on *distance range*, that are *contained* or that *intersect* with a provided *reference geometry*: the *results* can be *listed* or *aggregated* using a set of *statistical methods*.

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

The `_key` represents the *primary key* of the record, it is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the `geometry_bounds` field.

The `std_dataset_ids` field contains the *list* of *all datasets* featured *in the record*; the values are *references* to the corresponding `Dataset` records.

The `geometry_point` contains the [GeoJSON](https://geojson.org) *point coordinates* of the *center* of the *grid cell*.

The `geometry_bounds` contains the [GeoJSON](https://geojson.org) *polygon coordinates* of the *grid cell*.

The `properties` field contains all the *data*, it is subdivided into the *four time periods*:

- `1981-2010`: *Historical data* averaged for the period ranging from 1981 to 2010. At the top level we find yearly period averages and the `std_date_span_month` field contains monthly data averages for the same period.
- `2011-2040`: *Modelled data* for the period ranging from 2011 to 2040. The `MPI-ESM1-2-HR` and `ssp370` fields indicate respectively the [climate model](https://mpimet.mpg.de/en/research/department-climate-variability/earth-system-modeling-and-prediction) and the [shared socioeconomic pathway](https://www.meteomatics.com/en/api/available-parameters/climate-data/#scenario3) used in the modelling. At the top level of the `ssp370` property we find yearly period averages and the `std_date_span_month` field contains monthly data averages for the same period.
- `2041-2070`: *Modelled data* for the period ranging from 2041 to 2070. The structure of the data is the same as the *previously described section*.
- `2071-2100`: *Modelled data* for the period ranging from 2071 to 2100. The structure of the data is the same as the *previously described section*.

All *data variables* are *documented* in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

Both the `geometry_point` and the `geometry_bounds` fields are indexed with type `geo`. The point geometry is used to select by distance, while the polygon geometry is used for all other geometry searches.

### WorldClim

[WorldClim](https://worldclim.org) version 2.1 is a database of high spatial resolution (30 arc seconds) global weather and climate data, it provides historical data, 1970-2000, and future modelled climate scenarios ranging from 2021 to 2100.

Future climate scenarios come from the [Max Plank Institute Earth System Model](https://mpimet.mpg.de/en/research/department-climate-variability/earth-system-modeling-and-prediction) version [MPI-ESM1-2-HR](https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MPI-M.MPI-ESM1-2-HR), a [climate model](https://www.carbonbrief.org/cmip6-the-next-generation-of-climate-models-explained/) developed as part of the internationally-coordinated Coupled Model Intercomparison Project Phase 6 ([CMIP6](https://pcmdi.llnl.gov/CMIP6/)). The monthly values were averages over 4 20 year periods, 2021-2040, 2041-2060, 2061-2080 and 2081-2100. 

Shared Socioeconomic Pathways (SSPs) are climate change scenarios of projected socioeconomic global changes up to 2100 as defined in the IPCC Sixth Assessment Report on climate change in 2021. Of these the [Shared Socioeconomic Pathway](https://climatedata.ca/resource/understanding-shared-socio-economic-pathways-ssps/) [SSP3-RCP7](https://www.meteomatics.com/en/api/available-parameters/climate-data/#scenario3) was selected: *regional rivalry* (a rocky road):

> The world follows a path in which social, economic, and technological trends do not shift markedly from historical patterns. Development and income growth proceeds unevenly, with some countries making relatively good progress while others fall short of expectations. Global and national institutions work toward but make slow progress in achieving sustainable development goals. Environmental systems experience degradation, although there are some improvements and overall the intensity of resource and energy use declines. Global population growth is moderate and levels off in the second half of the century. Income inequality persists or improves only slowly and challenges to reducing vulnerability to societal and environmental changes remain.

#### Data

The collection contains over 21 million data records, one for each grid cell. This data source is usually interrogated providing a *point* and *selecting* the *grid cell that contains it*. There are also services that provide a *selection of grid cells* within a specific *distance range*, *contained by* or *intersecting* a provided *geometric shape*, the results can *also be aggregated*.

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

The `_key` represents the *primary key* of the record, it is the *[MD5](https://en.wikipedia.org/wiki/MD5) hash* of the `geometry_bounds` field.

The `std_dataset_ids` field contains the *list* of all *datasets* present in the record; the values are *references* to the corresponding `Dataset` records.

The `geometry_point` contains the [GeoJSON](https://geojson.org) *point* of the *center* of the *grid cell*.

The `geometry_bounds` contains the [GeoJSON](https://geojson.org) *polygon* of the *grid cell*.

The `properties` field contains all the data:

- `topography`: This section contains the *average elevation* of the current grid cell, *provided by WorldClim*.
- `1970-2000`: *Historical data* averaged for the period ranging from 1970 to 2000. At the top level we find *yearly* period *averages* and the `std_date_span_month` field contains *monthly* data *averages* for the same period.
- `2021-2040`: *Modelled data* for the period ranging from 2021 to 2040. The `MPI-ESM1-2-HR` and `ssp370` fields indicate respectively the [climate model](https://mpimet.mpg.de/en/research/department-climate-variability/earth-system-modeling-and-prediction) and the [shared socioeconomic pathway](https://www.meteomatics.com/en/api/available-parameters/climate-data/#scenario3) used in the modelling. At the top level of the `ssp370` property we find *yearly* period *averages* and the `std_date_span_month` field contains *monthly* data *averages* for the same period.
- `2041-2060`: Modelled data for the period ranging from 2041 to 2060. The structure of the data is the same as the *previously described section*.
- `2061-2080`: Modelled data for the period ranging from 2061 to 2080. The structure of the data is the same as the *previously described section*.
- `2081-2100`: Modelled data for the period ranging from 2081 to 2100. The structure of the data is the same as the *previously described section*.

All *data variables* are *documented* in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

Both the `geometry_point` and the `geometry_bounds` fields are indexed with type `geo`. The point geometry is used to select by distance, while the polygon geometry is used for all other geometry searches.

### Shapes

Each *dynamic conservation unit* can be *divided* or *partitioned* into one or more *geographic shapes* of which *averaged* climatic and remote sensing *data is made available*. The idea is to distinguish specific topographic or biological regions, within the conservation unit, and link these polygons or multi-polygons to a set of data records contained in the `ShapeData` collection.

#### Data

Each record represents a *geometry* that can either be a polygon or a *multi-polygon*. The geometry is *characterised* by *topographic information* and is *referenced* by *time series* data stored in the `ShapeData` collection.

Records are structured as follows:

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

The `_key` represents the *primary key* of the record, it is the *[MD5](https://en.wikipedia.org/wiki/MD5) hash* of the `geometry_bounds` field, this value will be used in the `ShapeData` collection to *reference* the *corresponding geometry*.

The `std_dataset_ids` field contains the *list* of all *datasets* featuring data for the current record; the values are *references* to the corresponding `Dataset` records.

The `properties` field contains *averaged topographic data* related to the current shape area, `geometry`. Note that all *other* data referring to the shape is stored in the `ShapeData` collection.

The `geometry` contains the geometry in [GeoJSON](https://geojson.org) format. It may either be a `Polygon` or a `MultiPolygon`, in the latter case data is averaged on all enclosed polygons. All *data* referring to the current shape is *averaged* on this *geometry*.

The `geometry_bounds` contains the [GeoJSON](https://geojson.org)  bounding box expressed as a polygon.

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

The collection currently contains over 47 million records, the size depends on the number of shapes and the date ranges. Each record represents the *data* of a geometry, *period* (*either daily, monthly or annual*) and for a specific *date*:

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

The `geometry_hash` points to the `Shapes` record, it is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the shape `geometry` property.

The `std_date_span` field represents the *time period* associated with the measurement: `std_date_span_day` for *daily* data, `std_date_span_month` for *monthly* averages and `std_date_span_year` for *yearly* averages.

The `std_date` field represents the measurement *date* in `YYYYMMDD` format, `Y` for year, `M` for month and `D` for day. Daily data requires the full date, monthly data can omit the month and yearly data can omit month and day.

The `properties` field contains the remote sensing data *averaged for the current geometry*.

The `std_terms` field contains the *list* of featured *data properties*.

The `std_dataset_ids` field contains the *list* of referenced *datasets*, the values are *links* to `Dataset` collection records.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

The collection features three indexes, besides the default primary key:

- An index comprising the `geometry_hash`, `std_date_span` and `std_date`, respectively representing the *geometry*, the *date span* and the *date*. This index is *unique*.
- An index comprising the `geometry_hash` and `std_dataset_ids[*]`, respectively representing the *geometry* and the individual *dataset references*.
- An index comprising the `geometry_hash` and `std_terms[*]`, respectively representing the *geometry* and the individual featured *data property references*.

### UnitShapes

This collection links the *unit identifiers* with the *geometry identifiers*, it is used to *group* all *geometries* belonging to a *conservation unit* and *conservation unit version*.

#### Data

The data contains the *reference* to the *geometry*, the *reference* to the *conservation unit* and the reference to the specific *conservation unit version*:

```json
{
  "geometry_hash": "554a3bb9ef58e60223845bfa6e78a6ad",
  "gcu_id_number": "ALB00002",
  "gcu_id_unit-id": "ALB000022020"
}
```

The `geometry_hash` references the `Shapes` record primary key, it is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the [GeoJSON](https://geojson.org) geometry.

The `gcu_id_number` is the *identifier* of the *conservation unit*.

The `gcu_id_unit-id` is the *identifier* of the specific *data version* of the *conservation unit*.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Indexes

All fields feature an index: `geometry_hash`, `gcu_id_number` and `gcu_id_unit-id`.

### DroughtObservatory

This collection contains over 1.2 billion records from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) repository. It is a collection of measurements subdivided into a set of 1km., 5km. and 25 km. resolution grids covering the European region. Each record references a *specific layer cell* and *date*, all dates are daily.

#### Data

The records are grouped by *geometry* and *date*, and have the following structure:

```json
{
    "geometry_hash": "7e142bf917dbf13cd8c106142cabc9f9",
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

The `geometry_hash` references the record in the `DroughtObservatoryMap` collection that represents the *grid cell*, it is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the [GeoJSON](https://geojson.org) *polygon* representing the *grid cell* that is the `geometry` property in the `DroughtObservatoryMap` collection.

The `std_date` field represents the measurement *date* in `YYYYMMDD` format, `Y` for year, `M` for month and `D` for day. All dates have a *daily span*.

The `properties` field contains the *data measurements*.

The `std_terms` field contains the list of featured data properties.

The `std_dataset_ids` field contains the list of referenced datasets, the values are links to `Dataset` collection records.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Index

The collection features a *unique* index on the `geometry_hash` and `std_date` fields.

### DroughtObservatoryMap

This collection contains one record for each grid cell from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) repository, it contains almost 1.5 million records. It is used to record the geometry of the grid cellsand to link`DroughtObservatory` collection time series.

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

The `_key` field represents the record *primary key*, it is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of `geometry`.

The `geometry` field contains the [GeoJSON](https://geojson.org) *geometry* of the *grid cell*.

The `geometry_point` field contains the [GeoJSON](https://geojson.org) *point* representing the *center* of the *grid cell*.

The `geometry_point_radius` field represents the *latitude radius*, in *decimal degrees*, of the *grid cell*: it represents the *grid resolution*.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### Index

The collection features a single Geo index on the `geometry` property.

### Dataset

This collection contains one record for each *dataset* featured in the database. A dataset represents a *set of indicators* belonging to the *same repository*, they must have the same *grid resolution* and share the same *time series resolution*. You have seen references to elements of this collection in almost all collections of the database.

#### Data

Records of this collection contain a set of fields that record the *metadata* of the *dataset*, this is a typical record example:

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

The `_key` contains the *primary key* of the record.

The `_collection` contains the *database collection name* in which *data* from the *current dataset* is stored. It is implied that all data in the dataset is stored in one collection.

The `std_project` represents the *code* of the *project* that is tasked to collect and provide data.

The `std_dataset` is the *public identifier* of the *dataset*.

The `std_dataset_group` is the *identifier* of the *group* to which the *current dataset belongs*.

The `std_date_submission` contains the *submission date* of the dataset in `YYYYMMDD` format, `Y` for the year, `M` for the month and `D` for the day.

The `std_date_start` and `std_date_end` represent the time series *start* and *end dates*, also in `YYYYMMDD` format.

The `_title` contains the multilingual dataset *title* or *label* in [Markdown](https://en.wikipedia.org/wiki/Markdown) format, note that `iso_639_3_eng` represents the *english language code*.

The `_description` contains the multilingual dataset *full description* in [Markdown](https://en.wikipedia.org/wiki/Markdown) format, note that `iso_639_3_eng` represents the *english language code*.

The `_citation` is an array of [Markdown](https://en.wikipedia.org/wiki/Markdown) texts that contain the *required* or *recommended* data *citations*.

The `_url` is an arrat that contains the *internet references* for the dataset.

The  `count` contains the dataset *data record count*.

The `std_terms_key` contains the *list* of *fields* that *uniquely identify* each *record*.

The `std_terms` contains the *list* of featured *indicators*.

The `std_terms_quant` contains the *list* of featured *quantitative indicators*.

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
```

You may have noticed that there are more fields in the view than those shown in the example: this is because there are *several types of datasets*, each having some specific fields. The datasets featured in *this database* reference *external databases*, while *other datasets* represent the project *characterisation data* and are *stored* in *another database*.

## Installation

1. You must first [install](https://docs.arangodb.com/stable/operations/installation/) [ArangoDB](https://arangodb.com) or plan to use an existing deployment.
2. You must create a new database that will be used to host the data and services.
3. Install the [Foxx micro services](https://docs.arangodb.com/stable/develop/foxx-microservices/), here are the instructions using the web interface:
    ![](/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/env/APP/images/1-AddService.png)
    Create a new service by clicking the Add Service button,
    ![](/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/env/APP/images/2-SelectService.png)
    Select the GitHub option and and fill as in the above image, press install,
    ![](/Users/milko/Local/Accounts/ArangoDB/Apps/_db/GeoService/env/APP/images/3-MountPoint.png)
    Set the mount point as you wish, remember to keep the `Run setup?` checkbox selected: this will create the collections, indexes and views.

## Services

Once the services are installed you will have an empty configured database and microservices to query the data.

To fill the data refer to this [repository](https://github.com/skofic/ClimateService.git). *Note that loading the database with data is a **VERY LONG** process and requires **A LOT** of **RESOURCES***.

The directory containing the services has the following elements:

- **`api`**: This directory contains a set of microservices definition documents, of which `GeoService API Document.paw`, a [RapidAPI](https://rapidapi.com) document, is the original. The directory contains also a [Postman](https://www.postman.com) version. The files contain example service calls.
- **`images`**: Images used in this README.md file.
- **`notes`**: Miscellaneous notes and files.

*All other files and directories* represent the source files, please refer to the [Foxx microservices documentation](https://docs.arangodb.com/stable/develop/foxx-microservices/) for more information. *Note that if you use the ArangoDB default user interface, all services are documented*.

The microservices are divided into the following sections:

### Chelsa

This section contains the services used to query and aggregate [Chelsa](https://chelsa-climate.org) data. Each record represents a 30 seconds arc grid cell containing historic and future modelled data covering yearly and monthly statistics.

Records are stored in the `Chelsa` collection and structured as follows:

- **`geometry_hash`**: This is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the `geometry_bounds` property, it represents the *primary key* of the record.
- **`geometry_point`**: This is the [GeoJSON](https://geojson.org) *point* corresponding to the *center* of the *grid cell*.
- **`geometry_bounds`**: This is the [GeoJSON](https://geojson.org) *polygon* of the *grid cell*.
- **`properties`**: This contains the *data indicators*:
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

- `1981-2010`: Data *averages* for the *period* starting in 1981 and ending in 2010. *Monthly* data is available under the `std_date_span_month` property.
- `2011-2040`: *Future modelled averages* for the period starting in 2011 and ending in 2040. This property contains two additional *child sections* that indicate respectively the *climate scenario model* and the *shared socioeconomic pathway* used to *calculate the values*, the indicators are found under the latter level. *See the database Chelsa data section in this document for more information*.
- `2041-2070`: *Future modelled averages* for the period starting in 2041 and ending in 2070, the structure is the same as the previous section.
- `2071-2100`: *Future modelled averages* for the period starting in 2071 and ending in 2100, the structure is the same as the previous section.

All services, except the first, expect the following *path query parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the *list* of *geometry hashes*, `geometry_hash`, or *primary key values*.
        - `SHAPE`: Returns the *geometry* information of the *selected records*:
            - `geometry_hash`: The [MD5](https://en.wikipedia.org/wiki/MD5) hash of the [GeoJSON](https://geojson.org) measurement area polygon, or *record primary key*.
            - `distance`: The *distance in meters* between the *centroids* of the provided *reference geometry* and the record's `geometry_point`.
            - `geometry_point`: The [GeoJSON](https://geojson.org) *center point* of the *grid cell*, `geometry_bounds`.
            - `geometry_bounds`: The [GeoJSON](https://geojson.org) *polygon* of the *grid cell*.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the *number of records* in the selection; `distance`, the *aggregated distance* according to the `what` parameter and `properties`, containing the *indicators* as described above in the `properties` field *aggregated* according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.

#### Get data corresponding to the provided coordinates

This service can be used to get the *Chelsa record* that *contains* the *provided coordinates*, the service expects the latitude, `lat`, and longitude, `lon`, in *decimal degrees*, provided as *query parameters*. The service will return the record whose measurement bounding box, `geometry_bounds`, contains that point.

#### Get selection or aggregation of records within a distance range

The service will select all Chelsa records that lie within a *distance range* from the provided *reference geometry* query parameter, `geometry`. The distance is calculated from the *wgs84 centroids* of both the *reference geometry* and the Chelsa *grid cell center*, `geometry_point`.

The service expects the *default path query parameters*, plus the following *additional parameters*:

- `min`: This *required* parameter represents the range's *minimum distance*. The value is inclusive.
- `max`: This *required* parameter represents the range's *maximum distance*. The value is inclusive.
- `sort`: This *optional* parameter determines whether results should be *sorted* and in what *order*. The parameter is relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`. The sort order is determined by the *distance*.

And the following *body parameters*:

- `geometry`: This *required* *body parameter* represents the [GeoJSON](https://geojson.org) *reference geometry* whose *centroid* will be used to select all Chelsa records *within* the provided *distance range*. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records contained by the provided geometry

The service will select all Chelsa records whose *grid cell centroids*, `geometry_point`, are *fully contained* by the provided *reference geometry* query parameter, `geometry`.

The service expects the *default path query parameters*.

The service expects the following *body parameters*:

- `geometry`: This *required* body parameter represents the [GeoJSON](https://geojson.org) *reference geometry* that should contain the Chelsa record `geometry_point` coordinates. It may be a *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records intersecting with the provided geometry

The service will select all Chelsa records whose measurement area, `geometry_bounds`, *intersect* with the provided *reference geometry* query parameter, `geometry`.

The service expects the *default path query parameters*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the [GeoJSON](https://geojson.org) *reference geometry* that should intersect the Chelsa record `geometry_point` coordinates. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

### WorldClim

This section contains the services used to query and aggregate [WorldClim](https://worldclim.org) data. Each record represents a 30 seconds arc grid cell containing *historic* and *future modelled* data covering *yearly* and *monthly* statistics.

Records are stored in the `WorldClim` collection and structured as follows:

- **`geometry_hash`**: This is the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the `geometry_bounds` property, it represents the primary key of the record.
- **`geometry_point`**: This is the [GeoJSON](https://geojson.org) *point* corresponding to the *centroid* of the *grid cell*.
- **`geometry_bounds`**: This is the [GeoJSON](https://geojson.org) *polygon* of the *grid cell*.
- **`properties`**: This contains the *data properties*, this is the list of indicators:
    - ***`geo_shape_elevation`***: Mean elevation for the measurement area.
    - ***`env_climate_bio01`***: Mean annual air temperature.
    - ***`env_climate_bio02`***: Mean diurnal air temperature range.
    - ***`env_climate_bio03`***: Isothermality.
    - ***`env_climate_bio04`***: Temperature seasonality.
    - ***`env_climate_bio05`***: Mean daily maximum air temperture of the warmest month.
    - ***`env_climate_bio06`***: Mean daily minimum air temperature of the coldest month.
    - ***`env_climate_bio07`***: Annual range of air temperature.
    - ***`env_climate_bio08`***: Mean of daily mean air tempertures of the wettest quarter.
    - ***`env_climate_bio09`***: Mean of daily mean air tempertures of the driest quarter.
    - ***`env_climate_bio10`***: Mean of daily mean air tempertures of the warmest quarter.
    - ***`env_climate_bio11`***: Mean of daily mean air tempertures of the coldest quarter.
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

- `1970-2000`: Data *averages* for the period starting in 1970 and ending in 2000. Monthly data is available under the `std_date_span_month` property.
- `2021-2040`: Future *modelled averages* for the period starting in 2021 and ending in 2040. This property contains two additional child sections that indicate respectively the *climate scenario model* and the *shared socioeconomic pathway* used to calculate the values, the indicators are found under the latter level. See the database WorldClim data section in this document for more information.
- `2041-2060`: *Future modelled averages* for the period starting in 2041 and ending in 2060, the structure is the same as the previous section.
- `2061-2080`: *Future modelled averages* for the period starting in 2061 and ending in 2080, the structure is the same as the previous section.
- `2081-2100`: *Future modelled averages* for the period starting in 2081 and ending in 2100, the structure is the same as the previous section.

All services, except the first, expect the following *path query parameters*:

- `what`: This *required* parameter determines the *type* of *service result*: either a *list of records* or the *aggregation of the selected records*:
    - *List of records*:
        - `KEY`: Return the *list* of *geometry hashes*, `geometry_hash`, or *primary key values*.
        - `SHAPE`: Returns the *geometry* information of the *selected records*:
            - `geometry_hash`: The [MD5](https://en.wikipedia.org/wiki/MD5) hash of the [GeoJSON](https://geojson.org) measurement area polygon, or *record primary key*.
            - `distance`: The *distance in meters* between the *centroids* of the provided *reference geometry* and the record's `geometry_point`.
            - `geometry_point`: The [GeoJSON](https://geojson.org) *center point* of the *grid cell*, `geometry_bounds`.
            - `geometry_bounds`: The [GeoJSON](https://geojson.org) *polygon* of the *grid cell*.
        - `DATA`: It will return the same properties as for `SHAPE`, plus the `properties` field that contains the indicators, as described above.
    - *Records aggregation*. The service will return a single record containing the following properties: `count`, the *number of records* in the selection; `distance`, the *aggregated distance* according to the `what` parameter and `properties`, containing the *indicators* as described above in the `properties` field *aggregated* according to the `what` parameter. Note that (*obviously*) only *quantitative indicators* will be returned
        - `MIN`: *Minimum*. 
        - `AVG`: Average.
        - `MAX`: *Maximum*.
        - `STD`: *Standard deviation*.
        - `VAR` *Variance*.

#### Get data corresponding to the provided coordinates

This service can be used to get the *WorldClim record* corresponding to the *provided coordinates*, the service expects the *latitude*, `lat`, and *longitude*, `lon`, in *decimal degrees*, provided as *path query parameters*. The service will return the record whose *grid cell*, `geometry_bounds`, *contains that point*.

#### Get selection or aggregation of records within a distance range

The service will select all WorldClim records that lie within a *distance range* from the provided *reference geometry* query parameter, `geometry`. The distance is calculated from the *wgs84 centroids* of both the *reference geometry* and the WorldClim *grid cell centroid*, `geometry_point`.

The service expects the *default path query parameters* plus the following *additional path parameters*:

- `min`: This *required* parameter represents the range's *minimum distance*. The value is inclusive.
- `max`: This *required* parameter represents the range's *maximum distance*. The value is inclusive.
- `sort`: This *optional* parameter determines whether results should be *sorted* and in what *order*. The parameter is relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`. The sort order is determined by the *distance*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the [GeoJSON](https://geojson.org) *reference geometry* whose *centroid* will be used to select all WorldClim records *within* the provided *distance range*. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records contained by the provided geometry

The service will select all WorldClim records whose measurement area centers, `geometry_point`, are *fully contained* by the provided *reference geometry* query parameter, `geometry`.

The service expects the *default path query parameters*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the [GeoJSON](https://geojson.org) *reference geometry* that should contain the WorldClim record `geometry_point` coordinates. It may be a *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

#### Get selection or aggregation of records intersecting with the provided geometry

The service will select all WorldClim records whose measurement area, `geometry_bounds`, *intersect* with the provided *reference geometry* query parameter, `geometry`.

The service expects the *default path query parameters*.

And the following *body parameters*:

- `geometry`: This *required* body parameter represents the [GeoJSON](https://geojson.org) *reference geometry* that should intersect the WorldClim record `geometry_point` coordinates. It may be a *Point*, *MultiPoint*, *LineString*, *MultiLineString*, *Polygon* or *MultiPolygon*.
- `start`: This *optional* body parameter represents the *initial record index*, zero based, for returned selection of records, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.
- `limit`: This *optional* body parameter represents the *number of records* to return, relevant only when the `what` parameter is `KEY`, `SHAPE` or `DATA`.

### Hash Geometries

This set of services should be used to safely generate [MD5](https://en.wikipedia.org/wiki/MD5) hashes of [GeoJSON](https://geojson.org) geometries. These shapes can be *grid cells* or *regions*, the hash is used as a *primary key* to *uniquely identify* the *geometry* with a 32 hexadecimal character string.

Since the [MD5](https://en.wikipedia.org/wiki/MD5) hash is applied to a *string* representing the [GeoJSON](https://geojson.org) geometry, it is important that the *conversion* from JSON to string *is consistent*, or the hash cannot be safely used. Whenever you see the `geometry_hash` property in a record, this has been generated by one of these services.

All services return a record structured as follows:

- `geometry`: The provided shape as a [GeoJSON](https://geojson.org) geometry.
- `geometry_hash`: A 32 character hexadecimal string representing the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the provided [GeoJSON](https://geojson.org) geometry.

Shapes that have *data attached* are expected to be only *Points*, *Polygons* or *MultiPolygons*.

#### Point

This service expects two *query path parameters*: `lat` for the *latitude* and `lon` for the *longitude*. The service will return the hash for the [GeoJSON](https://geojson.org) *point* of the provided coordinates.

#### Polygon

This service expects a single *body parameter*, `coordinates`, that represents the [GeoJSON](https://geojson.org) *coordinates* part *of a polygon*. When creating the coordinates follow these rules:

- The polygon shape should be provided *at least* as *one array* representing a *linear ring*.
- *Each linear ring* should consist of an *array* with at least *four longitude/latitude pairs*.
- The *first* linear ring *must be the outermost*, while any *subsequent* linear ring will be *interpreted as holes*.
- The *order* of the *sequence of coordinates* is important: *counter-clock* means the polygon area is *inside*, *clockwise* means the area of the polygon is *outside*.

#### MultiPolygon

This service expects a single *body parameter*, `coordinates`, that represents the [GeoJSON](https://geojson.org) *coordinates* part *of a multi-polygon*. When creating the coordinates follow these rules:

- The MultiPolygon shape should be provided as an *array* of *Polygon shapes*.
- The *polygon shape* should be provided *at least* as *one array* representing a *linear ring*.
- Each *linear ring* should consist of an *array* with at least *four longitude/latitude pairs*.
- The *first* linear ring *must be the outermost*, while any *subsequent* linear ring will be *interpreted as holes*.
- The *order* of the *sequence of coordinates* is important: *counter-clock* means the polygon area is *inside*, *clockwise* means the area of the polygon is *outside*.

### Conservation Units

This set of services can be used to retrieve *conservation unit records* using the *unit number*, `gcu_id_number`, and the *unit ID*, `gcu_id_unit-id`. It also allows retrieving the associated *unit geometries*.

These services cover the contents of the `UnitShapes` collection.

#### Unit ID list by unit number

This service returns the *list* of *unit IDs* associated with the *provided unit number*.

The service expects the *unit number* to be provided as a *path query parameter*, `gcu_id_number`, and will return the following record:

- ***`gcu_id_number`***: The provided unit number.
- ***`gcu_id_unit-id_list`***: List of associated unit IDs.

#### Unit geometry references by unit ID

This service will return the *unit number* and *unit geometry references* associated with the provided *unit ID*.

The service expects the *unit ID* to be provided as a *path query parameter*, `gcu_id_unit-id`, and will return the following record:

- ***`gcu_id_number`***: The unit number.
- ***`gcu_id_unit-id`***: The provided unit ID.
- ***`geometry_hash_list`***: The list of [MD5](https://en.wikipedia.org/wiki/MD5) hashes of the associated geometries.

#### Unit by geometry reference

This service will return the *unit number*, *unit ID* associated with the provided *geometry hash*.

The service expects the *unit geometry hash* to be provided as a *path query parameter*, `geometry_hash`, and will return the following record:

- ***`gcu_id_number`***: The unit number.
- ***`gcu_id_unit-id`***: The unit ID.
- ***`geometry_hash`***: The [MD5](https://en.wikipedia.org/wiki/MD5) hash of the geometry.

### Conservation Unit Geometries

This set of services can be used to retrieve *conservation unit geometry records* using *unit information* and querying *shape properties*.

A geometry record is structured as follows:

- ***`geometry_hash`***: The [MD5](https://en.wikipedia.org/wiki/MD5) *hash* of the [GeoJSON](https://geojson.org) geometry, either a *polygon* or a *multi-polygon*.
- ***`std_dataset_ids`***: List of *datasets* associated with the record data. The value is the *primary key* of the `Dataset` collection.
- ***`properties`***: A record containing properties associated with the geometry, usually topographic information:
    - ***`geo_shape_area`***: Area.
    - ***`chr_AvElevation`***: Average elevation.
    - ***`chr_StdElevation`***: Elevation standard deviation.
    - ***`chr_AvSlope`***: Average slope.
    - ***`chr_AvAspect`***: Average aspect.
- ***`geometry`***: The [GeoJSON](https://geojson.org) geometry, either a *Polygon* or *MultiPolygon*.
- ***`geometry_bounds`***: The [GeoJSON](https://geojson.org) polygon enclosing the geometry.

These geometry records are stored in the `Shapes` collection.

#### Geometry by reference

This service returns the *unit geometry* record associated with the *provided geometry reference*.

The service expects the *geometry hash* to be provided as a *path query parameter*, `geometry_hash`.

#### Geometry by point

This service will return the *unit geometry records* that intersect the provided coordinates.

The service expects the latitude, `lat`, and the longitude, `lon`, to be provided as *path query parameters*. The service will return all records that intersect the point, the result will include a property, `geometry_point`, containing the [GeoJSON](https://geojson.org) point geometry of the provided coordinates.

#### Geometry search

This service will return the *unit geometry records* that *match* a series of *query parameters*. The service can be used to select geometries based on their characteristics.

The query parameters are provided in the body and are structured as follows:

- ***`geometry_hash`***: Provide a list of matching *geometry references*.
- ***`std_dataset_ids`***: Provide a list of matching *dataset references*.
- ***`geo_shape_area`***: This property can be used to select geometries according to their area: it contains two child properties:
    - ***`min`***: Minimum area (included).
    - ***`max`***: Maximum area (included).
- ***`chr_AvElevation`***: This property can be used to select geometries according to their average elevation: it contains two child properties:
    - ***`min`***: Minimum average elevation (included).
    - ***`max`***: Maximum average elevation (included).
- ***`chr_StdElevation`***: This property can be used to select geometries according to their elevation standard deviation: it contains two child properties:
    - ***`min`***: Minimum elevation standard deviation (included).
    - ***`max`***: Maximum elevation standard deviation (included).
- ***`chr_AvSlope`***: This property can be used to select geometries according to their average slope: it contains two child properties:
    - ***`min`***: Minimum average slope (included).
    - ***`max`***: Maximum average slope (included).
- ***`chr_AvAspect`***: This property can be used to select geometries according to their average aspect: it contains two child properties:
    - ***`min`***: Minimum average aspect (included).
    - ***`max`***: Maximum average aspect (included).
- ***`intersects`***: A [GeoJSON](https://geojson.org) geometry intersecting unit geometries.
- ***`distance`***: A property used to select geometries by distance, the distance is calculated using the centroid of both the unit geometry and the provided reference geometry:
    - ***`reference`***: The provided [GeoJSON](https://geojson.org) reference geometry.
    - ***`range`***: The desired distance range:
        - ***`min`***: Minimum distance.
        - ***`max`***: Maximum distance.
- ***`paging`***: Results paging:
    - ***`offset`***: Page records offset.
    - ***`limit`***: Maximum number of records to return.

The returned records will add a `distance` property, in meters, *if the selection criteria included distance*.

### Remote Sensing Metadata

Remote sensing data is associated to *conservation unit geometries*, the data is *averaged* for each geometry characterising the regions that make up a conservation unit. The purpose of these services is to provide *aggregated summary information* before performing queries on the actual data.

The reason these services are important is that there is a very large amount of data associated with each geometry, it is therefore a good practice to retrieve a window of data selected using a user interface that limits which descriptors are returned and for which time frame.

All data is stored in the `ShapeData` collection, grouped by *geometry*, `geometry_hash`, *time span*, `std_date_span`, and *date*, `std_date`. The main grouping in this set of services is *time span*, which indicates whether the date is a *year*, *month* or *day*.

All services select remote sensing data according to a set of query parameters provided in the body, omit any to ignore:

- ***`geometry_hash_list`***: List of conservation unit geometries to match.
- ***`std_date_span`***: List of time spans to match: daily data, `std_date_span_day`, monthly data, `std_date_span_month` and/or yearly data, `std_date_span_year`.
- ***`std_date_start`***: Start date (included).
- ***`std_date_end`***: End date (included).
- ***`std_terms`***: List of variables to match.
- ***`std_dataset_ids`***: List of datasets to match.

Note that all dates are expressed in `YYYYMMDD` string format, where the day, `DD`, and month, `MM`, can be omitted: this means that dates remain sorted and it is not necessary to have separate query fields for daily, monthly and yearly data.

#### Metadata by time span

This service will return the *data summary* of *remote sensing data* matching the query parameters provided in the body. The data will be *grouped* by *time span*, `std_date_span`, and the *summary data* will *aggregate* all *matched geometries* in the *matched time spans*.

The result will be a series of records grouped by *time span*, `std_date_span`, and  structured as follows:

- ***`count`***: Number of records matched for the current time span.
- ***`std_date_span`***: Current time span, `std_date_span_day`, `std_date_span_month` or `std_date_span_year`.
- ***`std_date_start`***: Start of date range for the current time span.
- ***`std_date_end`***: Start of date range for the current time span.
- ***`std_terms`***: List of featured variables for the current time span.
- ***`std_dataset_ids`***: List of featured datasets for the current time span.

This service is useful when one needs to provide data for a selection of geometries: the *summary data* provides information regarding the *number of records*, the *start* and *end dates*, the *featured variables* and the *featured datasets*. This provides the necessary information to limit the information provided to the user.

#### Metadata by geometry and time span

This service will return the *data summary* of *remote sensing data* matching the query parameters provided in the body. The data will be grouped by *geometry reference*, `geometry_hash` and *time span*, `std_date_span`.

The result will be *one record for each geometry*, *within this record* there will be *one sub-record for each time span* with summary data regarding the current geometry and time span. The result is structured as follows:

- ***`geometry_hash`***: Geometry [MD5](https://en.wikipedia.org/wiki/MD5) hash, or geometry record reference.
- ***`properties`***: Summary data for the current geometry grouped by time span, `std_date_span`:
    - ***`count`***: Number of records matched for the current geometry and time span.
    - ***`std_date_span`***: Current time span, `std_date_span_day`, `std_date_span_month` or `std_date_span_year`, for the current geometry.
    - ***`std_date_start`***: Start of date range for the current geometry and time span.
    - ***`std_date_end`***: Start of date range for the current geometry and time span.
    - ***`std_terms`***: List of featured variables for the current geometry and time span.
    - ***`std_dataset_ids`***: List of featured datasets for the current geometry and time span.

This service is useful when one needs to provide data for individual geometries: the summary data provides information regarding the amount of records, the start and end dates, the featured variables and the featured datasets. This provides the necessary information to limit the information provided to the user according to the statistics of each individual geometry.

### Remote Sensing Data

This set of services can be used to retrieve *remote sensing data*, which is stored in the `ShapeData` collection. Remote sensing data includes the following indicators:

- ***`chr_AvAspect`***: Average GCU aspect.
- ***`chr_AvBiomass`***: Average GCU Biomass.
- ***`chr_AvCanopyHeight`***: Average GCU canopy height.
- ***`chr_AvElevation`***: Average GCU elevation.
- ***`chr_AvGrossPrimProd`***: Average GCU Gpp.
- ***`chr_AvLeafAreaIdx`***: Average GCU Lai.
- ***`chr_AvNormDiffVegIdx`***: Average GCU Normalized Difference Vegetation Index.
- ***`chr_AvNormDiffWaterIdx`***: Average GCU Normalized Difference Water Index.
- ***`chr_AvSlope`***: Average GCU slope.
- ***`chr_DomLeafType`***: Dominant leaf type.
- ***`chr_LandSurfTemp`***: GCU Land surface temperature.
- ***`chr_RelHumid`***: Relative humidity.
- ***`chr_StdElevation`***: GCU elevation standard deviation.
- ***`env_climate_slhf`***: Surface latent heat flux.
- ***`env_climate_snsrad`***: Surface net solar radiation.
- ***`env_climate_soil_temp_100`***: Soil temperature from 28 to 100cm.
- ***`env_climate_soil_temp_28`***: Soil temperature from 7 to 28cm.
- ***`env_climate_soil_temp_289`***: Soil temperature from 100 to 289cm.
- ***`env_climate_soil_temp_7`***: Soil temperature from 0 to 7cm.
- ***`env_climate_soil_water_100`***: Volumetric soil water layer from 28 to 100cm.
- ***`env_climate_soil_water_28`***: Volumetric soil water layer from 7 to 28cm.
- ***`env_climate_soil_water_289`***: Volumetric soil water layer from 100 to 289cm.
- ***`env_climate_soil_water_7`***: Volumetric soil water layer from 0 to 7cm.
- ***`env_climate_temp-2m`***: Air temperature at 2 meters.
- ***`env_climate_tpr`***: Total precipitation.
- ***`env_climate_wind`***: Wind speed.
- ***`geo_shape_area`***: Geometry area.

Results are sorted by date.

#### Data by geometry and time span

This service will return *all data* for a *specific geometry* that satisfies a *set of query parameters*.

The geometry reference is provided as a query path parameter, `geometry_hash`, and the query parameters are provided in the body and structured as follows, omit any to ignore:

- ***`std_date_start`***: Start date (included).
- ***`std_date_end`***: End date (included).
- ***`std_terms`***: List of variables to match.
- ***`std_dataset_ids`***: List of datasets to match.

The result is the time series data grouped by time span:

- ***`std_date_span`***: The time span, `std_date_span_day`, `std_date_span_month` or `std_date_span_year`.
- ***`std_date_series`***: An array of objects containing the time series data grouped by date:
    - ***`std_date`***: Measurement date.
    - ***`properties`***: An object containing the data indicators for that date.

### European Drought Observatory Metadata

[European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) data is provided in a grid, the idea is that users can provide a point or shape and get in real time a set of data. The purpose of these services is to provide *aggregated information* before performing queries on the actual data.

The reason these services are important is that there is a very large amount of data associated with each point of the grid, it is therefore a good practice to retrieve a window of data selected using a user interface that limits which descriptors are returned and for which data time frame.

Data is stored in two related collections: `DroughtObservatory` groups data by grid cell geometry and date, all dates are daily; `DroughtObservatoryMap` contains the geometry of all grid cells. Services are designed to first probe the grid and then associate data related to the selected cells.

The grid features cells of three different resolutions, so whenever you select a point on the map you should have at least three grid cells that contain that point, the services will either return the *summary data* grouped by *date*, or by *date* and *grid cell resolution*.

All services select data according to a set of *query parameters* provided in the body, omit any to ignore:

- ***`std_date_start`***: Time frame start date (included).
- ***`std_date_end`***: Time frame end date (included).
- ***`std_terms`***: List of variables to match.
- ***`std_dataset_ids`***: List of datasets to match.
- ***`geometry_point_radius`***: List of grid cell resolutions to match, in degrees.

#### Metadata for coordinates

This service will return the *aggregated data summary* for the data *corresponding* to the *provided coordinates* and *query parameters*.

The service expects the point coordinates as path query parameters: `lat` for the *latitude* and `lon` for the *longitude*. The *query parameters* can be added in the body, as described above.

The result of the service will be the *aggregated summary* for all grid cells that contain the provided point, the structure is as follows:

- ***`count`***: Number of measurements.
- ***`std_date_start`***: Date range start.
- ***`std_date_end`***: Date range end.
- ***`std_terms`***: List of featured indicators.
- ***`std_dataset_ids`***: List of featured datasets.
- ***`geometry_point_radius`***: List of featured grid cell resolutions in degrees.
- ***`geometry_point`***: List of grid cell centroids as [GeoJSON](https://geojson.org) point geometries.
- ***`geometry_bounds`***: List of grid cell geometries as [GeoJSON](https://geojson.org) polygons.

#### Metadata by geometry for coordinates

This service will return the *aggregated data summary* for the data *corresponding* to the *provided coordinates* and *query parameters* grouped *by grid cell resolution*.

The service expects the point coordinates as path query parameters: `lat` for the *latitude* and `lon` for the *longitude*. The *query parameters* can be added in the body, as described above.

The service will return the *aggregated summary* data, *one record for each grid cell* that *contains the provided point* with the following structure:

- ***`count`***: Number of measurements.
- ***`std_date_start`***: Date range start.
- ***`std_date_end`***: Date range end.
- ***`std_terms`***: List of featured indicators.
- ***`std_dataset_ids`***: List of featured datasets.
- ***`geometry_point_radius`***: Grid cell resolution in degrees.
- ***`geometry_point`***: [GeoJSON](https://geojson.org) point geometry of the grid cell centroid.
- ***`geometry_bounds`***: [GeoJSON](https://geojson.org) polygon geometry of the grid cell.

### European Drought Observatory Data

This set of services can be used to retrieve *drought observatory data* by *grid cell*, or *aggregated* by *date*.

Both services expect a point whose coordinates are provided as path query parameters: `lat` for the *latitude* and `lon` for the *longitude*. Data can be further refined using a set of query parameters provided in the body, omit to ignore.

#### Data by geometry

This service will return the data for all grid cells that contain the point provided in the path query parameters and that satisfy the eventual query parameters in the body structured as follows:

- ***`std_date_start`***: Date range start.
- ***`std_date_end`***: Date range end.
- ***`std_terms`***: List of featured indicators.
- ***`std_dataset_ids`***: List of featured datasets.
- ***`geometry_point_radius`***: List of featured grid cell resolutions in degrees.

The result will be one record per matching grid cell:

- ***`geometry_point_radius`***: The grid cell resolution in degrees.
- ***`geometry_point`***: [GeoJSON](https://geojson.org) point geometry of the grid cell centroid.
- ***`geometry_bounds`***: [GeoJSON](https://geojson.org) polygon geometry of the grid cell.
- ***`std_dataset_ids`***: List of featured datasets.
- ***`properties`***: An array of time series data with the date, `std_date`, and the data indicators available for that date.

This service returns data for individual geometries.

#### Data by date

This serv0ice will return the aggregated data for all grid cells that contain the point provided in the path query parameters and that satisfy the eventual query parameters in the body structured as follows:

- ***`std_date_start`***: Date range start.
- ***`std_date_end`***: Date range end.
- ***`std_terms`***: List of featured indicators.
- ***`std_dataset_ids`***: List of featured datasets.
- ***`geometry_point_radius`***: List of featured grid cell resolutions in degrees.
- ***`paging`***: Results paging:
    - ***`offset`***: Page records offset.
    - ***`limit`***: Maximum number of records to return.

The result will be one record per date:

- ***`std_date`***: The date.
- ***`properties`***: Data indicators for that date.
- ***`std_dataset_ids`***: List of featured datasets for that date.

This service returns data for all geometries.

### Datasets

This set of services will return metadata regarding the datasets featured in the `Dataset` collection and the other external databases collections.

A dataset record has the following structure:

- ***`_key`***: The dataset primary key string.
- ***`_collection`***: Database collection name where data for this dataset is stored.
- ***`std_project`***: Code of the project to which the dataset belongs.
- ***`std_dataset`***: Dataset code or acronym.
- ***`std_dataset_group`***: Dataset group code or acronym.
- ***`_subjects`***: List of subject codes featured in data descriptors.
- ***`_classes`***: List of class codes featured in data descriptors.
- ***`_domain`***: List of domain codes featured in data descriptors.
- ***`_tag`***: List of tag codes featured in data descriptors.
- ***`std_date_start`***: Dates range start.
- ***`std_date_end`***: Dates range end.
- ***`std_date_submission`***: Dataset submission date.
- ***`count`***: Total number of data records.
- ***`_title`***: Multilingual title or label.
- ***`_description`***: Multilingual description.
- ***`_citation`***: List of required citations.
- ***`std_terms`***: List of featured indicators.
- ***`std_terms_quant`***: List of featured quantitative indicators.
- ***`std_terms_key`***: List of indicators that represent the unique key of a record.
- ***`std_terms_summary`***: List of indicators that can be used for groupings and summaries.
- ***`_subject`***: Dataset data subject.
- ***`species_list`***: List of featured taxa scientific names.
- ***`std_dataset_markers`***: List of taxa/marker combinations:
    - ***`species`***: Scientific name.
    - ***`chr_GenIndex`***: Genetic index.
    - ***`chr_GenoTech`***: Method.
    - ***`chr_MarkerType`***: Type of Marker/Trait.
    - ***`chr_NumberOfLoci`***: Number of loci.
    - ***`chr_SequenceLength`***: Sequence length.

Note that datasets belonging to external databases and EUFGIS characterisation datasets feature a different set of descriptors, the above selection encompasses both types.

#### Query datasets

This service will return all *external database dataset records* matching the query parameters provided in the body. A *path query parameter*, `op`, determines whether the condition clauses are concatenated as a series of `AND` or `OR` clauses.

The selection criteria is structured as follows:

- ***`_key`***: The dataset primary key string.
- ***`_collection`***: Database collection name where data for this dataset is stored.
- ***`std_project`***: Code of the project to which the dataset belongs.
- ***`std_dataset`***: Dataset code or acronym.
- ***`std_dataset_group`***: Dataset group code or acronym.
- ***`std_date`***: Date range:
    - ***`std_date_start`***: Start date (included).
    - ***`std_date_end`***: End date (included).
- ***`std_date_submission`***: Submission date range:
    - ***`std_date_start`***: Start date (included).
    - ***`std_date_end`***: End date (included).
- ***`count`***: Total number of data records:
    - ***`min`***: Minimum (included).
    - ***`max`***: Maximum (included).
- ***`_subject`***: List of matching dataset data subjects.
- ***`_classes`***: Class codes featured in data descriptors:
    - ***`items`***: List of codes to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.
- ***`_domain`***: Domain codes featured in data descriptors:
    - ***`items`***: List of codes to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.
- ***`_tag`***: Tag codes featured in data descriptors:
    - ***`items`***: List of codes to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.
- ***`_title`***: Provide space delimited keywords to search dataset titlein English.
- ***`_description`***: Provide space delimited keywords to search dataset description in English.
- ***`_citation`***: Provide space delimited keywords to search dataset citations.
- ***`species_list`***: Provide space delimited keywords to search scientific names.
- ***`std_terms`***: Featured indicators:
    - ***`items`***: List of names to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.
- ***`std_terms_key`***: Featured key indicators:
    - ***`items`***: List of names to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.
- ***`std_terms_quant`***: Featured quantitative indicators:
    - ***`items`***: List of names to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.
- ***`std_terms_summary`***: Featured summary indicators:
    - ***`items`***: List of names to match.
    - ***`doAll`***: `true` means all elements must match; `false` means at least one should match.

## Progress

This is a work in progress, so expect this document to grow and change over time.

## Licence

Copyright (c) 2023 Milko Škofič

License: Apache 2
