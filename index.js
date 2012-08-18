var fs = require('fs'),
    path = require('path');

if ((module === process.mainModule || !process.mainModule) && fs.existsSync('./build/Release/nil.node')) {
  var nil = module.exports = require('./build/Release/nil.node').nil;
} else {
  var loc = path.resolve('./prebuilt', process.version.slice(0, 4), process.platform, process.arch, 'nil.node');
  if (fs.existsSync(loc)) {
    var nil = module.exports = require(loc).nil;
  }
}

