var fs = require('fs'),
    path = require('path');

var name = 'nil';

var paths = [
  { build: true, path: ['build', 'Release'] },
  { build: false, path: ['prebuilt', process.version.slice(0, 4), process.platform, process.arch] },
  { build: true, path: [] }
];



if (process.env.npm_lifecycle_event === 'install' || process.env.npm_lifecycle_event === 'update') {
  runner(builder);
} else {
  runner(exporter);
}



function exporter(pathinfo){
  if (pathinfo.exists) {
    module.exports = require(pathinfo.path).nil;
    return true;
  }
}

function builder(pathinfo){
  if (!pathinfo.build) return;
  var PATH = process.env.PATH.split(process.platform === 'win32' ? ';' : ':'),
      script = process.platform === 'win32' ? 'node-gyp.cmd' : 'node-gyp',
      gyp;

  while (PATH.length) {
    if (fs.existsSync(gyp = path.join(PATH.pop(), script))) {
      require('child_process').spawn(gyp, ['rebuild'], {
        cwd: __dirname,
        env: process.env,
        stdio: 'inherit'
      });
      return true;
    }
  }
}

function runner(handler){
  for (var i=0; i < paths.length; i++) {
    paths[i].path = path.resolve(__dirname, paths[i].path.join('/'), name+'.node');
    paths[i].exists = fs.existsSync(paths[i].path);
    if (handler(paths[i])) return;
  }
  throw new Error('Bindings not found. Tried:\n [ '+paths.map(function(o){ return o.path }).join(',\n   ')+' ]');
}
