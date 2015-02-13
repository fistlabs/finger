%%

"("                                     return '(';
"<"                                     return '<';
":"                                     return ':';
"="                                     return '=';
">"                                     return '>';
"/"                                     return '/';
")"                                     return ')';
"?"                                     return '?';
"&"                                     return '&';
"+"                                     return '+';

\{(?:\\[\s\S]|[^\{\}])+\}               return 'REGEX'
(?:\\[\s\S]|[^\\(<{}:=>\/)?&+])+        return 'ALL';
<<EOF>>                                 return 'EOF';
