%token '('
%token '<'
%token ':'
%token '='
%token '>'
%token '/'
%token ')'
%token '?'
%token '&'
%token ALL
%token EOF

%%

INPUT :
    RULE EOF {
        return $$ = $1;
    }
    ;

RULE :
    PATHNAME_RULE {
        $$ = $1;
    }
    ;

PATHNAME_RULE :
    PATHNAME_RULE PATHNAME_RULE_PART {
        $$ = $1.addRule($2);
    }
    |
    PATHNAME_RULE_PART {
        $$ = yy.createRuleSeq().addRule($1);
    }
    ;

PATHNAME_RULE_PART :
    '(' PATHNAME_RULE ')' {
        $$ = $2;
    }
    |
    '<' PARAMETER '>' {
        $$ = $2;
    }
    |
    TEXT {
        $$ = $1;
    }
    |
    '/' {
        $$ = yy.createRuleSep();
    }
    ;

PARAMETER :
    PARAMETER_KIND ':' PARAMETER_NAME {
        $$ = $3.setKind($1);
    }
    |
    PARAMETER_NAME {
        $$ = $1;
    }
    ;

PARAMETER_KIND :
    ALL {
        $$ = $1;
    }
    ;

PARAMETER_NAME :
    ALL {
        $$ = yy.createRuleArg().setName($1);
    }
    ;

TEXT :
    ALL {
        $$ = yy.createRuleAny().addText($1);
    }
    ;
