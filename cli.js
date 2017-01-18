#!/usr/bin/env node


/**
 * @license MIT
 * Copyright (c) 2016 Craig Monro (cmroanirgo)
 * This file is the command line interface of jsinf
 *
 * There's not much to it. 
 * It takes a file (or stdin) and writes it to stdout
 * by default, IN is assumed to be jsinf, OUT is assumed json.
 **/

// normally, I'd use minify for cmdline interpolation...this library need be v.v lightweight, so:
function hasParam(name, _argv) {
	return _argv.indexOf(name)>=0;
}

function showHelp(message) {
	if (message)
		console.error(message);
	console.log(`
JSINF converts a jsinf file to JSON and outputs it in stdout

USAGE:
    jsinf in_filename|--stdin
`);
	process.exit(-1); // exit and report an error
}

(function main(_argv) {

	const readline = require('readline');
	const fs = require('fs');
	const jsinf = require('./jsinf');

	const useStdIn = hasParam('--stdin', _argv)
	var filename;
	if (!useStdIn)
	{
		if (_argv.length<1)
			showHelp();
		else
			filename = _argv[0];

	} 


	const rl = readline.createInterface({
	    input: useStdIn ? process.stdin : fs.createReadStream(filename)
	});

	var _lines = [];
	rl.on('line', function(line) {
		//console.log('Pushing: ' + line)
	  	_lines.push(line);
	});
	rl.on('close', function() {
		//convert _lines array into a string (with newlines),
		// since the jsinf decoder requires a block of text
		_lines = _lines.join('\n')+'\n';
		var _out = jsinf.decode(_lines);
		try {
			console.log(JSON.stringify(_out));
		}
		catch(e) {
			console.error(e);
			process.exit(-1);
		}
	})


})(process.argv.slice(2));