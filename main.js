'use strict'

///
// Get context.
///
const { context } = require('@arangodb/locals')

///
// Set routes.
///
context.use('/rs', require('./routes/remoteSensing'), 'Remote Sensing')
context.use('/chelsa', require('./routes/chelsa'), 'chelsa')
context.use('/chelsamap', require('./routes/chelsamap'), 'chelsamap')
context.use('/climate', require('./routes/climate'), 'climate')
context.use('/climatemap', require('./routes/climatemap'), 'climatemap')
context.use('/shapes', require('./routes/shapes'), 'shapes')
context.use('/shapedata', require('./routes/shapedata'), 'shapedata')
context.use('/unitshapes', require('./routes/unitshapes'), 'unitshapes')
context.use('/worldclim', require('./routes/worldclim'), 'worldclim')
context.use('/worldclimmap', require('./routes/worldclimmap'), 'worldclimmap')
