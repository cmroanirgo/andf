# jsinf

This comprises the reference decoder for jsinf format.


[![npm Package](https://img.shields.io/npm/v/jsinf.svg)](https://www.npmjs.org/package/jsinf)
[![build status](https://secure.travis-ci.org/cmroanirgo/jsinf.svg)](http://travis-ci.org/cmroanirgo/jsinf)


Are you looking for something _other_ than YAML or JSON for your configuration files? Perhaps JSINF is an answer. If you know the standard .INI files of windows, then this copes with those... but it also does a lot more:

* Returns the config as a standard Javascript object, that you can easily convert to JSON if you wish.
* Supports nested objects (unlike a standard .INI file). eg, can read .gitignore.
* Supports values that extend over multiple lines!
* Supports 'default' blocks. That is, you don't even need to start with `some_property = `!!!

Note: Currently the api only decodes. It will eventually be able to write config as well.

## A Quick Look at the Format

```
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

#this is not a comment. It stays in  
#with this text block unmolested.
---
```




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


var inf_data = jfinf.decode(inf_file);
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
var inf_data = jsinf.decode(inf_file, { subsection_divider: '#'}); 
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
var inf_data = jsinf.decode(inf_file, { default_key: 'text'}); 
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

* There can only be one block per section. If multiple are detected, the last one is used.

You can change the separator sequence with:

```
// Change the divider to 5 (or more) consecutive asterisks.
var inf_data = jsinf.decode(inf_file, { block_divider: '\\*{5,}'}); 
```





