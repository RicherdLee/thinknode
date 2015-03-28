/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/1/15
 */
var fs = require('fs');
var cluster = require('cluster');

//自动加载进行识别的路径
var autoloadPaths = {};

module.exports = {
    run: function () {
        'use strict';
        //加载框架核心
        this.loadCore();
        //加载项目
        this.loadApp();
        //解析分组
        this.parseGroupList();
        //合并自动加载的路径
        this.mergeAutoloadPath();
        //注册自动加载
        registerAutoload(this.autoload);
        //debug模式
        if (THINK.APP_DEBUG) {
            this.debug();
        } else {
            this.processEvent();
            //记录日志
            this.log();
        }
        //记录进程的id
        this.logPid();
    },

    //加载框架核心
    loadCore: function () {
        'use strict';
        //加载框架函数
        require(THINK.THINK_PATH + '/Common/common.js');
        require(THINK.THINK_PATH + '/Common/function.js');
        //加载配置
        C(null); //移除之前的所有配置
        C(require(THINK.THINK_PATH + '/Conf/config.js'));
        //加载核心
        var core = {
            Controller: THINK.CORE_PATH + '/Controller.js',
            App: THINK.CORE_PATH + '/App.js',
            Behavior: THINK.CORE_PATH + '/Behavior.js',
            Cache: THINK.CORE_PATH + '/Cache.js',
            Db: THINK.CORE_PATH + '/Db.js',
            Dispatcher: THINK.CORE_PATH + '/Dispatcher.js',
            HHttp: THINK.CORE_PATH + '/Http.js',
            Log: THINK.CORE_PATH + '/Log.js',
            Model: THINK.CORE_PATH + '/Model.js',
            Session: THINK.CORE_PATH + '/Session.js',
            Think: THINK.CORE_PATH + '/Think.js',
            View: THINK.CORE_PATH + '/View.js',
            Cookie: THINK.CORE_PATH + '/Cookie.js',
            WebSocket: THINK.CORE_PATH + '/WebSocket.js'
        };
        aliasImport(core);

        //加载模式的配置文件
        if(THINK.APP_MODE){
            var modes = safeRequire(THINK.THINK_PATH + '/Conf/mode.js');
            if (modes[THINK.APP_MODE]) {
                C(modes[THINK.APP_MODE]);
            }
        }
        //自定义路由
        if (C('url_route_on') && isFile(THINK.THINK_PATH + '/Conf/route.js')) {
            C('url_route_rules', safeRequire(THINK.THINK_PATH + '/Conf/route.js'));
        }
        //别名文件
        if (isFile(THINK.THINK_PATH + '/Conf/alias.js')) {
            aliasImport(safeRequire(THINK.THINK_PATH + '/Conf/alias.js'));
        }
        //加载标签行为
        if (C('app_tag_on') && isFile(THINK.THINK_PATH + '/Conf/tag.js')) {
            C('tag', safeRequire(THINK.THINK_PATH + '/Conf/tag.js'));
        }

    },

    //加载项目公共文件
    loadApp: function () {
        'use strict';
        //加载项目公共函数
        if (isFile(THINK.APP_PATH + '/Common/Common/common.js')) {
            require(THINK.APP_PATH + '/Common/Common/common.js');
        }
        //加载项目公共配置
        if (isFile(THINK.APP_PATH + '/Common/Conf/config.js')) {
            C(safeRequire(THINK.APP_PATH + '/Common/Conf/config.js'));
        }
        //加载项目自定义路由
        if (C('url_route_on') && isFile(THINK.APP_PATH + '/Common/Conf/route.js')) {
            C('url_route_rules', safeRequire(THINK.APP_PATH + '/Common/Conf/route.js'));
        }
        //加载项目模式定义
        if(THINK.APP_MODE){
            if (isFile(THINK.APP_PATH + '/Common/conf/mode.js')) {
                var modes = safeRequire(THINK.APP_PATH + '/Common/conf/mode.js');
                if (modes[THINK.APP_MODE]) {
                    C(modes[THINK.APP_MODE]);
                }
            }
        }

        //加载项目别名
        if (isFile(THINK.APP_PATH + '/Common/Conf/alias.js')) {
            aliasImport(THINK.APP_PATH + '/Common/Conf/alias.js');
        }
        //加载项目标签
        if (isFile(THINK.APP_PATH + '/Common/Conf/tag.js')) {
            var userTag = require(THINK.APP_PATH + '/Common/Conf/tag.js');
            loadTag(C('tag'), userTag);
        }
    },

    /**
     * 合并框架自动加载的路径
     * @return {[type]} [description]
     */
    mergeAutoloadPath: function () {
        'use strict';
        var file = '__CLASS__.js';
        var sysAutoloadPath = {
            'Behavior': [
                THINK.THINK_PATH + '/Lib/Behavior/' + file,
                THINK.APP_PATH + '/Common/Behavior/' + file
            ],
            'Model': [
                THINK.THINK_PATH + '/Extend/Model/' + file,
                THINK.APP_PATH + '/Common/Model/' + file
            ],
            'Logic': [
                THINK.THINK_PATH + '/Lib/Logic/' + file,
                THINK.APP_PATH + '/Common/Logic/' + file
            ],
            'Service': [
                THINK.THINK_PATH + '/Lib/Service/' + file,
                THINK.APP_PATH + '/Common/Service/' + file
            ],
            'Controller': [
                THINK.THINK_PATH + '/Lib/Extend/Controller/' + file,
                THINK.APP_PATH + '/Common/Controller/' + file
            ],
            'Lang': [
                THINK.THINK_PATH + '/Lang/' + file,
                THINK.APP_PATH + '/Common/Lang/' + file
            ],
            'Cache': [
                THINK.THINK_PATH + '/Lib/Driver/Cache/' + file
            ],
            'Db': [
                THINK.THINK_PATH + '/Lib/Driver/Db/' + file
            ],
            'Template': [
                THINK.THINK_PATH + '/Lib/Driver/Template/' + file
            ],
            'Socket': [
                THINK.THINK_PATH + '/Lib/Driver/Socket/' + file
            ],
            'Session': [
                THINK.THINK_PATH + '/Lib/Driver/Session/' + file
            ],
            'Util': [
                THINK.THINK_PATH + '/Lib/Util/' + file
            ]
        };

        var autoloadPath = C('autoload_path');
        for (var type in autoloadPath) {
            var paths = autoloadPath[type];
            var override = false;
            if (!isArray(paths)) {
                paths = [paths];
            } else if (isBoolean(paths[0])) {
                override = paths.shift();
            }
            if (override) {
                sysAutoloadPath[type] = paths;
            } else {
                paths.push.apply(paths, sysAutoloadPath[type]);
                sysAutoloadPath[type] = paths;
            }
        }
        autoloadPaths = sysAutoloadPath;
    },

    /**
     * 解析分组列表
     * @return {[type]} [description]
     */
    parseGroupList: function () {
        'use strict';
        var filePath = THINK.APP_PATH;
        if (!isDir(filePath)) {
            var groupList = C('app_group_list').map(function (item) {
                return item.toLowerCase();
            });
            C('app_group_list', groupList);
            return;
        }
        var dirs = fs.readdirSync(filePath);
        //禁止分组列表
        var denyDirs = C('deny_group_list');
        if (!isEmpty(denyDirs)) {
            var length = denyDirs.length;
            var result = [];
            dirs.forEach(function (dir) {
                for (var i = 0; i < length; i++) {
                    if (dir.toLowerCase() === denyDirs[i].toLowerCase()) {
                        return;
                    }
                }
                result.push(dir.toLowerCase());
            });
            dirs = result;
        } else {
            dirs = dirs.map(function (item) {
                return item.toLowerCase();
            })
        }
        C('app_group_list', dirs);
    },

    /**
     * 自动加载机制，给thinkRequire使用
     * @param  {[type]} cls [description]
     * @return {[type]}     [description]
     */
    autoload: function (cls) {
        'use strict';
        for (var name in autoloadPaths) {
            if (cls.substr(0 - name.length) === name) {
                var list = autoloadPaths[name];
                for (var i = 0, len = list.length, item; i < len; i++) {
                    item = list[i].replace('__CLASS__', cls);
                    if (isFile(item)) {
                        return item;
                    }
                }
            }
        }
    },
    /**
     * 注册异常处理
     * @return {[type]} [description]
     */
    processEvent: function () {
        'use strict';
        process.on('uncaughtException', function (err) {
            console.error(isError(err) ? err.stack : err);
        });
    },
    //加载debug模式配置文件
    loadDebugFiles: function () {
        'use strict';
        //加载debug模式下的配置
        C(require(THINK.THINK_PATH + '/Conf/debug.js'));
        var debugFile = THINK.APP_PATH + '/Common/Conf/debug.js';
        if (isFile(debugFile)) {
            C(safeRequire(debugFile));
        }
        if (THINK.APP_MODE) {
            var modeFiles = [
                THINK.THINK_PATH + '/Conf/mode.js',
                THINK.APP_PATH + '/Common/Conf/mode.js'
            ];
            var self = this;
            modeFiles.forEach(function (file) {
                if (!isFile(file)) {
                    return;
                }
                var conf = safeRequire(file);
                var key = THINK.APP_MODE + '_debug';
                if (conf[key]) {
                    C(conf[key]);
                }
            });
        }
    },
    /**
     * debug模式下一些特殊处理
     * @return {[type]} [description]
     */
    debug: function () {
        'use strict';
        this.loadDebugFiles();
        //清除require的缓存
        if (C('clear_require_cache')) {
            //这些文件不清除缓存
            var self = this;
            setInterval(function () {
                var retainFiles = C('debug_retain_files');
                var fn = function (item) {
                    //windows目录定界符为\
                    if (process.platform === 'win32') {
                        item = item.replace(/\//g, '\\');
                    }
                    if (file.indexOf(item) > -1) {
                        return true;
                    }
                };
                for (var file in require.cache) {
                    var flag = retainFiles.some(fn);
                    if (!flag) {
                        require.cache[file] = null;
                    }
                }
                self.loadDebugFiles();
            }, 500);
        }
    },
    /**
     * 记录日志
     * @return {[type]} [description]
     */
    log: function () {
        'use strict';
        if (C('log_console')) {
            thinkRequire('Log')(C('log_console_path')).console();
        }
        if (C('log_memory')) {
            thinkRequire('Log')(C('log_memory_path')).memory();
        }
    },
    /**
     * 记录当前进程的id
     * 记录在Runtime/Data/app.pid文件里
     * @return {[type]} [description]
     */
    logPid: function () {
        'use strict';
        if (C('log_process_pid') && cluster.isMaster) {
            mkdir(THINK.RUNTIME_PATH);
            var pidFile = THINK.RUNTIME_PATH + '/app.pid';
            fs.writeFileSync(pidFile, process.pid);
            chmod(pidFile);
            //进程退出时删除该文件
            process.on('SIGTERM', function () {
                if (fs.existsSync(pidFile)) {
                    fs.unlinkSync(pidFile);
                }
                process.exit(0);
            });
        }
    }

};