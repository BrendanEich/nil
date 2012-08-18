#include <v8.h>
#include <node.h>

using namespace v8;

Persistent<Object> singleton;
Persistent<Function> toString;
Persistent<String> _toString;

Handle<Value> NilToString(const Arguments& args) {
  return String::Empty();
}

Handle<Value> NilInvoker(const Arguments& args) {
  return singleton;
}

Handle<Value> NilGetter(Local<String> property, const AccessorInfo& info) {
  if (property->Equals(_toString)) {
    return toString;
  } else {
    return singleton;
  }
}

Handle<Value> NilSetter(Local<String> property, Local<Value> value, const AccessorInfo& info) {
  return True();
}

Handle<Integer> NilQuery(Local<String> property, const AccessorInfo& info) {
  return Handle<Integer>();
}

Handle<Boolean> NilDeleter(Local<String> property, const AccessorInfo& info) {
  return True();
}

Handle<Array> NilEnumerator(const AccessorInfo& info) {
  return Array::New();
}


extern "C" void init(Handle<Object> target) {
  HandleScope scope;
  _toString = NODE_PSYMBOL("toString");
  toString = Persistent<Function>::New(FunctionTemplate::New(NilToString)->GetFunction());
  toString->SetName(_toString);
  toString->ForceDelete(String::NewSymbol("name"));
  toString->ForceDelete(String::NewSymbol("prototype"));
  toString->ForceDelete(String::NewSymbol("constructor"));
  toString->ForceDelete(String::NewSymbol("length"));
  toString->ForceDelete(String::NewSymbol("arguments"));
  toString->ForceDelete(String::NewSymbol("caller"));
  toString->Set(String::NewSymbol("call"), toString, DontEnum);
  toString->Set(String::NewSymbol("apply"), toString, DontEnum);
  toString->Set(String::NewSymbol("bind"), toString, DontEnum);

  Local<FunctionTemplate> tpl = FunctionTemplate::New();
  tpl->SetClassName(String::NewSymbol("Nil"));
  tpl->InstanceTemplate()->MarkAsUndetectable();
  tpl->InstanceTemplate()->Set(_toString, toString);
  tpl->InstanceTemplate()->SetNamedPropertyHandler(NilGetter, NilSetter, NilQuery, NilDeleter, NilEnumerator);
  tpl->InstanceTemplate()->SetCallAsFunctionHandler(NilInvoker);
  singleton = Persistent<Object>::New(tpl->GetFunction()->NewInstance());
  singleton->SetPrototype(Null());
  toString->SetPrototype(singleton);

  target->Set(String::NewSymbol("nil"), singleton);
}

NODE_MODULE(nil, init);
