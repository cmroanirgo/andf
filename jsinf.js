/**
 * @license MIT
 * Copyright (c) 2016 Craig Monro (cmroanirgo)
 * This file is the main library for jsinf.
 * See https://github.com/cmroanirgo/jsinf for usage.
 **/

"use strict";

const _parse = require('./lib/jsinf_parse');
const _encode = require('./lib/jsinf_encode');

module.exports = {
	  decode: _parse
	, parse: _parse
	, stringify: function(str, options) {
		var data = _encode(str, options);
		if (data.errors) throw new SyntaxError(data.errors.join('\n'));
		return data.value;
	}
	, encode: _encode
}


