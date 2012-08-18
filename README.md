# nil
__nil__ is nothing. falsey. nada. zero. zip. It's a nothing thing that will eat everything you throw at it and return itself.

## it does.. what?
It does a lot of nothing

```javascript
var nil = require('nil');
!nil                                 // is falsey in boolean comparisons
nil == null                          // in null/undefined equality class
typeof nil == 'undefined'            // type is undefined
nil !== undefined                    // isn't undefined though
nil === nil.always.returns.nil       // all properties return nil
nil === nil()                        // returns nil when called
(nil+'') == ''                       // returns empty string when coerced to string
Object.prototype.toString.call(nil)  // '[object Nil]'
Object.keys(nil).length == 0         // returns empty array when enumerated
Object.getPrototypeOf(nil)           // null
```

## notes

### toString
In order to support coercion to empty string (instead of 'undefined') nil.toString does return a function.

```javascript
var nilToString = nil.toString;
!nilToString === true                        // is NOT falsey
typeof nilToString == 'function'             // is type function
nilToString() == ''                          // returns empty string
Object.getPrototypeOf(nilToString) === nil   // inherits from nil
nilToString === nilToString.call             // call property returns self
nilToString === nilToString.apply            // apply property returns self
nilToString === nilToString.bind             // bind property returns self
nilToString === nilToString.toString         // toString property returns self
nilToString.any.other.property === nil       // because it inherits from nil
Object.keys(nilToString).length == 0         // no enumerable keys
Object.getOwnPropertyNames(nilToString) == 3 // ['call', 'apply', 'bind']
```

### ToNumber
Because nil is `typeof === 'undefined'` coercion to number is unfortunately `NaN`. ES5 spec does not defer to `valueOf` to coerce `undefined` to a number. V8 appears to follow the spec so it seems impossible to influence the outcome of this coercion. Therefore `nil` isn't useful in math operations. The following is useful for this problem (with or without nil);

```javascript
function toFinite(n){
  return isFinite(n *= 1) ? n : 0;
}
```

### isObject
Common `isObject` functions will fail check for __nil__. This is probably desirable usually, but if not (like in the case of document.all), an alternative can work.

```javascript
function isObject1(o){
  return Object(o) === o;
}

function isObject2(o){
  return o != null && typeof o === 'object' || typeof o === 'function';
}

function isObject3(o){
  return o == null ? o !== null && o !== undefined : typeof o === 'object' || typeof o === 'function';
}

isObject1(nil) // false
isObject2(nil) // false
isObject3(nil) // true
```
