

function loadTestFiles(_filename) {
	const fs = require('fs')
	const path = require('path')

	var evil_eval = function(str) {  eval("(function(){return " + str + ";})()") };

	// Load 2 files:
	//		test2.txt contains the source test
	//		test2obj.txt contains what we expect it to be parsed to
	var basename_no_ext = path.basename(_filename, path.extname(_filename));
	var filename_no_ext = path.join(path.dirname(_filename), basename_no_ext);
	var source_filename = filename_no_ext + '.txt';
	var source_compare  = filename_no_ext + 'obj.txt';

	var source_file = fs.readFileSync(source_filename, 'utf8');
	//var compare_obj = evil_eval(fs.readFileSync(source_compare, 'utf8'));
	var compare_obj = JSON.parse(fs.readFileSync(source_compare, 'utf8'));

	return {
		source_filename: source_filename,
		compare_filename: source_compare,
		source_data: source_file,
		compare_obj: compare_obj
	}
}

global.loadTestFiles = loadTestFiles;

