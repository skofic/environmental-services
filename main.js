'use strict'

///
// Get context.
///
const { context } = require('@arangodb/locals')

///
// Set routes.
///
context.use('/gcu', require('./routes/unitsData'), 'Units')
context.use('/shape', require('./routes/shapesData'), 'Unit shapes')
context.use('/occur', require('./routes/speciesOccurrences'), 'Species occurrences')
context.use('/rs/data', require('./routes/remoteSensingData'), 'Remote Sensing Data')
context.use('/rs/meta', require('./routes/remoteSensingMeta'), 'Remote Sensing Metadata')
