var cluster = require('cluster');
var fs = require('fs');
var domain = require('domain');

var thinkHttp = thinkRequire('HHttp');
var Dispatcher = thinkRequire('Dispatcher');


var App = module.exports = {};
/**
 * 根据http里的group和controller获取对应的controller实例
 * @param  {[type]} http [description]
 * @return {[type]}      [description]
 */
App.getBaseController = function(http, options, checkAction, ignoreCall){
    'use strict';
    options = options || {};
    var group = options.group || http.group;
    var controller = options.controller || http.controller;
    if (!controller) {
        return;
    }
    var instance;
    //如果是RESTFUL API，则调用RestController
    if (http.isRestful) {
        instance = thinkRequire('RestController')(http);
    }else{
        var path = THINK.APP_PATH + '/' + group + '/Controller/' + controller + 'Controller.js';
        instance = thinkRequire(path)(http);
    }

    if (!checkAction) {
        return instance;
    }
    var action = options.action || http.action;
    //action对应的方法或者call方法存在
    if (isFunction(instance[action + C('action_suffix')])) {
        return instance;
    }
    if (!ignoreCall && isFunction(instance[C('empty_method')])) {
        return instance;
    }
};

/**
 * 执行具体的action，调用前置和后置操作
 * @return {[type]} [description]
 */
App.execAction = function(controller, action, data, callMethod){
    'use strict';
    //action操作
    var act = action + C('action_suffix');
    var call = C('empty_method');
    var flag = false;
    if (callMethod && !isFunction(controller[act])) {
        if (call && isFunction(controller[call])) {
            flag = true;
        }
    }
    //action不存在
    if (!isFunction(controller[act]) && !flag) {
        return getPromise(new Error('action `' + action + '` not found.'), true);
    }
    //action不存在时执行魔术方法
    if(flag){
        return getPromise(controller[call](action));
    }
    //action前置操作
    var before = C('before_action');
    //action后置操作
    var after = C('after_action');

    var promise = getPromise();

    if (before && isFunction(controller[before + act])) {
        promise = getPromise(controller[before + act].apply(controller, data));
    }
    promise = promise.then(function(){
        return controller[act].apply(controller, data);
    });

    if (after && isFunction(controller[after + act])) {
        promise = promise.then(function(){
            return controller[after + act].apply(controller, data);
        })
    }
    return promise;
};

/**
 * 获取action的形参
 * @return {[type]} [description]
 */
App.getActionParams = function(fn, http){
    'use strict';
    //注释的正则
    var commentReg = /((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg;
    //获取形参的正则
    var parsReg = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var toString = fn.toString().replace(commentReg, '');
    var match = toString.match(parsReg)[1];
    if (!match) {
        return [];
    }
    match = match.split(/\s*,\s*/);
    //匹配到形参
    return match.map(function(item){
        return http.post[item] || http.get[item] || '';
    });
};
/**
 * 执行
 * @param  {[type]} http [description]
 * @return {[type]}      [description]
 */
App.exec = function(http){
    'use strict';
    var controller = this.getBaseController(http, {}, true);
    //group禁用或不存在或者controller不存在
    if (!controller) {
        var err = new Error('/' + http.group + '/Controller/' + http.controller + 'Controller' + ' not found.' + ' pathname is `' + http.pathname + '`');
        return getPromise(err, true);
    }
    var params;
    var actionFn = controller[http.action + C('action_suffix')];
    //参数绑定
    if (actionFn && C('url_params_bind')) {
        params = this.getActionParams(actionFn, http);
    }

    var self = this;
    var loadFile = function () {
        //加载分组函数
        if(isFile(THINK.APP_PATH + '/'+ http.group +'/Common/function.js')){
            thinkRequire(THINK.APP_PATH + '/'+ http.group +'/Common/function.js');
        }
        //加载分组配置
        if(isFile(THINK.APP_PATH + '/'+ http.group +'/Conf/config.js')){
            C(thinkRequire(THINK.APP_PATH + '/'+ http.group +'/Conf/config.js'));
        }
    };
    return getPromise(loadFile()).then(function () {
        return controller.__initReturn;
    }).then(function(){
        return self.execAction(controller, http.action, params, true);
    })
};
/**
 * 发送错误信息
 * @param  {[type]} error [description]
 * @return {[type]}       [description]
 */
App.sendError = function(http, error){
    'use strict';
    if (!error) {
        return;
    }
    var message = isError(error) ? error.stack : error;
    console.error(message);
    if (!http.res) {
        return;
    }
    http.res.statusCode = C('error_code') || 500;
    http.setHeader('Content-Type', 'text/html; charset=' + C('encoding'));
    if (THINK.APP_DEBUG) {
        http.res.end(message);
    }else{
        var readStream = fs.createReadStream(C('error_tpl_path'));
        readStream.pipe(http.res);
        readStream.on('end', function(){
            http.res.end();
        });
    }
};

/**
 * run
 * @return {[type]} [description]
 */
App.run = function(){
    'use strict';
    if (THINK.APP_MODE && App.mode[THINK.APP_MODE]) {
        return App.mode[THINK.APP_MODE]();
    }
    return App.mode.http();
};
/**
 * 不同模式下的run
 * @type {Object}
 */
App.mode = {
    //命令行模式
    cli: function(){
        'use strict';
        var defaultHttp = thinkHttp.getDefaultHttp(process.argv[2]);
        thinkHttp(defaultHttp.req, defaultHttp.res).run().then(App.listener);
        var cliTimeout = C('cli_timeout');
        //命令行模式下，超时后自动关闭
        if (cliTimeout) {
            setTimeout(function(){
                console.log('cli exec timeout');
                process.exit();
            }, cliTimeout * 1000);
        }
    },
    //HTTP模式
    http: function(){
        'use strict';
        var clusterNums = C('use_cluster');
        //不使用cluster
        if (!clusterNums) {
            return App.createServer();
        }
        //使用cpu的个数
        if (clusterNums === true) {
            clusterNums = require('os').cpus().length;
        }
        if (cluster.isMaster) {
            for (var i = 0; i < clusterNums; i++) {
                cluster.fork();
            }
            cluster.on('exit', function(worker) {
                console.error('worker ' + worker.process.pid + ' died');
                process.nextTick(function(){
                    cluster.fork();
                });
            });
        }else {
            App.createServer();
        }
    }
};
/**
 * 创建服务
 * @return {[type]} [description]
 */
App.createServer = function(){
    'use strict';
    var http = require('http');
    var server = http.createServer(function(request, response){
        try {
            thinkHttp(request, response).run().then(App.listener);
        } catch (err) {
            console.log(err.toString());
        }
    });

    if (C('use_websocket')) {
        thinkRequire('WebSocket')(server, App).run();
    }
    var host = C('host');
    var port = process.argv[2] || C('port');
    if (host) {
        server.listen(port, host);
    }else{
        server.listen(port);
    }
    if (THINK.APP_DEBUG) {
        console.log('Server running at http://' + (host || '127.0.0.1') + ':' + port + '/');
    }
};
/**
 * 监听回调函数
 * @param  {[type]} http [description]
 * @return {[type]}      [description]
 */
App.listener = function(http){
    'use strict';
    //自动发送thinkjs和版本的header
    http.setHeader('X-Powered-By', 'ThinkNode-' + THINK.THINK_VERSION);
    //禁止远程直接用带端口的访问,websocket下允许
    if (C('use_proxy') && http.host !== http.hostname && !http.websocket) {
        http.res.statusCode = 403;
        http.res.end();
        return getDefer().promise;
    }
    var domainInstance = domain.create();
    var deferred = getDefer();
    domainInstance.on('error', function(err){
        App.sendError(http, err);
        deferred.reject(err);
    });
    domainInstance.run(function(){
        return tag('app_init', http).then(function(){
            return Dispatcher(http).run();
        }).then(function(){
            return tag('app_begin', http);
        }).then(function(){
            return tag('action_init', http);
        }).then(function(){
            return App.exec(http);
        }).then(function(){
            return tag('app_end', http);
        }).catch(function(err){
            App.sendError(http, err);
        }).then(function(){
            deferred.resolve();
        })
    });
    return deferred.promise;
};