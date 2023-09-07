'use strict'

const joi = require('joi')

module.exports =
	joi.alternatives()
		.try(
			joi.object({
				geometry_hash: joi.string().regex(/^[0-9a-f]{32}$/).required(),
				distance: joi.number(),
				geometry: joi.object().required(),
				geometry_point: joi.object().required()
			}),
			joi.string().regex(/^[0-9a-f]{32}$/)
		)
