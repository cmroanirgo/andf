const jsinf = require('../jsinf.js').decode;
const util = require('util');
const path = require('path');

var log = console.log;
function logObj(obj) {	console.log(util.inspect(obj, {colors:true})+'\n'); }

var data = loadTestFiles(__filename);
/* data is:
{
	source_filename: '/some/path/testN.txt',
	compare_filename: '/some/path/testNobj.txt',
	source_data: 'contents of /some/path/testN.txt'
	compare_obj: { some_obj: {} }
}
*/


describe('Checks '+path.basename(data.source_filename)+' against '+path.basename(data.compare_filename), function() {
	it('Compares whole structure', function() {
		var obj = jsinf(data.source_data, {subsection_divider: " "});

		/*
		log("\n\n\nWe expect this data: ")
		logObj(data.compare_obj);
		log('\n\nWe Got:\n')
		logObj(obj);
		log('\n\n\n\n')
		*/
		
		assert.deepEqual(obj, data.compare_obj)

	})
});

