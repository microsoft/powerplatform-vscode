// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


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

var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "unsigned_int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_int$ebnf$1", "symbols": ["unsigned_int$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_int", "symbols": ["unsigned_int$ebnf$1"], "postprocess": 
        function(d) {
            return parseInt(d[0].join(""));
        }
        },
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "int$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "int$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess": 
        function(d) {
            if (d[0]) {
                return parseInt(d[0][0]+d[1].join(""));
            } else {
                return parseInt(d[1].join(""));
            }
        }
        },
    {"name": "unsigned_decimal$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$1", "symbols": ["unsigned_decimal$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "unsigned_decimal$ebnf$2", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "unsigned_decimal$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "unsigned_decimal", "symbols": ["unsigned_decimal$ebnf$1", "unsigned_decimal$ebnf$2"], "postprocess": 
        function(d) {
            return parseFloat(
                d[0].join("") +
                (d[1] ? "."+d[1][1].join("") : "")
            );
        }
        },
    {"name": "decimal$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "decimal$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$2", "symbols": ["decimal$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": ["decimal$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "decimal$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "decimal$ebnf$3", "symbols": ["decimal$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "decimal$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal", "symbols": ["decimal$ebnf$1", "decimal$ebnf$2", "decimal$ebnf$3"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "")
            );
        }
        },
    {"name": "percentage", "symbols": ["decimal", {"literal":"%"}], "postprocess": 
        function(d) {
            return d[0]/100;
        }
        },
    {"name": "jsonfloat$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "jsonfloat$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$2", "symbols": ["jsonfloat$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": ["jsonfloat$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "jsonfloat$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "jsonfloat$ebnf$3", "symbols": ["jsonfloat$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": ["jsonfloat$ebnf$4$subexpression$1$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$4$subexpression$1", "symbols": [/[eE]/, "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "jsonfloat$ebnf$4$subexpression$1$ebnf$2"]},
    {"name": "jsonfloat$ebnf$4", "symbols": ["jsonfloat$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat", "symbols": ["jsonfloat$ebnf$1", "jsonfloat$ebnf$2", "jsonfloat$ebnf$3", "jsonfloat$ebnf$4"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "") +
                (d[3] ? "e" + (d[3][1] || "+") + d[3][2].join("") : "")
            );
        }
        },
    {"name": "dqstring$ebnf$1", "symbols": []},
    {"name": "dqstring$ebnf$1", "symbols": ["dqstring$ebnf$1", "dstrchar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "dqstring", "symbols": [{"literal":"\""}, "dqstring$ebnf$1", {"literal":"\""}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "sqstring$ebnf$1", "symbols": []},
    {"name": "sqstring$ebnf$1", "symbols": ["sqstring$ebnf$1", "sstrchar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "sqstring", "symbols": [{"literal":"'"}, "sqstring$ebnf$1", {"literal":"'"}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "btstring$ebnf$1", "symbols": []},
    {"name": "btstring$ebnf$1", "symbols": ["btstring$ebnf$1", /[^`]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "btstring", "symbols": [{"literal":"`"}, "btstring$ebnf$1", {"literal":"`"}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "dstrchar", "symbols": [/[^\\"\n]/], "postprocess": id},
    {"name": "dstrchar", "symbols": [{"literal":"\\"}, "strescape"], "postprocess": 
        function(d) {
            return JSON.parse("\""+d.join("")+"\"");
        }
        },
    {"name": "sstrchar", "symbols": [/[^\\'\n]/], "postprocess": id},
    {"name": "sstrchar", "symbols": [{"literal":"\\"}, "strescape"], "postprocess": function(d) { return JSON.parse("\""+d.join("")+"\""); }},
    {"name": "sstrchar$string$1", "symbols": [{"literal":"\\"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "sstrchar", "symbols": ["sstrchar$string$1"], "postprocess": function(d) {return "'"; }},
    {"name": "strescape", "symbols": [/["\\/bfnrt]/], "postprocess": id},
    {"name": "strescape", "symbols": [{"literal":"u"}, /[a-fA-F0-9]/, /[a-fA-F0-9]/, /[a-fA-F0-9]/, /[a-fA-F0-9]/], "postprocess": 
        function(d) {
            return d.join("");
        }
        },
    {"name": "LiquidExpression$string$1", "symbols": [{"literal":"{"}, {"literal":"%"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "LiquidExpression$string$2", "symbols": [{"literal":"%"}, {"literal":"}"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "LiquidExpression", "symbols": ["_", "LiquidExpression$string$1", "__", "TAG_DEFINITION", "__", "LiquidExpression$string$2", "_"], "postprocess": function(token) {return { token:token, output: {tag: token[3].tag, map: token[3].map}}}},
    {"name": "TAG_DEFINITION", "symbols": ["TAG", "__", "ATTRIBUTE_MAP"], "postprocess": function(token) {return { token:token, tag:token[0].tag, map: token[2] }}},
    {"name": "TAG$string$1", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"t"}, {"literal":"y"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "TAG", "symbols": ["TAG$string$1"], "postprocess": function(token) {return { tag: token[0] }}},
    {"name": "TAG$string$2", "symbols": [{"literal":"w"}, {"literal":"e"}, {"literal":"b"}, {"literal":"f"}, {"literal":"o"}, {"literal":"r"}, {"literal":"m"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "TAG", "symbols": ["TAG$string$2"], "postprocess": function(token) {return { tag: token[0]}}},
    {"name": "TAG$string$3", "symbols": [{"literal":"e"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"t"}, {"literal":"y"}, {"literal":"v"}, {"literal":"i"}, {"literal":"e"}, {"literal":"w"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "TAG", "symbols": ["TAG$string$3"], "postprocess": function(token) {return { tag: token[0]}}},
    {"name": "TAG", "symbols": ["EntityList"], "postprocess": function(token) {return { tag: token[0].tag }}},
    {"name": "EntityList", "symbols": ["LIQUID_KEYWORD", "_", "ENTITYLIST_TAG"], "postprocess": function(token) {return { tag:token[2].tag}}},
    {"name": "LIQUID_KEYWORD$string$1", "symbols": [{"literal":"i"}, {"literal":"n"}, {"literal":"c"}, {"literal":"l"}, {"literal":"u"}, {"literal":"d"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "LIQUID_KEYWORD", "symbols": ["LIQUID_KEYWORD$string$1"], "postprocess": id},
    {"name": "ENTITYLIST_TAG$string$1", "symbols": [{"literal":"'"}, {"literal":"e"}, {"literal":"n"}, {"literal":"t"}, {"literal":"i"}, {"literal":"t"}, {"literal":"y"}, {"literal":"_"}, {"literal":"l"}, {"literal":"i"}, {"literal":"s"}, {"literal":"t"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ENTITYLIST_TAG", "symbols": ["ENTITYLIST_TAG$string$1"], "postprocess": function(token) {return { tag: "entity_list" }}},
    {"name": "ATTRIBUTE_MAP$ebnf$1$subexpression$1", "symbols": ["PAIR", "_"]},
    {"name": "ATTRIBUTE_MAP$ebnf$1", "symbols": ["ATTRIBUTE_MAP$ebnf$1$subexpression$1"]},
    {"name": "ATTRIBUTE_MAP$ebnf$1$subexpression$2", "symbols": ["PAIR", "_"]},
    {"name": "ATTRIBUTE_MAP$ebnf$1", "symbols": ["ATTRIBUTE_MAP$ebnf$1", "ATTRIBUTE_MAP$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ATTRIBUTE_MAP", "symbols": ["_", "ATTRIBUTE_MAP$ebnf$1"], "postprocess": extractObjectFromSpaceSeparatedPairs},
    {"name": "ATTRIBUTE_MAP$ebnf$2$subexpression$1", "symbols": ["_", "PAIR", "_", {"literal":","}]},
    {"name": "ATTRIBUTE_MAP$ebnf$2", "symbols": ["ATTRIBUTE_MAP$ebnf$2$subexpression$1"]},
    {"name": "ATTRIBUTE_MAP$ebnf$2$subexpression$2", "symbols": ["_", "PAIR", "_", {"literal":","}]},
    {"name": "ATTRIBUTE_MAP$ebnf$2", "symbols": ["ATTRIBUTE_MAP$ebnf$2", "ATTRIBUTE_MAP$ebnf$2$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "ATTRIBUTE_MAP", "symbols": ["ATTRIBUTE_MAP$ebnf$2", "_", "PAIR", "_"], "postprocess": extractObjectFromCommaSeparatedPairs},
    {"name": "PAIR", "symbols": ["KEY", "_", {"literal":":"}, "_", "VALUE"], "postprocess": function(token) { return [token[0], token[4]]; }},
    {"name": "KEY$subexpression$1$string$1", "symbols": [{"literal":"i"}, {"literal":"d"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "KEY$subexpression$1", "symbols": ["KEY$subexpression$1$string$1"]},
    {"name": "KEY$subexpression$1$string$2", "symbols": [{"literal":"n"}, {"literal":"a"}, {"literal":"m"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "KEY$subexpression$1", "symbols": ["KEY$subexpression$1$string$2"]},
    {"name": "KEY$subexpression$1$string$3", "symbols": [{"literal":"k"}, {"literal":"e"}, {"literal":"y"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "KEY$subexpression$1", "symbols": ["KEY$subexpression$1$string$3"]},
    {"name": "KEY", "symbols": ["KEY$subexpression$1"], "postprocess": id},
    {"name": "VALUE", "symbols": ["sqstring"], "postprocess": function(token, loc) {return { value: token[0], location: loc}}},
    {"name": "VALUE", "symbols": ["dqstring"], "postprocess": function(token, loc) {return { value: token[0], location: loc }}}
]
  , ParserStart: "LiquidExpression"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
