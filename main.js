'use strict'

///
// Get context.
///
const { context } = require('@arangodb/locals')

///
// Set routes.
///
context.use('/chelsa', require('./routes/chelsaClimate'), 'Chelsa')
context.use('/worldclim', require('./routes/worldclimClimate'), 'WorldClim')
context.use('/hash', require('./routes/shapeHashes'), 'Hash Geometries')
context.use('/gcu', require('./routes/unitsData'), 'Conservation Units')
context.use('/shape', require('./routes/unitShapes'), 'Conservation Unit Shapes')
context.use('/rs/meta', require('./routes/remoteSensingMeta'), 'Remote Sensing Meta')
context.use('/rs/data', require('./routes/remoteSensingData'), 'Remote Sensing Data')
// context.use('/occur', require('./routes/speciesOccurrences'), 'Species occurrences')
context.use('/do/meta', require('./routes/droughtObservatoryMeta'), 'European Drought Observatory Meta')
context.use('/do/data', require('./routes/droughtObservatoryData'), 'European Drought Observatory Data')
context.use('/dataset', require('./routes/datasets'), 'Datasets')
