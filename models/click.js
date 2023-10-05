'use strict'

const joi = require('joi')

module.exports =
	joi.object({
		geometry_hash: joi.string().regex(/^[0-9a-f]{32}$/),
		geometry_point: joi.object(),
		geometry_bounds: joi.object(),
		properties: joi.object()
	})
