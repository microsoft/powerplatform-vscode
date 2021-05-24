# Everytime you change the Grammar file please generate the Parser file.
# To generate the parser just execute "npm run build-grammar"

# token is generated while parsing the input. In the nearleyjs documentation this is referred by d or data
# output is the value generated at each level. In the nearleyjs documentation this is referred by v or value

@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage
@builtin "string.ne"     # "strings"
LiquidExpression -> _ "{%" __ TAG_DEFINITION __ "%}" _ {% function(token) {return { token:token, output: {tag: token[3].tag, key: token[3].key, value: token[3].value}}} %}
TAG_DEFINITION -> TAG __ ATTRIBUTE_MAP {% function(token) {return { token:token, tag:token[0].output, key:token[2].key, value:token[2].value }} %}
TAG -> ("entityform" | "webform" | EntityList) {% function(token) {return { output:token[0]}} %}
EntityList -> LIQUID_KEYWORD _ ENTITYLIST_TAG {% function(token) {return { output:token[2]}} %}
LIQUID_KEYWORD -> "include" {% function(token) {return { output:token[0]}} %}
ENTITYLIST_TAG -> "'entity_list'" {% function(token) {return { output:"entityList"}} %}
KEY -> ("id" | "name" | "key" ) {% id %}
VALUE -> sqstring | dqstring {% id %}
ATTRIBUTE_MAP -> PAIR {% function(token) {return { key: token[0].key, value: token[0].value}} %}
PAIR -> KEY _ ":" _ VALUE {% function(token) {return { key:token[0], value: token[4]}} %}
