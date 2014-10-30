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

(?:\\[\s\S]|[^\\(<:>\/)?&])+            return 'ALL';
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

%token ALL
%token EOF

%%

INPUT :
    RULE EOF {
        return $$ = $1;
    }
    ;

RULE :
    PATH {
        $$ = $1;
    }
    |
    SEQ {
        $$ = $1
    }
    ;

PATH :
    PATH QUERY_ARG {
        $$ = $1.addArg($2);
    }
    |
    SEQ QUERY_ARG {
        $$ = $1.addArg($2);
    }
    ;

SEQ :
    SEQ SEG {
        $$ = $1.addRule($2);
    }
    |
    SEG {
        $$ = yy.createRuleSeq().addRule($1);
    }
    ;

QUERY_ARG :
    '&' ARG {
        $$ = $2;
    }
    |
    '?' ARG {
        $$ = $2.setRequired(false);
    }
    ;

SEG :
    '(' SEQ ')' {
        $$ = $2;
    }
    |
    '<' ARG '>' {
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

ARG :
    KIND ':' NAME {
        $$ = $3.setKind($1);
    }
    |
    NAME {
        $$ = $1;
    }
    ;

KIND :
    ALL {
        $$ = $1;
    }
    ;

NAME :
    ALL {
        $$ = yy.createRuleArg().setName($1);
    }
    ;

TEXT :
    ALL {
        $$ = yy.createRuleAny().addText($1);
    }
    ;
