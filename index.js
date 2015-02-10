/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/1/15
 */
var path = require('path');
global.THINK = [];
//网站根目录
THINK.ROOT_PATH = __dirname;
//定义APP的根目录
THINK.APP_PATH = THINK.ROOT_PATH + '/#App';
//定义框架目录
THINK.THINK_PATH = THINK.ROOT_PATH + '/#ThinkNode';
//定义缓存存放路径
THINK.RUNTIME_PATH = THINK.ROOT_PATH + '/#Runtime';
//开启调试模式，线上环境需要关闭调试功能
THINK.APP_DEBUG = true;
//加载框架
require(THINK.THINK_PATH + '/ThinkNode.js');