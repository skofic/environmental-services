# Environmental Services

This repository contains the [ArangoDB](https://www.arangodb.com) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) to publish *remote sensing data* related to *geographic shapes* and *climate data* covering a *predefined region*.

The geographic shapes are essentially polygons comprising a geographic unit, the remote sensing data is expected to be averaged over each of these polygons.

The climate data is an aggregation of [Chelsa](https://chelsa-climate.org) and [WorldClim](https://worldclim.org) data, *historic* and *future*, *clipped* to a *predefined region*, that can be queried for a specific *point* or *averaged* for a *provided polygon*.

The script to download, clip, process and combine remote sensing data is stored in a [Colab](https://colab.research.google.com) sheet that runs on the [Google Earth Engine](https://earthengine.google.com), a repository for that part is into the making.

The scripts to download, clip, process, combine and merge [Chelsa](https://chelsa-climate.org) and [WorldClim](https://worldclim.org) data will generate a database that is used by this service to provide both the remote sensing data, as well as climate data to characterise geographic areas of interest.

All properties stored and served by the services follow the rules and are featured in a [data dictionary](https://github.com/skofic/data-dictionary-service.git) that provides the metadata layer describing all the data.

This work is being conducted for the [upgrade](https://www.forgenius.eu/eufgis) of the [EUFGIS](http://www.eufgis.org) information system within the framework of the [FORGENIUS](https://www.forgenius.eu) project.

## Installation

1. You must first either install [ArangoDB](https://www.arangodb.com), or have an existing database available.
2. Create the database using the scripts published in this [repository](https://github.com/skofic/ClimateService.git). Be prepared to juggle *a lot of data* and run scripts that will last for *a long time*...
3. Compile the GeoService database from the latter repository.
4. *Add service* to the database. The best way is to select the GitHub tab and enter `skofic/environmental-services` in the *Repository* field, and `main` in the *Version* field. The *Mount point* can be any string. Turn on *Run* setup flag.

## Services

Currently we only feature the remote sensing data scripts, this is a work in progress that, once finished, should add a set of services targeting climate data.

The services are divided into sections:

### Remote Sensing Data

This set of services can be used to query remote sensing data for a specific polygon or shape. All services expect the shape identifier as the first path parameter, other parameters include a start and end date to define a time range, a list of variable names to only retrieve data for selected descriptors and a list of time spans identifying observation time spans, such as daily, monthly and yearly data.

### Remote Sensing Metadata

This set of services can be used to assess what date ranges, time spans and variables are contained in the data characyerising the provided shape. These services should typically be used to determine how data is subdivided, in order to serve only the data needed. This is especially relevant if you have twenty or more years of daily data, which will easily exceed 5MB.

## Progress

This is a work in progress, so expect this document to grow.

# License

Copyright (c) 2023 Milko Škofič

License: Apache 2
