var fs = require('fs'),
    path = require('path');

var bindings = path.resolve('./build/Release/nil.node');
if (fs.existsSync(bindings)) {
  return module.exports = require(bindings).nil;
}

bindings = path.resolve('./prebuilt', process.version.slice(0, 4), process.platform, process.arch, 'nil.node');
if (fs.existsSync(bindings)) {
  return module.exports = require(bindings).nil;
}


if (process.env.npm_lifecycle_event === 'install') {
  var PATH = process.env.PATH.split(process.platform === 'win32' ? ';' : ';'),
      gyp = process.platform === 'win32' ? '/node-gyp.cmd' : '/node-gyp';

  gyp = PATH.reduce(function(found, file){
    return found || fs.existsSync(file = path.join(file, gyp)) ? file : null;
  }, null);

  if (gyp) {
    require('child_process').spawn(gyp, ['rebuild'], {
      cwd: __dirname,
      env: process.env,
      stdio: 'inherit'
    });
  }
}
