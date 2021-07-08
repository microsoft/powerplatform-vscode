# Everytime you change the Grammar file please generate the Parser file.
# To generate the parser just execute "npm run build-grammar"

# token is generated while parsing the input. In the nearleyjs documentation this is referred by d or data
# output is the value generated at each level. In the nearleyjs documentation this is referred by v or value

# For the input:
# {% entityform id:'', name:"xyz",  key:"34234" %}
# The output of the parser is generated in the following format:

# token: Array
#	tag: "entityform"
#	map: Object
#     18: "id"
#     27: "name"
#     39: "key"

# How to access the ouptut:-
# parser.results[0]?.tag
# parser.results[0]?.map

@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage`
@builtin "string.ne"     # "strings"
LiquidExpression -> _ "{%" __ TAG_DEFINITION "%}" _ {% function(token) {return { token:token, tag: token[3].tag, map: token[3].map }} %}

TAG_DEFINITION -> TAG __ ATTRIBUTE_MAP {% extractTagDefinition %}

TAG -> PORTAL_TAG {% function(token) {return { tag: token[0].tag }} %}
		| "include" __ PORTAL_TAG {% function(token) {return { tag: token[2].tag }} %}
		| "editable" __ PORTAL_TAG _ EDITABLE_TAG_VALUE {% function(token) {return { tag: token[2].tag, liquidTag: 'editable', editable_tag_value_location: token[4].location }} %}

EDITABLE_TAG_VALUE -> sqstring {% function(token, loc) {return { value: token[0], location: loc}} %}
		| dqstring {% function(token, loc) {return { value: token[0], location: loc }} %}

PORTAL_TAG -> "entityform"  {% function(token) {return { tag: token[0] }} %}
		| "webform"  {% function(token) {return { tag: token[0]}} %}
		| "entityview" {% function(token) {return { tag: token[0]}} %}
		| "'entity_list'" {% function(token) {return { tag: "entity_list" }} %}
		| "snippets" {% function(token) {return { tag: token[0]}} %}

ATTRIBUTE_MAP -> (PAIR _):*  {% extractObjectFromSpaceSeparatedPairs %}
	            | PAIR _ "," (_ PAIR _ ","):* _ PAIR __ {% extractObjectFromCommaSeparatedPairs %}
PAIR -> KEY _ ":" _ VALUE {% function(token) { return [token[0], token[4]]; } %}
KEY -> ("id" | "name" | "key" | "type" | "liquid") {% id %}
VALUE -> sqstring {% function(token, loc) {return { value: token[0], location: loc}} %}
		| dqstring {% function(token, loc) {return { value: token[0], location: loc }} %}
		| BOOLEAN {% function(token, loc) {return { value: token[0], location: loc }} %}
BOOLEAN -> "true" {% id %}
			| "false" {% id %}

@{%

function extractPair(kv, output) {
    if(kv[0]) { output[kv[1].location + 1] = kv[0][0]; } // kv[0] is key and kv[1] is value
}

function extractObjectFromSpaceSeparatedPairs(d) {
    let output = {};
    for (let i in d[0]) {  // d[0] matches with (PAIR _):+
        extractPair(d[0][i][0], output); // d[0][i] represents ith PAIR _ and d[0][i][0] represents ith PAIR
    }
    return output;
}

function extractObjectFromCommaSeparatedPairs(d) {
    let output = {};
	extractPair(d[0], output) // used to extract value from the first PAIR
    for (let i in d[3]) { // d[3] matches with (_ PAIR _ ","):*
        extractPair(d[3][i][1], output); // d[3][i] represents ith _ PAIR _ "," and d[3][i][1] represents ith PAIR
    }
	extractPair(d[5], output) // used to extract value from the last PAIR
    return output;
}

function extractTagDefinition(d) {
	let output = {};
	if(d[0].liquidTag && d[0].liquidTag === 'editable') {
		const map = d[2];
		map[d[0].editable_tag_value_location + 1] = 'editable_tag_value'; // we do +1 to get the location of the first index inside '' or ""
        output['tag'] = d[0].tag;
		output['map'] = map;
	} else {
		output['tag'] = d[0].tag;
		output['map'] = d[2];
	}
	return output;
}

%}
