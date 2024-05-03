# Environmental Services

###### No Views Version

This repository contains the [ArangoDB](https://www.arangodb.com) [Foxx micro service](https://www.arangodb.com/docs/stable/foxx.html) to publish *remote sensing* and *climate data* related to *genetic conservation unit geometries* and discrete locations in *Europe*.

The geographic shapes are essentially polygons comprising the genetic conservation unit, the remote sensing data is expected to be averaged over each of these polygons.

The climate data is an aggregation of [Chelsa](https://chelsa-climate.org) and [WorldClim](https://worldclim.org) data, *historic* and *future*, *clipped* to a *predefined region*, that can be queried for a specific *point* or *averaged* for a *provided polygon*.

The services also provide data from the [European Drought Observatory](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000), that can be queried for a specific *point* or *averaged* for a *provided polygon*.

The script to download, clip, process and combine remote sensing data is stored in a [Colab](https://colab.research.google.com) sheet that runs on the [Google Earth Engine](https://earthengine.google.com), a repository for that part is into the making.

The scripts to download, clip, process, combine and merge [Chelsa](https://chelsa-climate.org), [WorldClim](https://worldclim.org) and [EDO](https://edo.jrc.ec.europa.eu/edov2/php/index.php?id=1000) data will generate a database that is used by this service to provide both the remote sensing data, as well as climate data to characterise geographic areas of interest.

All properties stored and served by the services follow the rules and are featured in a [data dictionary](https://github.com/skofic/data-dictionary-service.git) that provides the metadata layer describing all the data.

This work is being conducted for the [upgrade](https://www.forgenius.eu/eufgis) of the [EUFGIS](http://www.eufgis.org) information system within the framework of the [FORGENIUS](https://www.forgenius.eu) project.

## Installation

1. You must first either install [ArangoDB](https://www.arangodb.com), or have an existing database available.
2. Create the database using the scripts published in this [repository](https://github.com/skofic/ClimateService.git). Be prepared to juggle *a lot of data* and run scripts that will last for *a long time*...
3. Compile the GeoService database from the latter repository.
4. *Add service* to the database. The best way is to select the GitHub tab and enter `skofic/environmental-services` in the *Repository* field, and `main` in the *Version* field. The *Mount point* can be any string. Turn on *Run* setup flag.

## Services

Currently we only feature the remote sensing data scripts, this is a work in progress that, once finished, should add a set of services targeting climate data.

The services are divided into the following sections:

### Shape hash

This set of services can be used to generate shape hashes. A shape hash is an MD5 hash of a geometry. All GCU polygons have a unique identifier that is the MD5 hash of the polygon geometry. Use these services to retrieve the GeoJSON geometry and its hash when creating GCU shapes.

### Units

This set of services can be used to query EUFGIS Conservation Units and relate them to the set of geometric shapes that comprise them. You can retrieve all unit IDs related to the provided unit number, retrieve all shape references related to the provided unit ID, or retrieve the unit information related to the provided shape reference.

### Unit Shapes

This set of services can be used to retrieve conservation unit shape information. Besides retrieveing the shape by its reference, these services allow retrieving shapes in relation to the provided coordinates, by distance and selecting shapes based on elevation, elevation standard deviation, slope and aspect.

### Species Occurrences

This set of services can be used to query locations related to the provided coordinates or geometries and related to a set of species. The database currently features a set of locations and species lists based on old EUFGIS data: these services serve as a template to integrate future datasets that feature locations and species.

### Drought Observatory Data

This set of services can be used to retrieve daily historical drought indicators for the provided coordinates. The services will return all data, filter data by date and descriptors.

### Drought Observatory EDOMetadata

This set of services can be used to retrieve data summaries related to the provided coordinates. Since there can be a very large number of observations related to the provided coordinates, these services can be used to assess the time interval and variables selection, allowing clients to provide a user interface in which users can select manageable subsets of data using the previous set of services.

### Remote Sensing Data

This set of services can be used to query remote sensing data for a specific polygon or shape. All services expect the shape identifier as the first path parameter, other parameters include a start and end date to define a time range, a list of variable names to only retrieve data for selected descriptors and a list of time spans identifying observation time spans, such as daily, monthly and yearly data.

### Remote Sensing EDOMetadata

This set of services can be used to assess what date ranges, time spans and variables are contained in the data characyerising the provided shape. These services should typically be used to determine how data is subdivided, in order to serve only the data needed. This is especially relevant if you have twenty or more years of daily data, which will easily exceed 5MB.

### Chelsa

This set of services can be used to retrieve [Chelsa](https://chelsa-climate.org) [2.1 data](https://chelsa-climate.org/wp-admin/download-page/CHELSA_tech_specification_V2.pdf). Currently the database is [populated](https://github.com/skofic/ClimateService) with historical data of the 1981 to 2010 period. For future data we have used the MPI- ESM1-2- HR model from Max Planck Institute for Meteorology using the SSP3-RCP7 climate scenario as simulated by the GCMs. Future data covers the 2011-2040, 2041-2070 and 2071-2100 forecasted periods. It is possible to retrieve the record corresponding to a provided coordinate, retrieve records or aggregated statistics on data points based on distance and retrieve records or aggregated statistics for records contained or intersecting with the provided reference geometry.

### Worldclim

This set of services provides the same access to [Worldclim](https://worldclim.org) climate data as the *Chelsa* services do. Historical climate data covers the 1970-2000 period, future scenarios use the same models as for the Chelsa data and cover the 2021-2040, 2041-2060, 2061-2080 and 2081-2100 periods.

## Progress

This is a work in progress, so expect this document to grow and change over time.

# License

Copyright (c) 2023 Milko Škofič

License: Apache 2
