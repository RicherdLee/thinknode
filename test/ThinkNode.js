var fs = require('fs');
var should = require('should');
var assert = require('assert');
var path = require('path');

var clearCache = function(){
  for(var name in require.cache){
    delete require.cache[name];
  }
}

describe('before', function(){
  it('before', function(){
    process.execArgv.push('--no-init');
  })
})
describe('think', function(){
  it(path.normalize(__dirname + '/../index.js'), function(done){
    global.THINK.APP_PATH = undefined;
    try{
      require(path.normalize(__dirname + '/../index.js'));
    }catch(e){
      assert.equal(e.message, 'THINK.APP_PATH must be defined');
      done();
    }
  })
  //it('RUNTIME_PATH', function(done){
  //  global.THINK.APP_PATH = __dirname;
  //  global.THINK.RUNTIME_PATH = undefined;
  //  clearCache()
  //  require(path.normalize(__dirname + '/../index.js'));
  //  assert.equal(global.THINK.RUNTIME_PATH, __dirname + '/Runtime')
  //  done();
  //})
  //it('APP_DEBUG', function(done){
  //  clearCache();
  //  global.APP_DEBUG = false;
  //  require(path.normalize(__dirname + '/../index.js'));
  //  assert.equal(APP_DEBUG, false);
  //  done();
  //})
  //it('APP_DEBUG true', function(done){
  //  global.APP_DEBUG = true;
  //  clearCache();
  //  require(path.normalize(__dirname + '/../index.js'));
  //  assert.equal(global.APP_DEBUG, true)
  //  done();
  //})
  //it('process.argv[2] = online', function(){
  //  process.argv[2] = 'online';
  //  global.APP_DEBUG = true;
  //  clearCache();
  //  require(path.normalize(__dirname + '/../index.js'));
  //  assert.equal(global.APP_DEBUG, false)
  //})
  //it('APP_DEBUG with execArgv', function(done){
  //  process.execArgv.push('--debug');
  //  clearCache();
  //  global.APP_DEBUG = false;
  //  require(path.normalize(__dirname + '/../index.js'));
  //  assert.equal(global.APP_DEBUG, true);
  //  done();
  //})
})

describe('after', function(){
  it('after', function(){
    process.execArgv = [];
  })
})
