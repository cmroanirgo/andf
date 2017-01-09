
var jsinf = require('../jsinf.js');
const util = require('util');

describe('Checks a single file', function() {
	it('Checks file1 default actions', function() {
		var obj = jsinf(file1);

		/*
		console.log('\n\n\n\nWe Expect:\n')
		console.log(util.inspect(file1obj, {colors:true}))
		console.log('\n\n\n\nWe Got:\n')
		console.log(util.inspect(obj, {colors:true}))
		console.log('\n\n\n\n')
		*/

		assert.equal(obj.title, file1obj.title, 'Title is ' + file1obj.title)
		assert.equal(obj.uri, file1obj.uri, 'Uri is ' + file1obj.uri)
		assert.deepEqual(obj, file1obj, 'deeply equal')

	})
});



var file1 = `title = Welcome to my homepage                         
uri = index.html                                       
date={   (new Date()).toString + " OK"; }              
metakeys = Some keys,other keys                        
metadesc =                                             
I like writing blogs and learning                      
about myself. Trailing spaces are                      
eaten                                                  

[section1]                                                              
content = This is the content for some magical 'section 1' that exists. 
It keeps going until another '[section]' is found (on it's own line),   
or a 'key=' is met. Having a newline above [section] is optional.       
extracss = green                                                        

#This is a comment. It needs to start with a "#" or                     
; a ";"                                                                 

section2.content = Another sections, using 'dot' notation.              
These are also valid: [section.sub.subsub], section.sub.subsub.key =    

[main content]                                                          
extracss = orange                                                       

Each section can also have it's own text. It must have a blank line     
above it, OR be directly beneath a [section] mark                       
And keeps on going until a valid [section], #comment, [section] or key= is reached.

[footer content]
-------------                                        
#This is footer content. This is NOT a comment
;This is NOT a comment
not-a-key = NOT a value

All of this text is a 'default-value-block' (for footer.content). It is OK
to forget the 3 dashes below, if the end of the file is reached.
---

[final.footer]
some.key =                                           
---                                                  
This is the last block of text. 
This is valid.
`;






var file1obj = { 
	title: 'Welcome to my homepage'
	, uri: 'index.html'
	, date: (new Date()).toString + " OK"
	, metakeys: 'Some keys,other keys'
	, metadesc: `I like writing blogs and learning                      
about myself. Trailing spaces are                      
eaten`

	, section1: {
		content: `This is the content for some magical 'section 1' that exists. 
It keeps going until another '[section]' is found (on it's own line),   
or a 'key=' is met. Having a newline above [section] is optional.`
		, extracss: 'green'
		, 'section2.content': `Another sections, using 'dot' notation.              
These are also valid: [section.sub.subsub], section.sub.subsub.key =`

	}

	, 'main content': {
		extracss: 'orange'
		, value: `Each section can also have it's own text. It must have a blank line     
above it, OR be directly beneath a [section] mark                       
And keeps on going until a valid [section], #comment, [section] or key= is reached.`

	}

	, 'footer content': {
		value:`#This is footer content. This is NOT a comment
;This is NOT a comment
not-a-key = NOT a value

All of this text is a 'default-value-block' (for footer.content). It is OK
to forget the 3 dashes below, if the end of the file is reached.`
	}

	, final: {
		footer: {
			'some.key': null
			, value: `This is the last block of text. 
This is valid.`

		}
	}
}
