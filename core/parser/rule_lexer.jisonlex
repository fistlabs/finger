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
