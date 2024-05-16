# Environmental Data Services

This repository contains the [ArangoDB](https://www.arangodb.com/) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) for publishing *remote sensing* and *climate data* related to dynamic conservation units of forest trees, published in the [EUFGIS](http://www.eufgis.org) information system.

This work is being conducted for the [upgrade](https://www.forgenius.eu/eufgis) of the [EUFGIS](http://www.eufgis.org/) information system within the framework of the [FORGENIUS](https://www.forgenius.eu/) project.

## Database

The database is implemented using [ArangoDB](https://www.arangodb.com/) and contains the following collections:

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

This collection contains all data related to the `Shapes` collection. All data is grouped by shape, date span and date.

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

This collection contains data from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) repository. It is a collection of measurements subdivided into a set of 1km., 5km. and 25 km. resolution grids covering the extended European region. Each record references a *specific layer cell* and *date*, all dates are daily.

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

The `geometry_hash` points to the `Shapes` record, it is the MD5 hash of the shape `geometry` property.

The `std_date_span` field represents the time period associated with the measurement: `std_date_span_day` for daily data, `std_date_span_month` for monthly averages and `std_date_span_year` for yearly averages.

The `std_date` field represents the measurement date in `YYYYMMDD` format, `Y` for year, `M` for month and `D` for day. Daily data requires the full date, monthly data can omit the month and yearly data can omit month and day.

The `properties` field contains the remote sensing data, above is an example. All remote sensing data is aggregated and grouped by *shape*, *span* and *date*.

The `std_terms` field contains the list of featured data properties.

The `std_dataset_ids` field contains the list of referenced datasets, the values are links to `Dataset` collection records.

All properties are documented in the [data dictionary](https://github.com/skofic/data-dictionary-service.git).

#### 





The geographic shapes are essentially polygons comprising the genetic conservation unit, the remote sensing data is expected to be averaged over each of these polygons.

The climate data is an aggregation of [Chelsa](https://chelsa-climate.org/) and [WorldClim](https://worldclim.org/) data, *historic* and *future*, *clipped* to a *predefined region*, that can be queried for a specific *point* or *averaged* for a *provided polygon*.

The services also provide data from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000), that can be queried for a specific *point* or *averaged* for a *provided polygon*.

The script to download, clip, process and combine remote sensing data is stored in a [Colab](https://colab.research.google.com/) sheet that runs on the [Google Earth Engine](https://earthengine.google.com/), a repository for that part is into the making.

The scripts to download, clip, process, combine and merge [Chelsa](https://chelsa-climate.org/), [WorldClim](https://worldclim.org/) and [EDO](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) data will generate a database that is used by this service to provide both the remote sensing data, as well as climate data to characterise geographic areas of interest.

All properties stored and served by the services follow the rules and are featured in a [data dictionary](https://github.com/skofic/data-dictionary-service.git) that provides the metadata layer describing all the data.

This work is being conducted for the [upgrade](https://www.forgenius.eu/eufgis) of the [EUFGIS](http://www.eufgis.org/) information system within the framework of the [FORGENIUS](https://www.forgenius.eu/) project.

Size Limit is a performance budget tool for JavaScript. It checks every commit
on CI, calculates the real cost of your JS for end-users and throws an error
if the cost exceeds the limit.

* **ES modules** and **tree-shaking** support.
* Add Size Limit to **GitHub Actions**, **Circle CI** or another CI system
  to know if a pull request adds a massive dependency.
* **Modular** to fit different use cases: big JS applications
  that use their own bundler or small npm libraries with many files.
* Can calculate **the time** it would take a browser
  to download and **execute** your JS. Time is a much more accurate
  and understandable metric compared to the size in bytes.
* Calculations include **all dependencies and polyfills**
  used in your JS.

<p align="center">
  <img src="./img/example.png" alt="Size Limit CLI" width="738">
</p>

With **[GitHub action]** Size Limit will post bundle size changes as a comment
in pull request discussion.

<p align="center">
<img src="https://raw.githubusercontent.com/andresz1/size-limit-action/master/assets/pr.png"
  alt="Size Limit comment in pull request about bundle size changes"
  width="686" height="289">
</p>

With `--why`, Size Limit can tell you *why* your library is of this size
and show the real cost of all your internal dependencies.
We are using [Statoscope] for this analysis.

<p align="center">
  <img src="./img/why.png" alt="Statoscope example" width="650">
</p>

<p align="center">
  <a href="https://evilmartians.com/?utm_source=size-limit">
    <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
         alt="Sponsored by Evil Martians" width="236" height="54">
  </a>
</p>

[GitHub action]: https://github.com/andresz1/size-limit-action
[Statoscope]:    https://github.com/statoscope/statoscope
[cult-img]:      http://cultofmartians.com/assets/badges/badge.svg
[cult]:          http://cultofmartians.com/tasks/size-limit-config.html

## Who Uses Size Limit

* [MobX](https://github.com/mobxjs/mobx)
* [Material-UI](https://github.com/callemall/material-ui)
* [Autoprefixer](https://github.com/postcss/autoprefixer)
* [PostCSS](https://github.com/postcss/postcss) reduced
  [25% of the size](https://github.com/postcss/postcss/commit/150edaa42f6d7ede73d8c72be9909f0a0f87a70f).
* [Browserslist](https://github.com/browserslist/browserslist) reduced
  [25% of the size](https://github.com/browserslist/browserslist/commit/640b62fa83a20897cae75298a9f2715642531623).
* [EmojiMart](https://github.com/missive/emoji-mart) reduced
  [20% of the size](https://github.com/missive/emoji-mart/pull/111)
* [nanoid](https://github.com/ai/nanoid) reduced
  [33% of the size](https://github.com/ai/nanoid/commit/036612e7d6cc5760313a8850a2751a5e95184eab).
* [React Focus Lock](https://github.com/theKashey/react-focus-lock) reduced
  [32% of the size](https://github.com/theKashey/react-focus-lock/pull/48).
* [Logux](https://github.com/logux) reduced
  [90% of the size](https://github.com/logux/logux-client/commit/62b258e20e1818b23ae39b9c4cd49e2495781e91).


## How It Works

1. Size Limit contains a CLI tool, 3 plugins (`file`, `webpack`, `time`)
   and 3 plugin presets for popular use cases (`app`, `big-lib`, `small-lib`).
   A CLI tool finds plugins in `package.json` and loads the config.
2. If you use the `webpack` plugin, Size Limit will bundle your JS files into
   a single file. It is important to track dependencies and webpack polyfills.
   It is also useful for small libraries with many small files and without
   a bundler.
3. The `webpack` plugin creates an empty webpack project, adds your library
   and looks for the bundle size difference.
4. The `time` plugin compares the current machine performance with that of
   a low-priced Android devices to calculate the CPU throttling rate.
5. Then the `time` plugin runs headless Chrome (or desktop Chrome if it’s
   available) to track the time a browser takes to compile and execute your JS.
   Note that these measurements depend on available resources and might
   be unstable. [See here](https://github.com/mbalabash/estimo/issues/5)
   for more details.


## Usage

### JS Applications

Suitable for applications that have their own bundler and send the JS bundle
directly to a client (without publishing it to npm). Think of a user-facing app
or website, like an email client, a CRM, a landing page or a blog with
interactive elements, using React/Vue/Svelte lib or vanilla JS.

<details><summary><b>Show instructions</b></summary>

1. Install the preset:

    ```sh
    npm install --save-dev size-limit @size-limit/file
    ```

2. Add the `size-limit` section and the `size` script to your `package.json`:

    ```diff
    + "size-limit": [
    +   {
    +     "path": "dist/app-*.js"
    +   }
    + ],
      "scripts": {
        "build": "webpack ./webpack.config.js",
    +   "size": "npm run build && size-limit",
        "test": "vitest && eslint ."
      }
    ```

3. Here’s how you can get the size for your current project:

    ```sh
    $ npm run size

      Package size: 30.08 kB with all dependencies, minified and brotlied
    ```

4. Now, let’s set the limit. Add 25% to the current total size and use that as
   the limit in your `package.json`:

    ```diff
      "size-limit": [
        {
    +     "limit": "35 kB",
          "path": "dist/app-*.js"
        }
      ],
    ```

5. Add the `size` script to your test suite:

    ```diff
      "scripts": {
        "build": "webpack ./webpack.config.js",
        "size": "npm run build && size-limit",
    -   "test": "vitest && eslint ."
    +   "test": "vitest && eslint . && npm run size"
      }
    ```

6. If you don’t have a continuous integration service running, don’t forget
   to add one — start with Github Actions.

</details>


### JS Application and Time-based Limit

File size limit (in kB) is not the best way to describe your JS application
cost for developers. Developers will compare the size of the JS bundle
with the size of images. But browsers need much more time to parse 100 kB
of JS than 100 kB of an image since JS compilers are very complex.

This is why Size Limit support time-based limit. It runs headless Chrome
to track the time a browser takes to compile and execute your JS.

<details><summary><b>Show instructions</b></summary>

1. Install the preset:

    ```sh
    npm install --save-dev size-limit @size-limit/preset-app
    ```

2. Add the `size-limit` section and the `size` script to your `package.json`:

    ```diff
    + "size-limit": [
    +   {
    +     "path": "dist/app-*.js"
    +   }
    + ],
      "scripts": {
        "build": "webpack ./webpack.config.js",
    +   "size": "npm run build && size-limit",
        "test": "vitest && eslint ."
      }
    ```

3. Here’s how you can get the size for your current project:

    ```sh
    $ npm run size

      Package size: 30.08 kB with all dependencies, minified and brotlied
      Loading time: 602 ms   on slow 3G
      Running time: 214 ms   on Snapdragon 410
      Total time:   815 ms
    ```

4. Now, let’s set the limit. Add 25% to the current total time and use that as
   the limit in your `package.json`:

    ```diff
      "size-limit": [
        {
    +     "limit": "1 s",
          "path": "dist/app-*.js"
        }
      ],
    ```

5. Add the `size` script to your test suite:

    ```diff
      "scripts": {
        "build": "webpack ./webpack.config.js",
        "size": "npm run build && size-limit",
    -   "test": "vitest && eslint ."
    +   "test": "vitest && eslint . && npm run size"
      }
    ```

6. If you don’t have a continuous integration service running, don’t forget
   to add one — start with Github Actions.

</details>


### Big Libraries

JS libraries > 10 kB in size.

This preset includes headless Chrome, and will measure your lib’s execution
time. You likely don’t need this overhead for a small 2 kB lib, but for larger
ones the execution time is a more accurate and understandable metric that
the size in bytes. Libraries like [React] are good examples for this preset.

<details><summary><b>Show instructions</b></summary>

1. Install preset:

    ```sh
    npm install --save-dev size-limit @size-limit/preset-big-lib
    ```

2. Add the `size-limit` section and the `size` script to your `package.json`:

    ```diff
    + "size-limit": [
    +   {
    +     "path": "dist/react.production-*.js"
    +   }
    + ],
      "scripts": {
        "build": "webpack ./scripts/rollup/build.js",
    +   "size": "npm run build && size-limit",
        "test": "vitest && eslint ."
      }
    ```

3. If you use ES modules you can test the size after tree-shaking with `import`
   option:

    ```diff
      "size-limit": [
        {
          "path": "dist/react.production-*.js",
    +     "import": "{ createComponent }"
        }
      ],
    ```

4. Here’s how you can get the size for your current project:

    ```sh
    $ npm run size

      Package size: 30.08 kB with all dependencies, minified and brotlied
      Loading time: 602 ms   on slow 3G
      Running time: 214 ms   on Snapdragon 410
      Total time:   815 ms
    ```

5. Now, let’s set the limit. Add 25% to the current total time and use that
   as the limit in your `package.json`:

    ```diff
      "size-limit": [
        {
    +     "limit": "1 s",
          "path": "dist/react.production-*.js"
        }
      ],
    ```

6. Add a `size` script to your test suite:

    ```diff
      "scripts": {
        "build": "rollup ./scripts/rollup/build.js",
        "size": "npm run build && size-limit",
    -   "test": "vitest && eslint ."
    +   "test": "vitest && eslint . && npm run size"
      }
    ```

7. If you don’t have a continuous integration service running, don’t forget
   to add one — start with Github Actions.
8. Add the library size to docs, it will help users to choose your project:

    ```diff
      # Project Name
    
      Short project description
    
      * **Fast.** 10% faster than competitor.
    + * **Small.** 15 kB (minified and brotlied).
    +   [Size Limit](https://github.com/ai/size-limit) controls the size.
    ```

</details>


### Small Libraries

JS libraries < 10 kB in size.

This preset will only measure the size, without the execution time, so it’s
suitable for small libraries. If your library is larger, you likely want
the Big Libraries preset above. [Nano ID] or [Storeon] are good examples
for this preset.

<details><summary><b>Show instructions</b></summary>

1. First, install `size-limit`:

    ```sh
    npm install --save-dev size-limit @size-limit/preset-small-lib
    ```

2. Add the `size-limit` section and the `size` script to your `package.json`:

    ```diff
    + "size-limit": [
    +   {
    +     "path": "index.js"
    +   }
    + ],
      "scripts": {
    +   "size": "size-limit",
        "test": "vitest && eslint ."
      }
    ```

3. Here’s how you can get the size for your current project:

    ```sh
    $ npm run size

      Package size: 177 B with all dependencies, minified and brotlied
    ```

4. If your project size starts to look bloated, run `--why` for analysis:

    ```sh
    npm run size -- --why
    ```

    > We use [Statoscope](https://github.com/statoscope/statoscope) as bundle analyzer.

5. Now, let’s set the limit. Determine the current size of your library,
   add just a little bit (a kilobyte, maybe) and use that as the limit
   in your `package.json`:

    ```diff
     "size-limit": [
        {
    +     "limit": "9 kB",
          "path": "index.js"
        }
     ],
    ```

6. Add the `size` script to your test suite:

    ```diff
      "scripts": {
        "size": "size-limit",
    -   "test": "vitest && eslint ."
    +   "test": "vitest && eslint . && npm run size"
      }
    ```

7. If you don’t have a continuous integration service running, don’t forget
   to add one — start with Github Actions.
8. Add the library size to docs, it will help users to choose your project:

    ```diff
      # Project Name
    
      Short project description
    
      * **Fast.** 10% faster than competitor.
    + * **Small.** 500 bytes (minified and brotlied). No dependencies.
    +   [Size Limit](https://github.com/ai/size-limit) controls the size.
    ```

</details>

[Storeon]: https://github.com/ai/storeon/
[Nano ID]: https://github.com/ai/nanoid/
[React]: https://github.com/facebook/react/


## Reports

Size Limit has a [GitHub action] that comments and rejects pull requests based
on Size Limit output.

1. Install and configure Size Limit as shown above.
2. Add the following action inside `.github/workflows/size-limit.yml`

```yaml
name: "size"
on:
  pull_request:
    branches:
      - master
jobs:
  size:
    runs-on: ubuntu-latest
    env:
      CI_JOB_NUMBER: 1
    steps:
      - uses: actions/checkout@v1
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```


## Config

### Plugins and Presets

Plugins or plugin presets will be loaded automatically from `package.json`.
For example, if you want to use `@size-limit/webpack`, you can just use
`npm install --save-dev @size-limit/webpack`, or you can use our preset
`@size-limit/preset-big-lib`.

Plugins:

* `@size-limit/file` checks the size of files with Brotli (default), Gzip
  or without compression.
* `@size-limit/webpack` adds your library to empty webpack project
  and prepares bundle file for `file` plugin.
* `@size-limit/webpack-why` adds reports for `webpack` plugin
  about your library is of this size to show the cost of all your
  dependencies.
* `@size-limit/webpack-css` adds css support for `webpack` plugin.
* `@size-limit/esbuild` is like `webpack` plugin, but uses `esbuild`
  to be faster and use less space in `node_modules`.
* `@size-limit/esbuild-why` add reports for `esbuild` plugin
  about your library is of this size to show the cost of all your
  dependencies.
* `@size-limit/time` uses headless Chrome to track time to execute JS.

Plugin presets:

* `@size-limit/preset-app` contains `file` and `time` plugins.
* `@size-limit/preset-big-lib` contains `webpack`, `file`, and `time` plugins.
* `@size-limit/preset-small-lib` contains `esbuild` and `file` plugins.


#### Third-Party Plugins

Third-party plugins and presets named starting with `size-limit-` are also supported.
For example:

* [`size-limit-node-esbuild`](https://github.com/un-ts/size-limit/tree/main/packages/node-esbuild)
  is like `@size-limit/esbuild` but for Node libraries.
* [`size-limit-preset-node-lib`](https://github.com/un-ts/size-limit/tree/main/packages/preset-node-lib)
  is like `@size-limit/preset-small-lib` but for Node libraries which contains
  above `node-esbuild` and core `file` plugins.
* [`nx-size-limit`](https://github.com/LironHazan/nx-size-limit)
  is an [NX](https://nx.dev/community) build system community plugin.


### Limits Config

Size Limits supports three ways to define limits config.

1. `size-limit` section in `package.json`:

   ```json
     "size-limit": [
       {
         "path": "index.js",
         "import": "{ createStore }",
         "limit": "500 ms"
       }
     ]
   ```

2. or a separate `.size-limit.json` config file:

   ```js
   [
     {
       "path": "index.js",
       "import": "{ createStore }",
       "limit": "500 ms"
     }
   ]
   ```

3. or a more flexible `.size-limit.js` or `.size-limit.cjs` config file:

   ```js
   module.exports = [
     {
       path: "index.js",
       import: "{ createStore }",
       limit: "500 ms"
     }
   ]
   ```

4. or types `.size-limit.ts`:

   ```ts
   import type { SizeLimitConfig } from '../../packages/size-limit'
   
   module.exports = [
     {
       path: "index.js",
       import: "{ createStore }",
       limit: "500 ms"
     }
   ] satisfies SizeLimitConfig
   ```

Each section in the config can have these options:

* **path**: relative paths to files. The only mandatory option.
  It could be a path `"index.js"`, a [pattern] `"dist/app-*.js"`
  or an array `["index.js", "dist/app-*.js", "!dist/app-exclude.js"]`.
* **import**: partial import to test tree-shaking. It could be `"{ lib }"`
  to test `import { lib } from 'lib'`, `*` to test all exports,
  or `{ "a.js": "{ a }", "b.js": "{ b }" }` to test multiple files.
* **limit**: size or time limit for files from the `path` option. It should be
  a string with a number and unit, separated by a space.
  Format: `100 B`, `10 kB`, `500 ms`, `1 s`.
* **name**: the name of the current section. It will only be useful
  if you have multiple sections.
* **entry**: when using a custom webpack config, a webpack entry could be given.
  It could be a string or an array of strings.
  By default, the total size of all entry points will be checked.
* **webpack**: with `false` it will disable webpack.
* **running**: with `false` it will disable calculating running time.
* **gzip**: with `true` it will use Gzip compression and disable
  Brotli compression.
* **brotli**: with `false` it will disable any compression.
* **config**: a path to a custom webpack config.
* **ignore**: an array of files and dependencies to exclude from
  the project size calculation.
* **modifyWebpackConfig**: (.size-limit.js only) function that can be used
  to do last-minute changes to the webpack config, like adding a plugin.
* **compareWith**: path to `stats.json` from another build to compare
  (when `--why` is using).
* **uiReports**: custom UI reports list (see [Statoscope docs]).

If you use Size Limit to track the size of CSS files, make sure to set
`webpack: false`. Otherwise, you will get wrong numbers, because webpack
inserts `style-loader` runtime (≈2 kB) into the bundle.

[Statoscope docs]: https://github.com/statoscope/statoscope/tree/master/packages/webpack-plugin#optionsreports-report
[pattern]: https://github.com/sindresorhus/globby#globbing-patterns

## Analyze with `--why`

You can run `size-limit --why` to analyze the bundle.

You will need to install `@size-limit/esbuild-why` or `@size-limit/webpack-why`
depends on which bundler you are using (default is `esbuild`).

For `@size-limit/esbuild-why`,
it will generate a `esbuild-why.html` at the current directory & open it in the browser.

If you also specify `--save-bundle <DIR>`,
the report will be generated inside `<DIR>`.

If you have multiple sections in your config,
the files will be named `esbuild-why-{n}.html`,
or you can give it a custom name:

```jsonc
[
  {
    "name": "cjs",
    /* snap */
  },
  {
    "name": "esm",
    /* snap */
  }
]
```

This will produce `esbuild-why-cjs.html` and `esbuild-why-esm.html` respectively.

For `@size-limit/webpack-why`,
it will generate the report and open it in the browser automatically.

## JS API

```js
const sizeLimit = require('size-limit')
const filePlugin = require('@size-limit/file')
const webpackPlugin = require('@size-limit/webpack')

sizeLimit([filePlugin, webpackPlugin], [filePath]).then(result => {
  result //=> { size: 12480 }
})
```