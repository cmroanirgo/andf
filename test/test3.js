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


describe('Checks '+path.basename(data.source_filename)+' against '+path.basename(data.compare_filename), function() {
	it('Compares whole structure', function() {
		var obj = jsinf.parse(data.source_data, {subsection_divider: " "});

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
		var obj = jsinf.parse(data.source_data, {subsection_divider: " "}); // this is the above test
		var str = jsinf.stringify(obj);
		//console.log('stringified = \n\n\n'+str + '\n\n\n')
		var obj2 = jsinf.parse(str);
		assert.deepEqual(obj, obj2);
	})
	it('Uses alt divider string & cleanup #1', function() {
		var nameCleanCount = 0;
		var obj = jsinf.parse(data.source_data, {
			valid_comment_chars: /^\/\/.*(?:\n:$)/,
			subsection_divider: function(section_name) {
					return section_name.split(' ').map(function(name) { 
				 			return name.replace(/^\"(.*?)\"$/, '$1') }); 
				}
			, subsection_nameclean: function(name) {
				nameCleanCount++;
				return name;
			}
			});

		assert.deepEqual(obj, data.compare_obj)
		assert.equal(nameCleanCount, 18)

	})
	it('Uses alt divider RegExp & cleanup #2', function() {
		var nameCleanCount = 0;
		var obj = jsinf.parse(data.source_data, {
			subsection_divider: / /
			, subsection_nameclean: function(name) {
				nameCleanCount++;
				return name.replace( /^\"(.*?)\"$/, '$1');
			}
			});

		assert.deepEqual(obj, data.compare_obj)
		assert.equal(nameCleanCount, 18)
	})
	it('Catches use of unsafe input', function() {
		var thrownMessage = 
		assert.throws(function() {
			var obj = jsinf.parse(data.source_data, {
				subsection_divider: /window.open/
				});
		}, "Bad food in 'subsection_divider'");
	})
});

