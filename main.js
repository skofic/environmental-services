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
context.use('/hash', require('./routes/shapeHashes'), 'Create shape hashes')
context.use('/gcu', require('./routes/unitsData'), 'Units')
context.use('/shape', require('./routes/unitShapes'), 'Unit shapes')
context.use('/rs/meta', require('./routes/remoteSensingMeta'), 'Remote Sensing Metadata')
context.use('/rs/data', require('./routes/remoteSensingData'), 'Remote Sensing Data')
// context.use('/occur', require('./routes/speciesOccurrences'), 'Species occurrences')
context.use('/do/data', require('./routes/droughtObservatoryData'), 'Drought Observatory Data')
context.use('/do/meta', require('./routes/droughtObservatoryMeta'), 'Drought Observatory Metadata')
context.use('/dataset', require('./routes/datasets'), 'Datasets')
