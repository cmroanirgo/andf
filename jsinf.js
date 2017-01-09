
"use strict";
const util = require('util')




// simple helper functions to remake a RegExp object based on human understandable string expression.
function trimL(str, val) {
	if (str.substr(0,val.length)==val)
		return str.substr(val.length)
	return str;
}
function trimR(str, val) {
	if (str.substr(-val.length)==val)
		return str.substr(0, str.length-val.length)
	return str;
}
function trim(str, val)
{
	return trimL(trimR(str, val), val);
}

function reRmStart(source) { // removes ^ at the start and $ and the end
	source = trimL(source, '^')
	source = trimR(source, '$')
	source = trim(source, '\\s*?') // remove whitespace at start & end
	source = trim(source, '\\s*')
	return source;
}
function _reMake(re, reText, reWith) {
	return new RegExp(re.source.replace(reText, reRmStart(reWith.source)), re.flags);
}
function _reMakeA(re, reTextA, reWithA) {
	if (reTextA.length!=reWithA.length) throw "reMakeA needs arrays of the same size"
	var source = re.source;
	for(var i=0; i<reTextA.length; i++) {
		source = source.replace(reTextA[i], reRmStart(reWithA[i].source));
	}
	return new RegExp(source, re.flags);
}




function _ensureSectionsExist(root, section_name, divider) {
	var obj = root;
	if (divider && divider.length>0)
		section_name.split(divider).forEach(function(name) {
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

function _jsinf(text, options) {
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


	var log = options.log || function() { }
	if (log === true) log = console.log;


	// TODO. allow changing block start/end sequence (currently ---)

	// The RegExps
	var re_NATURAL_NAME = /[\w\-\.\/\#\$\\]*[\w]/ 
	var re_WHITESP      = /[\s\r\n]*/
	var re_SECTION_NAME = /[\w]*?[\w\-\.\/ \#\$\\]*[\w]/			// a natural-name with spaces in the middle are allowed
	var re_COMMENT      = /^[#;](.*)\r?\n?/
	var re_SECTION      = _reMake(/^\[(section-name)\]\s*\r?\n?/, 'section-name', re_SECTION_NAME);
	var re_KEY          = _reMake(/^(natural-name)\s*(?=\=)/, 'natural-name', re_NATURAL_NAME);
	var re_LINE_STARTERS= _reMakeA(/comment|key|section|\-{3,}/, 
									['comment','key','section'],
									[re_COMMENT, re_KEY, re_SECTION])
	var re_CODE_VALUE   = /^\=\s*\{\s*(.*)?\}\s*\r?\n?/;
	var re_ARRAY_VALUE   = /^\=\s*\[\s*(.*)?\]\s*\r?\n?/;
	var re_VALUE        = _reMake(/^\=\s*(\b[\s\S]*?)\s*\r?\n\s*(?=line-starters|\r?\n|[\s\r\n]*$)/, 'line-starters', re_LINE_STARTERS);
	var re_DEFAULT_VALUE= _reMake(/^([\s\S]*?)\s*\r?\n\s*(?=line-starters|[\s\r\n]*$)/, 'line-starters', re_LINE_STARTERS);
	var re_ESCAPED_BLOCK= /^\-{3,}\s*\r?\n([\s\S]*?)\s*\r?\n(?:\-{3,}|[\s\r\n]*$)/


	log("re_NATURAL_NAME   " + re_NATURAL_NAME.source )
	log("re_SECTION_NAME   " + re_SECTION_NAME.source )
	log("re_COMMENT        " + re_COMMENT.source      )
	log("re_SECTION        " + re_SECTION.source      )
	log("re_KEY            " + re_KEY.source          )
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
				obj[lastKey] = trim(trim(trim(trim(m[1], ' '), '\r'), '\n'), '\t');
			} else {
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





module.exports = _jsinf;

