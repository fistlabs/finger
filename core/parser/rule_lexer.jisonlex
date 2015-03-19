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

\{(?:\\[\s\S]|[^\{\}])+\}               return 'RGX';
(?:\\[\s\S]|[^\\(<{}:=>\/)?&+])+        return 'ALL';
<<EOF>>                                 return 'EOF';
