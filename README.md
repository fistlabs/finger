finger [![Build Status](https://travis-ci.org/fistlabs/finger.svg?branch=master)](https://travis-ci.org/fistlabs/finger)
=========

Finger is a powerful and fast nodejs router

##[core/rule](core/rule.js)
```Rule``` is a part of ```Matcher``` that can match and build urls described in special syntax.

###```Rule new Rule(String ruleString[, Object options])```
Creates new rule.

```js
var rule = new Rule('/');
```

####```String ruleString```
```ruleString``` is a ```String``` describing url both for mathing and building back.
```ruleString``` could describe pathname and optionally query.
Pathname rule consists of static rule parts, parameters captures and optional parts.

```
/news/(42/)
```
The ```/news/``` part describes required part of url, and ```42/``` - optional.
Let me make ```postId``` dynamic:

```
/news/(<postId>/)
```
Now, ```postId``` is parameter now. This rule both valid for ```/news/``` and ```/news/146/``` urls.

Let me to describe ```query```. I describe query arguments like pathname arguments.

```
/news/(<postId>/)&date
```
For now ```date``` is required argument. I can describe more than one query arguments:

```
/news/(<postId>/)&date&time
```
I can describe optional query arguments:

```
/news/(<postId>/)&date?time
```
Now, ```time``` argument optional.

That's for ```ruleString``` syntax.

####```Object options```
```options``` object support some rule options.

#####```Boolean options.ignoreCase```
This option disables case sensitivity for pathname rule.

```js
var rule = new Rule('/news/', {
    ignoreCase: true
});
```

For this rule both ```/news/``` and ```/NeWs/``` urls are valid.

###```Object|null rule.match(String url)```
Matches the url to the rule. Returns the set of values according to described arguments.

```js
var rule = new Rule('/news/(<postId>/)?date');
rule.match('/news/'); // -> {postId: undefined, date: undefined}
rule.match('/news/146/'); // -> {postId: '146', date: undefined}
rule.match('/news/146/?nondecl=42'); // -> {postId: '146', date: undefined}
rule.match('/news/146/?date=31-12-14'); // -> {postId: '146', date: '31-12-14'}
rule.match('/forum/'); // -> null
```

###```String rule.build([Object args])```
Builds url from rule.

```js
var rule = new Rule('/news/(<postId>/)?date');
rule.build(); // -> '/news/'
rule.build({postId: 146}); // -> '/news/146/'
rule.build({date: 42}); // -> /news/?date=42
rule.build({postId: 146, date: 42}); // -> /news/146/?date=42
```
##[core/matcher](core/matcher.js)
```Matcher``` is a set of rules that gives an interface to manage rules e.g. adding, deleting, matching.

###```Matcher new Matcher([Object options])```
Creates new ```matcher``` object. ```options``` is a general options for all rules.

###```Rule matcher.addRule(String ruleString[, Object ruleData])```
Adds a ```rule``` to ```matcher```.
```ruleString``` is a rule declaration that I mentioned above.
```ruleData``` is an object that will be associated with rule. ```ruleData.name``` is required, it will be random generated if omitted.

```js
var matcher = new Matcher();
var rule = matcher.addRule('/', {name: 'index', foo: 42});
rule.data.name // -> 'index'
rule.data.foo // -> 42
```

###```Rule|null matcher.delRule(String name)```
Deletes the rule from set

```js
var matcher = new Matcher();
var rule = matcher.addRule('/', {name: 'index'});
assert.strictEqual(rule, matcher.delRule('index'));
```

###```Rule|void matcher.getRule(String name)```
Returns the ```rule``` by ```name```

```js
var matcher = new Matcher();
var rule = matcher.addRule('/', {name: 'index'});
assert.strictEqual(rule, matcher.getRule('index'));
```

###```Array<Rule> matcher.matchAll(String url)```
Returns all matched rules

```js
var matcher = new Matcher();
var index1 = matcher.addRule('/news/?date', {name: 'index1'})
var index2 = matcher.addRule('/news/', {name: 'index2'});
assert.deepEqual([
    {
        name: 'index1', 
        args: {
            date: undefined
        }
    }, 
    {
        name: 'index2', 
        args: {}
    }
], matcher.matchAll('/news/'));
```

##Features

###Parameter types
Let me add the types to parameters

```js
var matcher = new Matcher({
    types: {
        Alnum: '\\d+'
    }
});
matcher.addRule('/news/<Alnum:postId>/');
```
Now the rule is valid for ```/news/42/``` but not for ```/news/foo/```.
Builtin types:
 * ```Segment```- default for pathname arguments (```[^/]+?```).
 * ```Free```  - default for query arguments (```[\s\S]+?```).

###Combined parameters
The parameters could describe where values must be placed in arguments object.

```js
var rule = new Rule('/<page.section>/(<page.itemId>/)');
rule.match('/news/146/'); // -> {page: {section: 'news', itemId: '146'}}
```
Supported both for pathname and query parameters

---------
LICENSE [MIT](LICENSE)
