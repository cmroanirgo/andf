/**
 * @license MIT
 * Copyright (c) 2016 Craig Monro (cmroanirgo)
 * This file is the decoding interface of jsinf
 **/

"use strict";
const util = require('util')




// simple helper functions to remake a RegExp object based on human understandable string expression.
var isArray= Array.isArray || function(obj) { 
		return toString.call(obj) === '[object Array]'; 
	}
function trimL(str, val) {
	if (!str) return str;
	if (!isArray(val)) val = [val];
	val.forEach(function(val) {
		if (str.substr(0,val.length)==val)
			str = str.substr(val.length)
	})
	return str;
}
function trimR(str, val) {
	if (!str) return str;
	if (!isArray(val)) val = [val];
	val.forEach(function(val) {
		if (str.substr(-val.length)==val)
			str = str.substr(0, str.length-val.length)
	})
	return str;
}
function trimLR(str, val) { // not the same as trim()!!! this forces a balanced trim
	if (!str) return str;
	if (!isArray(val)) val = [val];
	val.forEach(function(val) {
		if (str.substr(0,val.length)==val && str.substr(-val.length)==val)
			str = str.substr(val.length, str.length-val.length*2)
	})
	return str;
}
function trim(str, val)
{
	return trimL(trimR(str, val), val);
}

function _rePrepSubMatch(source) { 
	// removes ^ at the start and $ and the end of a RegExp
	source = trimL(source, '^')
	source = trimR(source, '$')
	source = trim(source, ['\\s*?', '\\s*']) // remove whitespace at start & end

	// change all captures to non-captures
	source = source.replace( /\((?!\?)/g, "(?:") // thankfully we don't have to back check for escaped \( ... b/c this matches them
	return source;
}

function _reMake(re, reText, reWith) {
	// given a RegExp with a string in it:
	//  /^(some_demo)/g
	// replaces 'some_demo' (reText) with a pattern (reWith)

	// The _rePrepSubMatch() removes all match and start/end of line expressions, including whitespaces
	return new RegExp(re.source.replace(new RegExp(reText, 'g'), _rePrepSubMatch(reWith.source)), re.flags);
}
function _reMakeA(re, reTextA, reWithA) {
	if (reTextA.length!=reWithA.length) throw "reMakeA needs arrays of the same size"
	var source = re.source;
	for(var i=0; i<reTextA.length; i++) {
		source = source.replace(new RegExp(reTextA[i], 'g'), _rePrepSubMatch(reWithA[i].source));
	}
	return new RegExp(source, re.flags);
}




function _ensureSectionsExist(root, section_name, divider) {
	//console.log ('Section name = ' + section_name + " & split with: '" + divider + "'")
	var obj = root;
	if (divider && divider.length>0)
		section_name.split(divider).forEach(function(name) {
			name = trim(name, ' ');
			name = trimLR(name, ['\'','"'])
			if (!obj[name]) 
				obj[name]={}; // make the new sub object
			obj = obj[name]; // recurse
		});
	else {
		log('      is defined:' + !!obj[section_name])
		if (!obj[section_name]) 
			obj[section_name]={}; // make the new sub object
		obj = obj[section_name]; // recurse
	}
	return obj;
}

function _jsinf_decode(text, options) {
	var _root = {}, m, obj;

	// solve some easy solutions first.
	if (!text || !text['length'])
		return _root; // return an empty object for empty input


	options = options || {};

		/*
		default_key.
		 This specifies where 'default values' are placed. That is, 

		 [section]
		 Some text is here

		 Will generate this object:
		 {
			section: { content: "Some text is here" }
		 }
		 */
	if (!options['default_key']) 
		options.default_key = 'value';


		/*
		subsection_divider.
		 This specifies how we split a [section.sub section.subsub section]
		 If Empty, does not split at all, and everything is just a 'section'
		*/
	if (!options['subsection_divider']) 
		options.subsection_divider = '.';

	if (!options['block_divider'])
		options.block_divider = '\\-{3,}'; // also '\\-\\-\\-+'


	var log = options.log || function() { }
	if (log === true) log = console.log;


	// The RegExps
	var re_NATURAL_NAME = /[\w\-\.\/\#\$\\\'\"]*[\w]/ 
	var re_WHITESP      = /\s*/
	var re_SECTION_NAME = /[\w\'\"]*?[\w\-\.\/ \#\$\\\'\"]*[\w\'\"]/			// a natural-name with spaces in the middle are allowed
	var re_COMMENT      = /^[#;](.*)\r?(?:\n|$)/
	var re_SECTION      = _reMake(/^\[(section-name)\]\s*(?:\n|$)/, 'section-name', re_SECTION_NAME);
	var re_KEY          = _reMake(/^(natural-name)\s*(?=\=)/, 'natural-name', re_NATURAL_NAME);
	var re_BLOCK        = new RegExp(options.block_divider);
	var re_LINE_STARTERS= _reMakeA(/comment|key|section|block/, 
									['comment','key','section', 'block'],
									[re_COMMENT, re_KEY, re_SECTION, re_BLOCK])
	var re_CODE_VALUE   = /^\=[ \t]*\{\s*(.*)?\}\s*(?:\n|$)/;
	var re_ARRAY_VALUE   = /^\=[ \t]*\[\s*(.*)?\]\s*(?:\n|$)/;
	var re_VALUE        = _reMake(/^\=\s*(?!line-starters)([\s\S]*?)\s*\n\s*(?=line-starters|\n|\s*$)/, 'line-starters', re_LINE_STARTERS);
	var re_DEFAULT_VALUE= _reMake(/^([\s\S]*?)\s*\r?\n\s*(?=line-starters|\s*$)/, 'line-starters', re_LINE_STARTERS);
	var re_ESCAPED_BLOCK= _reMake(/^block\s*\n([\s\S]*?)\s*\n(?:block|\s*$)/, 'block', re_BLOCK);


	log("re_NATURAL_NAME   " + re_NATURAL_NAME.source )
	log("re_SECTION_NAME   " + re_SECTION_NAME.source )
	log("re_COMMENT        " + re_COMMENT.source      )
	log("re_SECTION        " + re_SECTION.source      )
	log("re_KEY            " + re_KEY.source          )
	log("re_BLOCK          " + re_BLOCK.source        )
	log("re_LINE_STARTERS  " + re_LINE_STARTERS.source)
	log("re_CODE_VALUE     " + re_CODE_VALUE.source   )
	log("re_VALUE          " + re_VALUE.source        )
	log("re_DEFAULT_VALUE  " + re_DEFAULT_VALUE.source)
	log("re_ESCAPED_BLOCK  " + re_ESCAPED_BLOCK.source)


	obj = _root; // push the object/section we're working on. This defaults to the global section.
	var lastKey;

	do {
		text = text.replace(re_WHITESP, ''); // eat whitespace

		//log("\ntext is: " + text.substr(0, 100) + '...\n================================')

		if (m = re_SECTION.exec(text)) {
			/*
			[section.subsection]
			*/
			log("\n\n\nSection begin ["+m[1]+"]")
			obj = _ensureSectionsExist(_root, m[1], options.subsection_divider);
		} else if (m = re_ESCAPED_BLOCK.exec(text)) {
			/*
			---
			Some text is 
			here
			---
			*/
			lastKey = options.default_key;
			log("\t"+lastKey+" (as block) = " + m[1].substr(0, 100)+'...')
			obj[lastKey] = m[1];

		} else if (m = re_KEY.exec(text)) { // we have a definite 'key =' thing going
			/*
			key = {some code}
			key = [some,array]
			key = some
			value
			key = 
			*/
			lastKey = m[1];
			text = text.slice(m[0].length); // skip past what we've just matched

			if (m = re_CODE_VALUE.exec(text)) { // = { some javascript; }
				obj[lastKey] = eval(m[1]); // TODO. Fix security here
			} else if (m = re_ARRAY_VALUE.exec(text)) { // = [some,values,'in',an,array,i have spaces]
				obj[lastKey] = eval(m[1]); // TODO. Fix security here
			} else if (m = re_VALUE.exec(text)) {
				obj[lastKey] = trim(m[1], [' ', '\r', '\n', '\t']);
			} else {
				log("Unexpected! re_VALUE should ALWAYS capture empty 'key ='")
				obj[lastKey] = null;
			}
			log("\t" + lastKey + " = '" + obj[lastKey] + "'")
		}
		else if (m = re_COMMENT.exec(text)) {
			/*
			# a comment
			; a comment
			*/
			// just eat comments
			//log("match #comment: " + m[1].substr(0, 100)+'...')
		}
		else if (m = re_DEFAULT_VALUE.exec(text)) {
			/*

			Some text without a particular home
			and it goes

			on for some time
			*/
			lastKey = options.default_key;
			log("\t"+ lastKey + " (as default) = " + m[1].substr(0, 100)+'...')
			obj[lastKey] = m[1];
		} else {
			log("Unknown text: " + text.substr(0, 100)+'...')
			text = ''; // force us to break out.
		}

		if (m)
			text = text.slice(m[0].length); // skip past what we've just matched
	} while(text.length>0);

	return _root;
}

module.exports = _jsinf_decode;

