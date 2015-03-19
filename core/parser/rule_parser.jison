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
%token RGX
%token ALL
%token EOF

%%

INPUT :
    PATH EOF {
        return $$ = $1;
    }
    ;

PATH :
    PATH QUERY_ARG {
        $$ = $1.addQueryArgRule($2);
    }
    |
    PATHNAME {
        $$ = $1;
    }
    ;

PATHNAME :
    PATHNAME SEGMENT {
        $$ = $1.addRule($2);
    }
    |
    SEGMENT {
        $$ = yy.createRulePath().addRule($1);
    }
    ;

QUERY_ARG :
    '?' ARG '+' {
        $2.required = false;
        $2.multiple = true;
        $$ = $2;
    }
    |
    '&' ARG '+' {
        $2.required = true;
        $2.multiple = true;
        $$ = $2;
    }
    |
    '?' ARG {
        $2.required = false;
        $2.multiple = false;
        $$ = $2;
    }
    |
    '&' ARG {
        $2.required = true;
        $2.multiple = false;
        $$ = $2;
    }
    ;

SEQUENCE :
    SEQUENCE SEGMENT {
        $$ = $1.addRule($2);
    }
    |
    SEGMENT {
        $$ = yy.createRuleSeq().addRule($1);
    }
    ;

SEGMENT :
    '(' SEQUENCE ')' {
        $$ = $2;
    }
    |
    PATHNAME_ARG {
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

PATHNAME_ARG :
    '<' ARG '>' {
        $$ = $2;
    }
    ;

ARG :
    VAR '=' ALL {
        $$ = $1.setDefault($3);
    }
    |
    VAR {
        $$ = $1;
    }
    ;

VAR :
    IMPL_KIND ':' ARG_NAME {
        $$ = $3.setRegex($1);
    }
    |
    EXPL_KIND ':' ARG_NAME {
        $$ = $3.setKind($1);
    }
    |
    ARG_NAME {
        $$ = $1;
    }
    ;

IMPL_KIND :
    RGX {
        $$ = $1.substring(1, $1.length - 1);
    }
    ;

EXPL_KIND :
    ALL {
        $$ = $1;
    }
    ;

ARG_NAME :
    ALL {
        $$ = yy.createRuleArg().setName($1);
    }
    ;

TEXT :
    ALL {
        $$ = yy.createRuleAny().addText($1);
    }
    ;
