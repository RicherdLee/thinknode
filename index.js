/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/1/15
 */
var path = require('path');

if(!global.THINK){
    global.THINK = [];
}

if (!THINK.ROOT_PATH) {
    throw  new Error('global.THINK.ROOT_PATH must be defined');
}
//静态资源目录
if (THINK.RESOURCE_PATH === undefined) {
    THINK.RESOURCE_PATH = THINK.ROOT_PATH + '/www';
}

//应用目录
if (THINK.APP_PATH === undefined) {
    THINK.APP_PATH = THINK.ROOT_PATH + '/App';
}

//框架目录
if (THINK.THINK_PATH === undefined) {
    THINK.THINK_PATH = __dirname + '/lib';
}
//DEBUG模式
if (THINK.APP_DEBUG === undefined) {
    THINK.APP_DEBUG = false;
}
//框架核心目录
if (THINK.CORE_PATH === undefined) {
    THINK.CORE_PATH = THINK.THINK_PATH + '/Lib/Think';
}
//运行缓存目录
if (THINK.RUNTIME_PATH === undefined) {
    THINK.RUNTIME_PATH = THINK.ROOT_PATH + '/Runtime';
}

//日志目录
if (THINK.LOG_PATH === undefined) {
    THINK.LOG_PATH = THINK.RUNTIME_PATH + '/Logs';
}

//缓存目录
if (THINK.TEMP_PATH === undefined) {
    THINK.TEMP_PATH = THINK.RUNTIME_PATH + '/Temp';
}

if (THINK.DATA_PATH === undefined) {
    THINK.DATA_PATH = THINK.RUNTIME_PATH + '/Data';
}

if (THINK.CACHE_PATH === undefined) {
    THINK.CACHE_PATH = THINK.RUNTIME_PATH + '/Cache';
}


//线上环境自动关闭debug模式
if (process.argv[2] === 'online') {
    process.argv[2] = '';
    THINK.APP_DEBUG = false;
}
//node --debug index.js 来启动服务自动开启APP_DEBUG
if (!THINK.APP_DEBUG && process.execArgv.indexOf('--debug') > -1) {
    THINK.APP_DEBUG = true;
}

//运行模式
THINK.APP_MODE = THINK.APP_MODE || '';
//命令行模式
if (process.argv[2] && !(/^\d+$/.test(process.argv[2]))) {
    THINK.APP_MODE = 'cli';
}
// 加载核心Think类
if (process.execArgv.indexOf('--no-init') === -1) {
    //初始化
    require('./lib/Think.js').init();
    //启动应用
    if (process.execArgv.indexOf('--no-app') === -1) {
        thinkRequire('App').run();
    }
}
