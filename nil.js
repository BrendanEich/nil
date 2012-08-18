var binding = module.exports = require('./binding'),
    nil = binding.nil;

if (typeof Proxy !== 'object' || typeof Proxy.create !== 'function' || typeof WeakMap === 'undefined') {
  return;
}

// node needs to be run with the `--harmony` flag to get below exports

binding.nilWrap = function nilWrap(o){
  return createProxy(o, NilForwarder);
}

function createProxy(target, Handler){
  var handler = new Handler(target = wrapnil(target));

  return typeof target === 'function'
    ? Proxy.createFunction(handler,
        function(){ return handler.apply(this, _slice.call(arguments)) },
        function(){ return handler.construct(_slice.call(arguments)) })
    : Proxy.create(handler, Object.getPrototypeOf(target));
}



var _slice  = Array.prototype.slice,
    _bind   = Function.prototype.bind,
    _apply  = Function.prototype.apply,
    _hasOwn = Object.prototype.hasOwnProperty;

var nilDesc = { value: nil,
                writable: true,
                enumerable: false,
                configurable: true };

function isObject(o){
  return o != null && typeof o === 'object' || typeof o === 'function';
}

function wrapnil(value){
  return typeof value === 'undefined' ? nil : value;
}

function wrapnilDesc(desc){
  if (desc) {
    desc.configurable = true;
    if ('value' in desc && typeof desc.value === 'undefined') {
      desc.value = nil;
    }
  }
  return desc;
}

function handleBrokenProcessEnv(handler, target){
  if (target === process.env) {
    handler.getOwnPropertyDescriptor = function(key){
      var desc = Object.getOwnPropertyDescriptor(this.target, key);
      if (desc) {
        desc.configurable = true;
        if (typeof desc.value === 'undefined') {
          desc.value = this.target[key];
        }
      }
      return desc;
    }
  }
}

function NilForwarder(target){
  this.target = target;
  handleBrokenProcessEnv(this, target);
}

NilForwarder.prototype = {
  getOwnPropertyNames: function(){
    return Object.getOwnPropertyNames(this.target);
  },
  keys: function(){
    return Object.keys(this.target);
  },
  enumerate: function(){
    var i=0, keys=[];
    for (keys[i++] in this.target);
    return keys;
  },
  getPropertyDescriptor: function(key){
    var o = this.target;
    while (o) {
      var desc = Object.getOwnPropertyDescriptor(o, key);
      if (desc) {
        return wrapnilDesc(desc);
      }
      o = Object.getPrototypeOf(o);
    }
    return nilDesc;
  },
  getOwnPropertyDescriptor: function(key){
    return wrapnilDesc(Object.getOwnPropertyDescriptor(this.target, key)) || nilDesc;
  },
  defineProperty: function(key, desc){
    return Object.defineProperty(this.target, key, desc);
  },
  get: function(receiver, key){
    return wrapnil(this.target[key]);
  },
  set: function(receiver, key, value){
    this.target[key] = wrapnil(value);
    return true;
  },
  has: function(key){
    return key in this.target;
  },
  hasOwn: function(key){
    return _hasOwn.call(this.target, key);
  },
  delete: function(key){
    delete this.target[key];
    return true;
  },
  apply: function(receiver, args){
    return _apply.call(this.target, wrapnil(receiver), args.map(wrapnil));
  },
  construct: function(args){
    return new (_bind.apply(this.target, [null].concat(args.map(wrapnil))));
  }
};




function WrapMap(primitiveWrap, objectWrap) {
  if (!(this instanceof WrapMap)) {
    return new WrapMap(wrapper);
  }

  var wrapped = new WeakMap;
  var unwrapped = new WeakMap;

  function wrap(o, isDesc){
    if (isDesc === true) {
      return wrapDesc(o);
    } else if (!isObject(o)) {
      return primitiveWrap(o);
    } else if (wrapped.has(o)) {
      return o;
    } else if (unwrapped.has(o)) {
      return unwrapped.get(o);
    } else {
      var p = objectWrap(o);
      if (isObject(p)) {
        wrapped.set(p, o);
        unwrapped.set(o, p);
      }
      return p;
    }
  }

  function unwrap(o, isDesc){
    if (isDesc === true) {
      return unwrapDesc(o);
    } else if (!isObject(o)) {
      return primitiveWrap(o);
    } else if (!wrapped.has(o)) {
      return o;
    } else {
      return wrapped.get(o);
    }
  }

  function has(o){
    return isObject(o) && wrapped.has(o);
  }

  function remove(o){
    var p = unwrap(o);
    if (o !== p)
      wrapped.delete(o);
    return p;
  }

  function wrapDesc(o){
    if (isObject(o) && !wrapped.has(o)) {
      if ('value' in o) o.value = wrap(o.value);
      if (o.set) o.set = wrap(o.set);
      if (o.get) o.get = wrap(o.get);
    }
    return o;
  }

  function unwrapDesc(o){
    if (isObject(o) && wrapped.has(o)) {
      if ('value' in o) o.value = unwrap(o.value);
      if (o.set) o.set = unwrap(o.set);
      if (o.get) o.get = unwrap(o.get);
    }
    return o;
  }

  this.wrap = wrap;
  this.unwrap = unwrap;
  this.remove = remove;
  this.has = has;
}





var wrapmap = new WrapMap(wrapnil, function(o){
  return createProxy(o, NilMembraneHandler);
});

var wrap = wrapmap.wrap,
    unwrap = wrapmap.unwrap;

binding.recursiveNilWrap = function recursiveNilWrap(o){
  return wrap(o);
};


function NilMembraneHandler(target){
  this.target = target;
  handleBrokenProcessEnv(this, target);
}

NilMembraneHandler.prototype = {
  getOwnPropertyNames: function(){
    return Object.getOwnPropertyNames(this.target);
  },
  keys: function(){
    return Object.keys(this.target);
  },
  enumerate: function(){
    var i=0, keys=[];
    for (keys[i++] in this.target);
    return keys;
  },
  getPropertyDescriptor: function(key){
    var o = this.target;
    while (o) {
      var desc = Object.getOwnPropertyDescriptor(o, key);
      if (desc) {
        return wrap(desc, true);
      }
      o = Object.getPrototypeOf(o);
    }
    return nilDesc;
  },
  getOwnPropertyDescriptor: function(key){
    return wrap(Object.getOwnPropertyDescriptor(this.target, key)) || nilDesc;
  },
  defineProperty: function(key, desc){
    return Object.defineProperty(this.target, key, unwrap(desc, true));
  },
  get: function(receiver, key){
    return wrap(unwrap(receiver)[key]);
  },
  set: function(receiver, key, value){
    unwrap(receiver)[key] = unwrap(value);
    return true;
  },
  has: function(key){
    return key in this.target;
  },
  hasOwn: function(key){
    return _hasOwn.call(this.target, key);
  },
  delete: function(key){
    delete this.target[key];
    return true;
  },
  apply: function(receiver, args){
    return wrap(_apply.call(this.target, unwrap(receiver), args.map(unwrap)));
  },
  construct: function(args){
    return wrap(new (_bind.apply(this.target, [null].concat(args.map(unwrap)))));
  }
};

