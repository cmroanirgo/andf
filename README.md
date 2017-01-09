# jsinf

This comprises the reference decoder for jsinf format.


[![npm Package](https://img.shields.io/npm/v/jsinf.svg)](https://www.npmjs.org/package/jsinf)
[![build status](https://secure.travis-ci.org/cmroanirgo/jsinf.svg)](http://travis-ci.org/cmroanirgo/jsinf)


## Installation

Easiest is with npm, in an existing npm project:

```
npm install jsinf --save
```

## Usage

```
const jsinf = require('jsinf');

...

var inf_file = `
[section]
value1 = a value
value2 = another value

[another section]
# a comment!
value2 = some 3rd value
`;


var inf_data = jfinf(inf_file);
console.log(inf_data.section.value1); // prints 'a value';
```



## The Format 

The format is extremely forgiving and designed for non-technical people.

### Nested Objects

```
[section.sub section]
name=John D. Smith
```

becomes the equivalent JSON:

```
{
	"section" : {
		"sub section" : {
			"name": "John D. Smith"
		}
	}
}
```

The default seperator is a dot '.', however you can change it easily:

```
// use # as a sub section divider.
var inf_data = jsinf(inf_file, { subsection_divider: '#'}); 
```

*Note:*

* Valid chars for subsections are any word or number, and '-' , '.', '/', '#', '$' and '\\'


### Multi-line support

```
[section]
address=32 Fallows Way
Timbuctoo
Somewhere in Africa
```

Note that blank lines are not allowed. You may wish to consider 'Default Value' and 'Block Default Value' options instead. 


### Default Values

```
[section]
I am some
text that 
runs over several
lines!

And can have single blank lines in it.
```

becomes:
```
{
	"section": {
		"value": "I am some\ntext that..."
	}
}
```


### Block Default Value ###

If you have strong requirements for a large block with lots of 'noise' in it, then you may wish to consider a block:
```
[section]
name=John D. Smith
---
I am a block

that runs until --- is found on it's own line

[this is not a section]
# this is not a comment
---
```

*Note:*

You can change the property name that is used:

```
// use 'text' as the default.
var inf_data = jsinf(inf_file, { default_key: 'text'}); 
console.log(inf_data.section.text); // prints 'I am a block\n\n...'
```


The data would look like:

```
{
	"section": {
		"name" : "John D. Smith"
		"text": "I am a block\n\n..."
	}
}
```

*Note:*

* The characters sequence used will be configurable in v0.1.2 and later.
* There can only be one block per section. If multiple are detected, the last one is used.




