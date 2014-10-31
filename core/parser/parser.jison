%lex

%%

"("                                     return '(';
"<"                                     return '<';
":"                                     return ':';
">"                                     return '>';
"/"                                     return '/';
")"                                     return ')';
"?"                                     return '?';
"&"                                     return '&';
"+"                                     return '+';

(?:\\[\s\S]|[^\\(<:>\/)?&+])+           return 'ALL';
<<EOF>>                                 return 'EOF';
/lex

%token '('
%token '<'
%token ':'
%token '>'
%token '/'
%token ')'
%token '?'
%token '&'
%token '+'

%token ALL
%token EOF

%%

INPUT :
    RULE EOF {
        return $$ = $1;
    }
    ;

RULE :
    PATH_RULE {
        $$ = $1;
    }
    |
    PATHNAME_RULE {
        $$ = $1
    }
    ;

PATH_RULE :
    PATH_RULE QUERY_PARAMETER {
        $$ = $1.addArg($2);
    }
    |
    PATHNAME_RULE QUERY_PARAMETER {
        $$ = $1.addArg($2);
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

QUERY_PARAMETER :
    QUERY_PARAMETER_SINGLE '+' {
        $$ = $1.setMultiple(true);
    }
    |
    QUERY_PARAMETER_SINGLE {
        $$ = $1.setMultiple(false);
    }
    ;

QUERY_PARAMETER_SINGLE :
    QUERY_PARAMETER_REQUIRED {
        $$ = $1;
    }
    |
    QUERY_PARAMETER_OPTIONAL {
        $$ = $1;
    }
    ;

QUERY_PARAMETER_REQUIRED :
    '&' PARAMETER {
        $$ = $2.setRequired(true);
    }
    ;

QUERY_PARAMETER_OPTIONAL :
    '?' PARAMETER {
        $$ = $2.setRequired(false);
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
