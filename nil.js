var binding = module.exports = require('./binding'),
    nil = binding.nil;

if (typeof Proxy !== 'object' || typeof Proxy.create !== 'function' || typeof WeakMap === 'undefined') {
  return;
}

// node needs to be run with the `--harmony` flag to get below exports

binding.nilWrap = function nilWrap(o){
  return createProxy(o, NilForwardingHandler);
};

binding.recursiveNilWrap = function recursiveNilWrap(o){
  return wrap(o);
};


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


function createProxy(target, Handler){
  var handler = new Handler(target = wrapnil(target));
  return typeof target === 'function'
    ? Proxy.createFunction(handler,
        function(){ return handler.apply(this, _slice.call(arguments)) },
        function(){ return handler.construct(_slice.call(arguments)) })
    : Proxy.create(handler, Object.getPrototypeOf(target));
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


// ############################
// ### NilForwardingHandler ###
// ############################

function NilForwardingHandler(target){
  this.target = target;
  handleBrokenProcessEnv(this, target);
}

NilForwardingHandler.prototype = {
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



// ###############
// ### WrapMap ###
// ###############

function WrapMap(primitiveWrap, objectWrap) {
  if (!(this instanceof WrapMap)) {
    return new WrapMap(primitiveWrap, objectWrap);
  }

  this.wrapped = new WeakMap;
  this.unwrapped = new WeakMap;
  this.wrapPrimitive = primitiveWrap || function(o){ return o };
  this.wrapObject = objectWrap || function(o){ return o };
}

WrapMap.prototype = {
  constructor: WrapMap,
  wrap: function wrap(o, isDesc){
    if (!isObject(o)) {
      return this.wrapPrimitive(o);
    } else if (this.wrapped.has(o)) {
      return o;
    } else if (isDesc === true) {
      if ('value' in o) o.value = this.wrap(o.value);
      else {
        if ('set' in o) o.set = this.wrap(o.set);
        if ('get' in o) o.get = this.wrap(o.get);
      }
      return o;
    } else if (this.unwrapped.has(o)) {
      return this.unwrapped.get(o);
    } else {
      var p = this.wrapObject(o);
      if (isObject(p)) {
        this.wrapped.set(p, o);
        this.unwrapped.set(o, p);
      }
      return p;
    }
  },
  unwrap: function unwrap(o, isDesc){
    if (!isObject(o)) {
      return this.wrapPrimitive(o);
    } else if (!this.wrapped.has(o)) {
      return o;
    } else if (isDesc === true) {
      if ('value' in o) o.value = this.unwrap(o.value);
      else {
        if ('set' in o) o.set = this.unwrap(o.set);
        if ('get' in o) o.get = this.unwrap(o.get);
      }
      return o;
    } else {
      return this.wrapped.get(o);
    }
  },
  has: function has(o){
    return isObject(o) && this.wrapped.has(o);
  },
  remove: function remove(o){
    var p = this.unwrap(o);
    if (o !== p) {
      this.wrapped.delete(o);
    }
    return p;
  }
};



var nilmap = new WrapMap(wrapnil, function(o){
  return createProxy(o, NilMembraneHandler);
});


function wrap(o, d){
  return nilmap.wrap(o, d);
}

function unwrap(o, d){
  return nilmap.unwrap(o, d);
}


// ##########################
// ### NilMembraneHandler ###
// ##########################

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

