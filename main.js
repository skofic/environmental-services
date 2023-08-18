'use strict'

///
// Get context.
///
const { context } = require('@arangodb/locals')

///
// Set routes.
///
context.use('/rs/data', require('./routes/remoteSensingData'), 'Remote Sensing Data')
context.use('/rs/meta', require('./routes/remoteSensingMeta'), 'Remote Sensing Metadata')
