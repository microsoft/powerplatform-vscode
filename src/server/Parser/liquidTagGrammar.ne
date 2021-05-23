# Everytime you change the Grammar file please generate the Parser file.
# To generate the parser just execute "npm run build-grammar"

# token is generated while parsing the input. In the nearleyjs documentation this is referred by d or data
# output is the value generated at each level. In the nearleyjs documentation this is referred by v or value


@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage
@builtin "string.ne"     # "strings"
LiquidExpression -> _ "{%" __ TAG_DEFINITION __ "%}" _ {% function(token) {return { token:token, output: token[3]}} %}
TAG_DEFINITION -> TAG ATTRIBUTE_MAP {% function(token) {return { token:token, tag:token[0].output, attributeMap: token[1].output}} %}
TAG -> ("entityform" | "webform" | EntityList) {% function(token) {return { output:token[0]}} %}
EntityList -> LIQUID_KEYWORD _ ENTITYLIST_TAG {% function(token) {return { output:token[2]}} %}
LIQUID_KEYWORD -> "include" {% function(token) {return { output:token[0]}} %}
ENTITYLIST_TAG -> "'entity_list'" {% function(token) {return { output:"entityList"}} %}
KEY -> ("id" | "name" | "key" ) {% function(token) {return { output:token[0]}} %}
VALUE -> dqstring {% function(token) {return { output:token[0]}} %}
ATTRIBUTE_MAP -> ( ( _ PAIR ):* ) {% function(token) {return { token:token, output: extractAttributeMap(token[0][0])}} %}
PAIR -> KEY _ ":" _ VALUE {% function(token) { return [token[0], token[4]]; } %}

@{%

/***** COMMON FUNCTIONS *****/


function extractPair(keyValue, output) {
    output.set(keyValue[0].output, keyValue[1].output);
}

function extractAttributeMap(token) {
    let output = new Map();

    for (let index in token) {
        extractPair(token[index][1], output);
    }

    return output;
}

%}
