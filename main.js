'use strict'

///
// Get context.
///
const { context } = require('@arangodb/locals')

///
// Set routes.
///
context.use('/gcu', require('./routes/unitsData'), 'Genetic Conservation Unit Data')
context.use('/shape', require('./routes/shapesData'), 'Genetic Conservation Unit Shapes Data')
context.use('/rs/data', require('./routes/remoteSensingData'), 'Remote Sensing Data')
context.use('/rs/meta', require('./routes/remoteSensingMeta'), 'Remote Sensing Metadata')
