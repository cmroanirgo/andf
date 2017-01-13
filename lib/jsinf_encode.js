/**
 * @license MIT
 * Copyright (c) 2016 Craig Monro (cmroanirgo)
 * This file is the encoding/stringifying interface of jsinf
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
function isBool(x) { return typeof x == 'boolean'; }
function isObject(x) { return x !== null && typeof x === 'object'}

function lineCount(str) { return str.split('\n').length; }

function _err(message, errors, key, stack) {
	errors.push(message + " with '"+key+"' in ["+stack.join('.')+"]");
	return null;
}

function _coerceToString(key, value, stack, options, errors) {
	if (isArray(value)) {
		return '['+value.join(', ')+']'; // TODO add comma escaping
	} 
	else if (isObject(value)) {
		// need to start a new section
		stack.push(key);
		var str = '['  + stack.join(options.subsection_divider) + ']\n';
		options.log('Walking : ' +key )
		var substr = _walk(value, stack, options, errors);
		stack.pop();
		if (substr!=null) {
			if (!isEmptyString(substr) && substr[0]=='[')
				return substr ; // substr started a new section...but we added nothing
			else
				return str + substr ;
		}
		return null;
	}
	else
		return value.toString();
}

function _walk(obj, stack, options, errors) {
	// recurse thru all objects in obj
	var lines = []; // not really, \n can be in here too
	var block = null; // comes after lines, but before section
	var sections = []; // these are added after the lines for this section are processed
	var keys = Object.keys(obj);
	for (var i=0; i<keys.length; i++) {
		var key = keys[i];
		var value = obj[key];
		var keyStr = key + ' = ';
		var valueStr = '';

		if (isDefined(value) && value!==null) {
			valueStr = _coerceToString(key, value, stack, options, errors);
			if (isArray(value)) {
				lines.push(keyStr + valueStr);
			}
			else if (isObject(value)) {
				sections.push(valueStr);
			}
			else
			{
				var nlines = lineCount(valueStr);

				if (nlines> 1 && key == options.default_key) {
					// we have options open to us
					var useBlock = true; // TODO. Actually do RegExps on text to see if it's safe to 'block' or not

					if (useBlock) 
						block = options.block_divider + '\n' + valueStr + '\n' + options.block_divider ;
					else
						block = valueStr;
				} else {
					lines.push(keyStr + valueStr);
					if (nlines>1) // then make sure we add extra space below to make sure the next key is picked up
						lines.push('');
				}
			}
		}
		else
			// an empty line
			lines.push(keyStr)
	}

	return (lines.length ? lines.join('\n')+'\n':'')  + (!block? '' : block + '\n') + (sections.length ? sections.join('\n') + '\n' : '');
}


function _jsinf_encode(obj, options) {

	// solve some easy solutions first.
	if (!obj)
		return ''; // return an empty object for empty input

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
	// TODO. Allow a callback function 'subsection_encoder'	

	if (!options['block_divider'])
		options.block_divider = '---'; 
	// TODO. Understand RegExp string...?

	// 'code blocks' are either strings OR objects and will be processed as such
	//if (!isDefined(options['allow_code']))
	//	options.allow_code = true;

	// arrays are always arrays
	//if (!isDefined(options['allow_arrays']))
	//	options.allow_arrays = true;	

	var log = options.log || function() { }
	if (log === true) log = console.log;
	options.log = log;

	var errors = [];
	var str = _walk(obj, [], options, errors);
	return {
		value: str
		, errors: errors.length?errors:null };

}

 module.exports = _jsinf_encode;
