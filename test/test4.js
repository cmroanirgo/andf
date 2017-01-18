const jsinf = require('../jsinf.js');
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
var options = { 
				block_divider: "\#\#\#+", 
				default_key: "content",
				//log:true
			};


describe('Checks '+path.basename(data.source_filename)+' against '+path.basename(data.compare_filename), function() {
	it('Compares whole structure', function() {
		var obj = jsinf.parse(data.source_data, options);
		/*
		log("\n\n\nWe expect this data: ")
		logObj(data.compare_obj);
		log('\n\nWe Got:\n')
		logObj(obj);
		log('\n\n\n\n')
		*/
		
		assert.deepEqual(obj, data.compare_obj)

	})
	it('Checks stringification', function() {
		var obj = jsinf.parse(data.source_data, options); // this is the above test
		var str = jsinf.stringify(obj, {
				block_divider:"###",	
				default_key: "content",
		});
		//console.log('JSON = \n\n\n'+require('util').inspect(obj) + '\n\n\n')
		//console.log('stringified = \n\n\n'+str + '\n\n\n')
		var obj2 = jsinf.parse(str, options);
		assert.deepEqual(obj, obj2);
	})
});

