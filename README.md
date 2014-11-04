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
```ruleString``` is a ```String``` describing url both for matching and building.
It consists of static rule parts, parameters captures and optional parts.

```
/news/(42/)
```
The ```/news/``` part describes required part of url, and ```42/``` - optional.
Let's make optional part more dynamic:

```
/news/(<postId>/)
```
Now, ```postId``` is parameter now. This rule both valid for ```/news/``` and ```/news/146/``` urls.

####```Object options```
Rule object support some options

#####```Boolean options.ignoreCase```
Disables case sensitivity for pathname rule

```js
var rule = new Rule('/news/', {
    ignoreCase: true
});
```

For this rule both ```/news/``` and ```/NeWs/``` urls are identical.

###```Object|null rule.match(String url)```
Matches the url to the rule. Returns the set of values according to described arguments

```js
var rule = new Rule('/news/(<postId>/)');
rule.match('/news/'); // -> {postId: undefined}
rule.match('/news/146/?date=42'); // -> {postId: '146', date: '42'}
rule.match('/forum/'); // -> null
```

###```String rule.build([Object args])```
Builds url from rule

```js
var rule = new Rule('/news/(<postId>/)');
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

##Features

###Parameter types
Let's add the types to parameters:

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
 * ```Seg```- ```[^/?&]+?```, default
 * ```Seq```  - ```[^?&]+?```

###Default values
Let's set default parameter values
```js
var rule = new Rule('/news/(<postId=42>/)');
rule.match('/news/'); // -> {postId: '42'}
rule.build(); // -> /news/42/
```
---------
LICENSE [MIT](LICENSE)
