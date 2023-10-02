'use strict'

const joi = require('joi')

module.exports =
	joi.object({
		count: joi.number(),
		geometry_hash: joi.string().regex(/^[0-9a-f]{32}$/),
		distance: joi.number(),
		geometry_point: joi.object(),
		geometry_bounds: joi.object(),
		properties: joi.object().required()
	})
