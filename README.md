finger [![Build Status](https://travis-ci.org/fistlabs/finger.svg?branch=master)](https://travis-ci.org/fistlabs/finger)
=========

Finger is a powerful and fast nodejs router

###Rule
`Rule` is a class that can match and build urls described in special syntax.

```js
var Rule = require('finger').Rule;
```

####`Rule new Rule(String ruleString[, Object options[, Object data]])`
Creates new rule.

```js
var rule = new Rule('/');
```

#####`String ruleString`

`ruleString` is a string that consists of pathname description nad optional query string description

######Pathname description

Pathname rule is a string that should describe url.

```
/news/
```

Pathname rule may include parameters.

```
/news/<postId>
```

The rule above both valid for any url that starts with `/news/` and ends with any character sequence except of `/`.

Parameters can have a type.

```
/news/<Number:postId>
```

`Number` is a type of `postId` parameter. It is a named type. `Number` type is included in set of [builtin common types](/core/common-types.js).

Types may also be anonymous.

```
/news/<{\\d+}:postId>
```

Regular expression may be passed between the `{}`. Parameter are for retreiving values while matching and passing while buiding urls.

Pathname consists of required and optional parts.

```
/news/(<postId>/)
```

In the rule above `postId` parameter including trailing `/` is optinal. The rule both valid for `/news/` and `/news/42/` urls.

######Query description

Query description is a sequence of query parameters rules. Query parameter may be required or optional.

```
/news&postId?rnd
```

The rule above describes `/news/` pathname with any query, but `postId` parameter is required. `/news?postId=42` is valid, but `/news` is invalid. `rnd` parameter is optional.

Any query parameter may also have a type.

```
/news/&Number:postId
```

One parameter rule describes one parameter by default. But parameter rules may be multiple.

```
/news/?Number:tag+
```

The rule above describes news feed, that can be filtered by tags.

#####`Object options`
Rule object support some options

######`Boolean options.ignoreCase`
Disables case sensitivity for pathname rule

```js
var rule = new Rule('/news/', {
    ignoreCase: true
});
```

For this rule both `/news/` and `/NeWs/` urls are identical.

######`Boolean options.appendSlash`
Allows url to do not contain trailing slash

```js
var rule = new Rule('/news/', {
    appendSlash: true
});
```

For this rule both `/news/` and `/news` urls are valid.

#####`Object data`
The data will be appended to rule

```js
var rule = new Rule('/news/', {
    appendSlash: true
}, {
    name: 'news'
});
```

####`Object|null rule.match(String url)`
Matches the url to the rule. Returns the set of values according to described arguments

```js
var rule = new Rule('/news/(<postId>/)');
rule.match('/news/'); // -> {postId: undefined}
rule.match('/news/146/?date=42'); // -> {postId: '146', date: '42'}
rule.match('/forum/'); // -> null
```

####`String rule.build([Object args])`
Builds url from rule

```js
var rule = new Rule('/news/(<postId>/)');

rule.build(); // -> '/news/'
rule.build({postId: 146}); // -> '/news/146/'
rule.build({date: 42}); // -> /news/?date=42
rule.build({postId: 146, date: 42}); // -> /news/146/?date=42
```

###Matcher

`Matcher` is a set of rules that gives an interface to manage rules e.g. adding, deleting, matching.

```js
var Matcher = require('finger').Matcher;
```

####`Matcher new Matcher([Object options])`
Creates new `matcher` object. `options` is a general options for all rules.

####`Rule matcher.addRule(String ruleString[, Object data])`
Adds a ```rule``` to `matcher`.
`ruleString` is a rule declaration that I mentioned above.
`data` is an object that will be associated with rule. `data.name` is required, it will be random generated if omitted.

```js
var matcher = new Matcher();
var rule = matcher.addRule('/', {name: 'index', foo: 42});
rule.data.name // -> 'index'
rule.data.foo // -> 42
```

####`Rule|null matcher.delRule(String name)`
Deletes the rule from set

```js
var matcher = new Matcher();
var rule = matcher.addRule('/', {name: 'index'});
assert.strictEqual(rule, matcher.delRule('index'));
```

####`Rule|void matcher.getRule(String name)`
Returns the `rule` by `name`

```js
var matcher = new Matcher();
var rule = matcher.addRule('/', {name: 'index'});
assert.strictEqual(rule, matcher.getRule('index'));
```

####`Array<Object> matcher.findMatches(String url)`
Returns all match results

```js
var matcher = new Matcher();
matcher.addRule('/news/', {name: 'news'})
matcher.addRule('/<page>/', {name: 'other'});
assert.deepEqual(matcher.matchAll('/news/'), [
    {
        name: 'news', 
        args: {}
    }, 
    {
        name: 'other', 
        args: {
            page: 'news'
        }
    }
]);
```

###Router

`Router` is a subclass of `Matcher`.

```js
var Router = require('finger');
```

`Router` is a matches that optimized and improved for match http requests.

`Router`'s rules had extended rule string. `Router`'s rules may describe not only url, but also request method and some options.

```
POST,PUT /upload/ si
```

That means that the should match url only if request method are `POST` or `PUT`. Also two last characters at the and of rule means that rule should ignore case and append slash to url. Flags in lower letter case enables options, but in upper, disables.

If method does not specified, that `GET` should be implicitly added. Special value for method is `*`. `*` means that any method will be matched.

####`Array<String> router.findVerbs(String url)`

Find all methods that allowed for passed url.

####`Array<Rule> router.getAllowedRules(String verb)`

Returns all rules that allowed for passed verb.

####`Array<Match> router.findMatchesFor(String url, Array<Rule>)`

Returns all matches for passed url and rules.

###Common usage

```js
var matches = router.getAllowedMatches(req.method, req.url);
if (!matches.length) {
    res.statusCode = 404;
    res.end();
    return;
}
doSomethingWithMatches(matches);
```

###Advanced usage

```js
// Get all rules that potentially may handle request
var allowedRules = router.getAllowedRules(req.method);
if (!allowedRules.length) {
    // The method is not implemented
    res.statusCode = 501;
    res.end();
    return;
}
// Find all matched
var matches = router.findMatchesFor(req.url, allowedRules);
if (!matches.length) {
    // No matches found. Maybe incorrect request method
    var allowedVerbs = router.findVerbs(req.url);
    if (!allowedVerbs.length) {
        // No any handlers. Document Not Found
        res.statusCode = 404;
        res.end();
        return;
    }    
    // Found other rules, that can handle the request
    res.setHeader('Allow', allowedVerbs.join(','));
    // Method Not Allowed
    res.statusCode = 405;
    res.end();
    return;
}
// Score!
doSomethingWithMatches(matches);
```

---------
LICENSE [MIT](LICENSE)
