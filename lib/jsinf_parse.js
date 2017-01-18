/**
 * @license MIT
 * Copyright (c) 2016 Craig Monro (cmroanirgo)
 * This file is the decoding/parsing interface of jsinf
 **/

"use strict";




// simple helper functions
function _objIsType(obj, typeStr) { return Object.prototype.toString.call(obj) === '[object '+typeStr+']'}
function isArray(obj) { return _objIsType(obj, 'Array');  }
function isRegExp(obj) { return _objIsType(obj, 'RegExp');  }
function isFunction(obj) { return typeof obj === 'function' };
function isString(str) { return typeof str === 'string'; }
function isEmptyString(str) { return !str || str.length==0; }
function isDefined(x) { return x !== undefined; }


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
function trimLR(str, _val) { // not the same as trim()!!! this forces a balanced trim
	if (!str) return str;
	if (!isArray(_val)) _val = [_val];
	_val.forEach(function(val) {
		if (str.substr(0,val.length)===val && str.substr(-val.length)===val)
			str = str.substr(val.length, str.length-val.length*2)
	})
	return str;
}
function trim(str, val)
{
	return trimL(trimR(str, val), val);
}

function _rePrepSubMatch(re) { 
	// given a RegExp, removes ^, $ and any whitespace directives at the ends 
	//		and finally converts all captures (...) to non capture (?:...)
	// Why? This is so that this re can be used as a sub-match in another RegExp.

	var source = re.source;
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
	return new RegExp(re.source.replace(new RegExp(reText, 'g'), _rePrepSubMatch(reWith)), re.flags);
}
function _reMakeA(re, reTextA, reWithA) {
	if (reTextA.length!=reWithA.length) throw "reMakeA needs arrays of the same size"
	var source = re.source;
	for(var i=0; i<reTextA.length; i++) {
		source = source.replace(new RegExp(reTextA[i], 'g'), _rePrepSubMatch(reWithA[i]));
	}
	return new RegExp(source, re.flags);
}




function _ensureSectionsExist(root, section_name, options) {
	// TODO: add a callback so that OP can determine how 'section_name' becomes an array.
	// TODO: add another callback so that OP can 'clean up' individual names

	//console.log ('Section name = ' + section_name + " & split with: '" + divider + "'")
	var obj = root;
	var divider = options.subsection_divider;
	var cleanup = options.subsection_nameclean;
	divider(section_name).forEach(function(name) {
		name = cleanup(name);
		if (!obj[name]) 
			obj[name]={}; // make the new sub object
		obj = obj[name]; // recurse
	});
	return obj;
}

function _evalOK(str) { // given a RegExp or a string, make sure the latter is 'safe'
	if (isFunction(str)) return true;
	if (isRegExp(str)) return _evalOK(str.source);
	return /(?:function|eval|window|new |alert)/i.test(str)===false;
}
function _charsToRegExpStr(str) {
	return '\\'+str.split('').join('\\');
}


function _jsinf_parse(text, options) {
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
			section: { custom_value: "Some text is here" }
		 }
		 */
	if (!options['default_key']) 
		options.default_key = 'value';


		/*
		subsection_divider.
		 This specifies how we split a [section.sub section.subsub section]
		 If Empty, does not split at all, and everything is just a 'section'

		 .eg for a .gitconfig styled: [diff "difftool"]  
		 section_splitter = function(section) { 
		 		return section.split(' ').map(function(name) { 
		 			return name.replace(/^\"(.*?)\"$/, '$1') }); 
		 	}
		*/
	if (!options['subsection_divider']) 
		options.subsection_divider = '.';

	if (!isFunction(options.subsection_divider)) {
		if (!_evalOK(options.subsection_divider)) throw new SyntaxError("Bad food in 'subsection_divider'");
		if (isEmptyString(options.subsection_divider))
			options.subsection_divider = function(section) { return [section]; }
		else {
			var strSplit = isRegExp(options.subsection_divider) 
				? '/' + options.subsection_divider.source + '/g' 
				: '"'+options.subsection_divider+'"';

			options.subsection_divider = new Function('section', 'return section.split(' + strSplit +');');
		}
	}

		/*
		subsection_nameclean. a function
		 This allows the 'clean up' of a sub-section name.
		 By default the string is trimmed of whitespace and (matching) surrounding quotes
		*/
	if (!options['subsection_nameclean'])
		options.subsection_nameclean = function(name) { 
				name = trim(name, ' ');
				return trimLR(name, ['\'','"'])
			}

		/*
		key, comment & section_name charsets
		 allows (some) control of what is ok and what is not
		 if a RegExp is defined, then full control is given (Unless careful, problems will ensue)
		*/
	if (!options['valid_key_chars'])
		options['valid_key_chars'] = "-./\\#$'\"";
	if (!isRegExp(options.valid_key_chars))
		// default === /[\w\-\.\/\#\$\\\'\"]*[\w]/ 
		options.valid_key_chars = new RegExp("[\\w" + _charsToRegExpStr(options.valid_key_chars) + "]*[\\w]" )
	if (!options['valid_section_chars'])
		options['valid_section_chars'] = " -./\\#$'\""; // <== has a 'space' in there
	if (!isRegExp(options.valid_section_chars))
		// default === /[\w\'\"]*?[\w\-\.\/ \#\$\\\'\"]*[\w\'\"]/
		options.valid_section_chars = new RegExp("[\\w\\'\\\"" + _charsToRegExpStr(options.valid_section_chars) + "]*[\\w\\'\\\"]" )
	if (!options['valid_comment_chars'])
		options['valid_comment_chars'] = "#;";
	if (!isRegExp(options.valid_comment_chars))
		// default === /^[#;](.*)\r?(?:\n|$)/ 
		options.valid_comment_chars = new RegExp("^[" + _charsToRegExpStr(options.valid_comment_chars) + "](.*)\\r?(?:\\n|$)" )

		/*
		block_divider
		 Specifies a regexp or string of the start of the escaped block
		*/
	if (!options['block_divider'])
		options.block_divider = '\\-{3,}'; // also '\\-\\-\\-+'
	if (!isRegExp(options.block_divider))
		options.block_divider = new RegExp(options.block_divider);

	if (!isDefined(options['allow_code']))
		options.allow_code = true;
	if (!isDefined(options['allow_arrays']))
		options.allow_arrays = true;


	var log = options.log || function() { }
	if (log === true) log = console.log;


	// The RegExps
	var re_NATURAL_NAME = options.valid_key_chars; //  ===  /[\w\-\.\/\#\$\\\'\"]*[\w]/ 
	var re_WHITESP      = /\s*/
	var re_SECTION_NAME = options.valid_section_chars; //  ===  /[\w\'\"]*?[\w\-\.\/ \#\$\\\'\"]*[\w\'\"]/	 // spaces in the middle are allowed
	var re_COMMENT      = options.valid_comment_chars; //  ===  /^[#;](.*)\r?(?:\n|$)/
	var re_SECTION      = _reMake(/^\[(section-name)\]\s*(?:\n|$)/, 'section-name', re_SECTION_NAME);
	var re_KEY          = _reMake(/^(natural-name)\s*(?=\=)/, 'natural-name', re_NATURAL_NAME);
	var re_BLOCK        = options.block_divider;
	var re_LINE_STARTERS= _reMakeA(/comment|key|section|block/, 
									['comment','key','section', 'block'],
									[re_COMMENT, re_KEY, re_SECTION, re_BLOCK])
	var re_CODE_VALUE   = /^\=[ \t]*\{\s*(.*)?\}\s*(?:\n|$)/;
	var re_ARRAY_VALUE   = /^\=[ \t]*\[\s*(.*)?\]\s*(?:\n|$)/;
	var re_VALUE        = _reMake(/^\=\s*(?!line-starters)([\s\S]*?)\s*\n\s*(?=line-starters|\n|\s*$)/, 'line-starters', re_LINE_STARTERS);
	var re_DEFAULT_VALUE= _reMake(/^([\s\S]*?)\s*\r?\n\s*(?=line-starters|\s*$)/, 'line-starters', re_LINE_STARTERS);
	var re_ESCAPED_BLOCK= _reMake(/^block\s*\n([\s\S]*?)(?:\s*\nblock|\s*\n?$)/, 'block', re_BLOCK);


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

		log("\ntext is: " + text.replace(/\n/g, '\\n').substr(0, 100) + '...')

		if (m = re_SECTION.exec(text)) {
			/*
			[section.subsection]
			*/
			log("\n\n\nSection begin ["+m[1]+"]")
			obj = _ensureSectionsExist(_root, m[1], options);
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

			if (options.allow_code && (m = re_CODE_VALUE.exec(text))) { // = { some javascript; }
				obj[lastKey] = eval(m[1]); // TODO. Fix security here
			} else if (options.allow_arrays && (m = re_ARRAY_VALUE.exec(text))) { // = [some,values,'in',an,array,i have spaces]
				// TODO add comma escaping
				obj[lastKey] = 
					trim(m[1], [' ', '\r', '\n', '\t'])
					.split(',').map(function(item) { return item.replace(/^\s*(.*?)\s*$/,'$1')});
			} else if (m = re_VALUE.exec(text)) {
				obj[lastKey] = trim(m[1], [' ', '\r', '\n', '\t'])
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

module.exports = _jsinf_parse;

