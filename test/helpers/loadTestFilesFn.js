

function loadTestFiles(_filename) {
	const fs = require('fs')
	const path = require('path')

	// Load 2 files:
	//		test2.txt contains the source test
	//		test2obj.txt contains what we expect it to be parsed to
	var basename_no_ext = path.basename(_filename, path.extname(_filename));
	var filename_no_ext = path.join(path.dirname(_filename), basename_no_ext);
	var source_filename = filename_no_ext + '.txt';
	var source_compare  = filename_no_ext + 'obj.txt';
	var source_jsinf    = filename_no_ext + 'str.txt';

	var source_file = fs.readFileSync(source_filename, 'utf8');
	var compare_obj = eval("("+fs.readFileSync(source_compare, 'utf8')+")");//JSON.parse(fs.readFileSync(source_compare, 'utf8'));
	var stringified = '';
	try {
		stringified = fs.readFileSync(source_jsinf, 'utf8');
	}
	catch (e)
	{}

	return {
		source_filename: source_filename,
		compare_filename: source_compare,
		stringified_filename: source_jsinf,
		source_data: source_file,
		compare_obj: compare_obj,
		stringified: stringified
	}
}

global.loadTestFiles = loadTestFiles;

