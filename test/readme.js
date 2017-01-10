const jsinf = require('../jsinf.js').decode;

describe('Checks the examples in the readme for consistency', function() {
	it('Key/Value pair at root level', function() {
		var obj = jsinf(`
			root-level-key = root level value
			`);
		
		assert.deepEqual(obj, {'root-level-key':'root level value'})
	})


	it('Quick look example', function() {
		var obj = jsinf(`
default_property = default value

[section1]
key1 = value1
key2 = value2

[section2]
# this is a comment.
key1 = value3

[section2.nested]
#A comment for a nested object
nested_key = A
value that
runs over many lines,
but can't have a blank line.

---
A block of text that gets assigned
to the property called 'value'

You can put pretty much anything in
here. You don't need the final --- if the 
end of the file is reached.

#this is not a comment. It stays in the 
#with this text block unmolested.
---
		`);
		
		assert.deepEqual(obj, {
		default_property: 'default value'

	    , section1: {
	        key1 : "value1"
	        ,key2: "value2"
	    }
	    , section2: {
	    	key1: "value3"
	    	, nested: {
	    		nested_key: `A
value that
runs over many lines,
but can't have a blank line.`
			, value: `A block of text that gets assigned
to the property called 'value'

You can put pretty much anything in
here. You don't need the final --- if the 
end of the file is reached.

#this is not a comment. It stays in the 
#with this text block unmolested.`
	    	}
	    }
		})
	})


	it('Example 1', function() {
		var obj = jsinf(`
			[section]
			value1 = a value
			value2 = another value

			[another section]
			# a comment!
			value2 = some 3rd value
		`);
		
		assert.deepEqual(obj, {
			section: {
				value1: 'a value'
				, value2: 'another value'
			},
			'another section': {
				value2: 'some 3rd value'
			}
		})
	})
	it('Example 2 - Sub Sections', function() {
		var obj = jsinf(`
			[section.sub section]
			name=John D. Smith
		`);
		
		assert.deepEqual(obj, {
			section: {
				'sub section':{
					name:'John D. Smith'
				} 
			}
		})
	})

	it('Example 3 - Multiline', function() {
		var obj = jsinf(`
[section]
address=32 Fallows Way
Timbuctoo
Somewhere in Africa
		`);
		
		assert.deepEqual(obj, {
			section: {
				address:`32 Fallows Way
Timbuctoo
Somewhere in Africa`
			}
		})
	})

	it('Example 4 - Default Values', function() {
		var obj = jsinf(`
[section]
I am some
text that 
runs over several
lines!
 
And can have single blank lines in it.
		`);
		
		assert.deepEqual(obj, {
			section: {
				value:`I am some
text that 
runs over several
lines!
 
And can have single blank lines in it.`
			}
		})
	})	

	it('Example 5a - Block Default Value', function() {
		var obj = jsinf(`
			[section]
name=John D. Smith
---
I am a block
 
that runs until --- is found on it's own line
 
[this is not a section]
# this is not a comment
---
		`);
		
		assert.deepEqual(obj, {
	    "section": {
	        "name" : "John D. Smith"
	        , value: `I am a block
 
that runs until --- is found on it's own line
 
[this is not a section]
# this is not a comment`
	    }
		})
	})


	it('Example 5b - Block Default Value', function() {
		var obj = jsinf(`
			[section]
name=John D. Smith
---
I am a block
 
that runs until --- is found on it's own line
 
[this is not a section]
# this is not a comment
---
		`, {default_key:'text'});
		
		assert.deepEqual(obj, {
	    "section": {
	        "name" : "John D. Smith"
	        , text: `I am a block
 
that runs until --- is found on it's own line
 
[this is not a section]
# this is not a comment`
	    }
		})
	})

	it('Example 5c - Block Default Value', function() {
		var obj = jsinf(`
			[section]
name=John D. Smith
*****
I am a block
 
that runs until --- is found on it's own line
 
[this is not a section]
# this is not a comment
*****
		`, {default_key:'text',block_divider:'\\*{5,}'});
		
		assert.deepEqual(obj, {
	    "section": {
	        "name" : "John D. Smith"
	        , text: `I am a block
 
that runs until --- is found on it's own line
 
[this is not a section]
# this is not a comment`
	    }
		})
	})

});


