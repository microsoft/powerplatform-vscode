# Everytime you change the Grammar file please generate the Parser file.
# To generate the parser just execute "npm run build-grammar"

# token is generated while parsing the input. In the nearleyjs documentation this is referred by d or data
# output is the value generated at each level. In the nearleyjs documentation this is referred by v or value


# The output of the parser is generated in the following format:

# token: Object
# output: Object
#	tag: "entityList"
#	map: Object
#     18: "id"
#     27: "name"
#     39: "key"

@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage
@builtin "string.ne"     # "strings"
LiquidExpression -> _ "{%" __ TAG_DEFINITION __ "%}" _ {% function(token) {return { token:token, output: {tag: token[3].tag, map: token[3].map}}} %}
TAG_DEFINITION -> TAG __ ATTRIBUTE_MAP {% function(token) {return { token:token, tag:token[0].tag, map: token[2] }} %}
TAG -> "entityform"  {% function(token) {return { tag: token[0] }} %}
		| "webform"  {% function(token) {return { tag: token[0]}} %}
		| "entityview" {% function(token) {return { tag: token[0]}} %}
		| EntityList {% function(token) {return { tag: token[0].tag }} %}
EntityList -> LIQUID_KEYWORD _ ENTITYLIST_TAG {% function(token) {return { tag:token[2].tag}} %}
LIQUID_KEYWORD -> "include" {% id %}
ENTITYLIST_TAG -> "'entity_list'" {% function(token) {return { tag: "entityList" }} %}
ATTRIBUTE_MAP -> _ (PAIR _):+  {% extractObjectFromSpaceSeparatedPairs %}
	            | (_ PAIR _ ","):+ _ PAIR _ {% extractObjectFromCommaSeparatedPairs %}
PAIR -> KEY _ ":" _ VALUE {% function(token) { return [token[0], token[4]]; } %}
KEY -> ("id" | "name" | "key") {% id %}
VALUE -> sqstring {% function(token, loc) {return { value: token[0], location: loc}} %}
		| dqstring {% function(token, loc) {return { value: token[0], location: loc }} %}

@{%

function extractPair(kv, output) {
    if(kv[0]) { output[kv[1].location + 1] = kv[0][0]; } // kv[0] is key and kv[1] is value
}

function extractObjectFromSpaceSeparatedPairs(d) {
    let output = {};
    for (let i in d[1]) {  // d[1] matches with (PAIR _):+
        extractPair(d[1][i][0], output); // d[1][i] represents ith PAIR _ and d[1][i][0] represents ith PAIR
    }
    return output;
}

function extractObjectFromCommaSeparatedPairs(d) {
    let output = {};
    for (let i in d[0]) { // d[0] matches with (_ PAIR _ ","):+
        extractPair(d[0][i][1], output); // d[0][i] represents ith _ PAIR _ "," and d[0][i][1] represents ith PAIR
    }
	extractPair(d[2], output) // used to extract value from the last PAIR
    return output;
}

%}
