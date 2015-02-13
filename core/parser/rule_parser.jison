%token '('
%token '<'
%token ':'
%token '='
%token '>'
%token '/'
%token ')'
%token '?'
%token '&'
%token '+'
%token REGEX
%token ALL
%token EOF

%%

INPUT :
    RULE EOF {
        return $$ = $1;
    }
    ;

RULE :
    RULE QUERY_ARG {
        $$ = $1.addQueryArgRule($2);
    }
    |
    PATH_RULE {
        $$ = $1;
    }
    ;

QUERY_ARG :
    '?' PARAMETER_RULE '+' {
        $2.required = false;
        $2.multiple = true;
        $$ = $2;
    }
    |
    '&' PARAMETER_RULE '+' {
        $2.required = $2.multiple = true;
        $$ = $2;
    }
    |
    '?' PARAMETER_RULE {
        $2.required = $2.multiple = false;
        $$ = $2;
    }
    |
    '&' PARAMETER_RULE {
        $2.multiple = false;
        $2.required = true;
        $$ = $2;
    }
    ;

PATH_RULE :
    PATH_RULE PATHNAME_RULE_PART {
        $$ = $1.addRule($2);
    }
    |
    PATHNAME_RULE_PART {
        $$ = yy.createRulePath().addRule($1);
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
    PATH_PARAMETER {
        $$ = $1;
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

PATH_PARAMETER :
    '<' PARAMETER_RULE '>' {
        $$ = $2;
    }
    ;

PARAMETER_RULE :
    PARAMETER '=' ALL {
        $$ = $1.setDefault($3);
    }
    |
    PARAMETER {
        $$ = $1;
    }
    ;

PARAMETER :
    ANON_KIND ':' PARAMETER_NAME {
        $$ = $3.setRegex($1);
    }
    |
    PARAMETER_KIND ':' PARAMETER_NAME {
        $$ = $3.setKind($1);
    }
    |
    PARAMETER_NAME {
        $$ = $1;
    }
    ;

ANON_KIND :
    REGEX {
        $$ = $1.substring(1, $1.length - 1);
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
