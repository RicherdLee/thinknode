/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/1/15
 */
'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');


var _alias = {};
var _autoload_callbacks = [];

/**
 * thinkRequire获取到的路径
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
global.getThinkRequirePath = function (name) {
    if (name in _alias) {
        return _alias[name];
    }
    var filepath, callback;
    for (var i = 0, length = _autoload_callbacks.length; i < length; i++) {
        callback = _autoload_callbacks[i];
        filepath = callback && callback(name);
        if (filepath) {
            //非debug模式下，将查找到文件路径缓存起来
            if (!global.THINK.APP_DEBUG) {
                _alias[name] = filepath;
            }
            return filepath;
        }
    }
    //非debug模式下，即使类文件不存在，也可以缓存起来
    //这样后续查找直接告知不存在，减少查找的过程
    if (!global.THINK.APP_DEBUG) {
        _alias[name] = '';
    }
    return '';
};
/**
 * 自定义的require, 加入别名功能
 * @type {[type]}
 */
global.thinkRequire = function (name) {
    //如果不是字符串则直接返回
    if (!isString(name)) {
        return name;
    }
    var path = name;
    if (path[0] !== '/') {
        path = getThinkRequirePath(name);
    }
    if (path) {
        var obj = require(path);
        if (isFunction(obj)) {
            //修正子类继承的方法获取到正确的文件名
            obj.prototype.__filename = path;
        }
        return obj;
    }
    return safeRequire(name);
};
/**
 * 注册require
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
global.registerAutoload = function (callback) {
    _autoload_callbacks.push(callback);
};

/**
 * 别名
 * @return {[type]} [description]
 */
global.aliasImport = function (alias, classFile) {
    if (isString(alias)) {
        _alias[alias] = classFile;
    } else {
        _alias = extend(_alias, alias);
    }
};
/**
 * 安全方式加载文件
 * @param  {[type]} file [description]
 * @return {[type]}      [description]
 */
global.safeRequire = function (file) {
    'use strict';
    try {
        return require(file);
    } catch (e) {
        //if (THINK.APP_DEBUG) {
        //    console.error(e.stack);
        //}
        return {};
    }
};

/**
 * Promise，后续Node.js会默认支持Promise，所以这里加个判断
 * @type {[type]}
 */
global.Promise = global.Promise || require('es6-promise').Promise;


/**
 * 动态创建一个类
 * 提供了继承、扩展、调用父级别方法等方法
 * @return {[type]} [description]
 */
global.Class = function (superCls, prop) {
    var cls = function () {
        function T(args) {
            for (var name in cls.__prop) {
                var val = cls.__prop[name];
                if (isObject(val)) {
                    this[name] = extend({}, val);
                } else if (isArray(val)) {
                    this[name] = extend([], val);
                } else {
                    this[name] = val;
                }
            }
            //自动执行init方法
            if (isFunction(this.init)) {
                //获取init返回值，如果返回一个promise，可以让后续执行在then之后
                this.__initReturn = this.init.apply(this, args);
            }
            return this;
        }

        T.prototype = cls.prototype;
        T.constructor = cls;
        return new T(arguments);
    };
    //类的属性，不放在原型上，实例化的时候调用
    cls.__prop = {};
    cls.extend = function (prop) {
        if (isFunction(prop)) {
            prop = prop();
        }
        if (isObject(prop)) {
            for (var name in prop) {
                var val = prop[name];
                if (isFunction(val)) {
                    this.prototype[name] = val;
                } else if (isObject(val)) {
                    cls.__prop[name] = extend({}, val);
                } else if (isArray(val)) {
                    cls.__prop[name] = extend([], val);
                } else {
                    cls.__prop[name] = val;
                }
            }
        }
        return this;
    };
    cls.inherits = function (superCls) {
        util.inherits(this, superCls);
        //将父级的属性复制到当前类上
        extend(cls.__prop, superCls.__prop);
        return this;
    };
    if (arguments.length === 1) {
        prop = superCls;
        superCls = undefined;
    }
    if (isFunction(superCls)) {
        cls.inherits(superCls);
    }
    //调用父级方法
    cls.prototype.super = cls.prototype.super_ = function (name, data) {
        //如果当前类没有这个方法，则直接返回。
        //用于在a方法调用父级的b方法
        if (!this[name]) {
            this.super_c = null;
            return;
        }
        var super_ = this.super_c ? this.super_c.super_ : this.constructor.super_;
        if (!super_) {
            this.super_c = null;
            return;
        }
        //如果父级没有这个方法，那么直接返回
        if (!isFunction(super_.prototype[name])) {
            this.super_c = null;
            return;
        }
        while (this[name] === super_.prototype[name] && super_.super_) {
            super_ = super_.super_;
        }
        this.super_c = super_;
        if (!this.super_t) {
            this.super_t = 1;
        }
        //如果参数不是数组，自动转为数组
        if (!isArray(data)) {
            data = arguments.length === 1 ? [] : [data];
        }
        var t = ++this.super_t;
        var method = super_.prototype[name];
        var ret;
        switch (data.length) {
            case 0:
                ret = method.call(this);
                break;
            case 1:
                ret = method.call(this, data[0]);
                break;
            case 2:
                ret = method.call(this, data[0], data[1]);
                break;
            default:
                ret = method.apply(this, data);
        }
        if (t === this.super_t) {
            this.super_c = null;
            this.super_t = 0;
        }
        return ret;
    };
    if (prop) {
        cls.extend(prop);
    }
    return cls;
};
/**
 * extend, from jquery，具有深度复制功能
 * @return {[type]} [description]
 */
global.extend = function () {
    var args = [].slice.call(arguments);
    var deep = true;
    var target = args.shift();
    if (isBoolean(target)) {
        deep = target;
        target = args.shift();
    }
    target = target || {};
    var length = args.length;
    var options, name, src, copy, copyAsArray, clone;
    for (var i = 0; i < length; i++) {
        options = args[i] || {};
        for (name in options) {
            src = target[name];
            copy = options[name];
            if (src && src === copy) {
                continue;
            }
            if (deep && copy && (isObject(copy) || (copyAsArray = isArray(copy) ))) {
                if (copyAsArray) {
                    copyAsArray = false;
                    clone = [];
                } else {
                    clone = src && isObject(src) ? src : {};
                }
                target[name] = extend(deep, clone, copy);
            } else {
                target[name] = copy;
            }
        }
    }
    return target;
};

//常用类的基类
['Cache', 'Behavior', 'Controller', 'Session', 'Model', 'Db', 'Service', 'Logic'].forEach(function (item) {
    global[item] = function (super_, obj) {
        if (isString(super_)) {
            var super_o = thinkRequire(super_);
            if (isEmpty(super_o)) {
                var mitem = super_.split('/');
                super_o = thinkRequire(THINK.APP_PATH + '/' + mitem[0] + '/' + item + '/' + mitem[1] + '.js');
                return Class(super_o, obj);
            } else {
                return Class(thinkRequire(super_), obj);
            }
        }
        return Class(thinkRequire(item), super_);
    };
});

/**
 * 实例化Controller类，可以调用一个具体的Action
 * A('Home/Index'), A('Admin/Index/test')
 * @param {[type]} name [description]
 */
global.A = function (name, http, data) {
    //将/转为:，兼容之前的方式
    name = name.replace(/\//g, ':').split(':');
    http.group = ucfirst(name[0]);
    http.controller = ucfirst(name[1]);
    var App = thinkRequire('App');
    var instance = App.getBaseController(http);
    var action = name[2];
    if (!instance) {
        return action ? getPromise(new Error(name.join(':') + ' is not found'), true) : instance;
    }
    if (!action) {
        return instance;
    }
    http.action = action;
    return getPromise(instance.__initReturn).then(function () {
        if (data && !isArray(data)) {
            data = [data];
        }
        return App.execAction(instance, action, data);
    })
};
/**
 * 调用一个指定的行为
 * @param {[type]} name [description]
 */
global.B = function (name, http, data) {
    if (!name) {
        return data;
    }
    if (typeof name === 'function') {
        return name(http, data);
    }
    return thinkRequire(name + 'Behavior')(http).run(data);
};

/**
 * 配置读取和写入
 */
var _config = {};
global.C = function (name, value) {
    //获取所有的配置
    if (arguments.length === 0) {
        return _config;
    }
    //清除所有的配置
    if (name === null) {
        _config = {};
        return;
    }
    if (isString(name)) {
        name = name.toLowerCase();
        //name里不含. 一级
        if (name.indexOf('.') === -1) {
            if (value === undefined) {
                return _config[name];
            }
            _config[name] = value;
            return;
        }
        //name中含有. 二级
        name = name.split('.');
        if (value === undefined) {
            value = _config[name[0]] || {};
            return value[name[1]];
        }
        if (!_config[name[0]]) {
            _config[name[0]] = {};
        }
        _config[name[0]][name[1]] = value;
    } else {
        _config = extend(false, _config, name);
    }
};
/**
 * 实例化模型
 */
global.D = function (name, layer, config) {
    if (!isString(name)) {
        return thinkRequire(name.__filename)(name.name, config);
    }
    if (isEmpty(layer)) {
        layer = 'Model';
    }
    if (isString(config) && config.slice(-5) === layer) {
        layer = config;
        config = arguments[3];
    }
    //支持目录
    name = name.split('/').map(function (item) {
        return item[0].toUpperCase() + item.slice(1);
    });

    var path = getThinkRequirePath(name[0] + layer);
    if (name[1]) {
        path = THINK.APP_PATH + '/' + name.join('/' + layer + '/') + layer + '.js';
        name[0] = name[1];
    }
    return thinkRequire(path)(name[0], config);
};
/**
 * 快速文件读取和写入
 * 默认写入到App/Runtime/Data目录下
 */
global.F = function (name, value, rootPath) {
    rootPath = rootPath || DATA_PATH;
    var filePath = rootPath + '/' + name + '.json';
    if (value !== undefined) {
        mkdir(path.dirname(filePath));
        fs.writeFileSync(filePath, JSON.stringify(value));
        chmod(filePath);
        return;
    }
    if (isFile(filePath)) {
        var content = getFileContent(filePath);
        if (content) {
            return JSON.parse(content);
        }
    }
    return false;
};
/**
 * 输入变量获取
 * @param name
 * @param http
 * @param defaultValue
 * @param filter
 * @constructor
 */
global.I = function (name, http, method, defaultValue, filter) {
    var value;
    if (!isEmpty(method)) {
        value = http.http[method];
    } else {
        if (http.isMethod("get")) {
            value = http.http.get;
        } else if (http.isMethod("post")) {
            value = http.http.post;
        } else {
            //PUT
        }
    }
    if (!isEmpty(name)) {
        value = value[name];
    }
    value = walkFilter(value, filter);// 参数过滤

    if (isEmpty(value)) {
        value = isEmpty(defaultValue) ? '' : defaultValue;
    }

    return value;
};
/**
 * 实例化模型基类
 * @param {[type]} name        [description]
 * @param {[type]} config      [description]
 */
global.M = function (name, config) {
    var model = 'Model';
    if (!isString(name)) {
        return thinkRequire(model)(undefined, name);
    }
    if (isString(config) && config.slice(-5) === model) {
        model = config;
        config = arguments[2];
    }
    return thinkRequire(model)(name, config)
};
/**
 * 缓存的设置和读取
 * 获取返回的是一个promise
 */
global.S = function (name, value, options) {
    if (isNumber(options)) {
        options = {timeout: options};
    } else if (options === true) {
        options = {type: true}
    }
    options = options || {};
    var type = options.type === undefined ? C('cache_type') : options.type;
    var cls = (type === true ? '' : ucfirst(type)) + 'Cache';
    var instance = thinkRequire(cls)(options);
    if (value === undefined) {//获取缓存
        return instance.get(name);
    } else if (value === null) {
        return instance.rm(name); //删除缓存
    } else if (isFunction(value)) { //获取缓存，如果不存在，则自动从回调里获取
        return instance.get(name).then(function (data) {
            return isEmpty(data) ? value() : getPromise(data, true);
        }).then(function (data) {
            return S(name, data, options).then(function () {
                return data;
            });
        }).catch(function (data) {
            return data;
        })
    } else {
        return instance.set(name, value, options.timeout);
    }
};
/**
 * 语言
 * @param {[type]} name [description]
 */
global.L = function (name) {
    return name;
};
/**
 * 调用接口服务
 * @param unknown_type name 接口名，跨模块使用  模块名/接口名
 * @param unknown_type arg  参数
 * @param unknown_type config  配置
 * @return Ambigous <>|Ambigous <object, NULL, mixed, unknown>
 */
global.X = function (name, arg, config) {
    'use strict';
    var layer = 'Service';
    if (!isString(name)) {
        return thinkRequire(name)(arg, config);
    }
    //支持目录
    name = name.split('/').map(function (item) {
        return item[0].toUpperCase() + item.slice(1);
    });
    var path = getThinkRequirePath(name[0] + layer);
    if (name[1]) {
        path = THINK.APP_PATH + '/' + name.join('/' + layer + '/') + layer + '.js';
    }
    return thinkRequire(path)(arg, config);
};
/**
 * 处理标签扩展
 * @return {[type]} [description]
 */
global.tag = function (name, http, data) {
    var tags = (C('tag.' + name) || []).slice();
    //tag处理的数据
    http.tag_data = data;
    if (!tags.length) {
        return getPromise(http.tag_data);
    }
    var index = 0;

    function runBehavior() {
        var behavior = tags[index++];
        if (!behavior) {
            return getPromise(http.tag_data);
        }
        var result = B(behavior, http, http.tag_data);
        return getPromise(result).then(function (data) {
            //如果返回值不是undefined，那么认为有返回值
            if (data !== undefined) {
                http.tag_data = data;
            }
            return runBehavior();
        })
    }

    return runBehavior();
};
//合并加载用户行为
global.loadTag = function (tag, userTag) {
    var mixTag = extend({}, tag);
    for (var key in userTag) {
        var value = userTag[key];
        if (!value.length) {
            continue;
        }
        mixTag[key] = mixTag[key] || [];
        if (isBoolean(value[0])) {
            var flag = value.shift();
            if (flag) { //true为替换系统标签
                mixTag[key] = value;
            } else { //false为将自定义标签置为系统标签前面
                mixTag[key] = value.concat(mixTag[key]);
            }
        } else {// 默认将用户标签置为系统标签后面
            mixTag[key] = mixTag[key].concat(value);
        }
    }
    //行为标签
    C('tag', mixTag);
};

/**
 * 值循环过滤，深度过滤
 * @param array 数组或对象(对象属性值可以为字符串或数组，不能为子对象;支持多重数组)
 * @param filter 过滤函数
 * @returns {*}
 */
global.walkFilter = function (array, filter) {
    if (isEmpty(filter)) {
        filter = "htmlspecialchars";
    }

    var _filter = thinkRequire(filter);
    var walkArray = function (arr) {
        var rst = [];
        arr.forEach(function (v) {
            if (isArray(v)) {
                rst.push(walkFilter(v));
            } else {
                rst.push(_filter(v));
            }
        });
        return rst;
    };

    var result = [], k = [];

    if (isObject(array)) {
        result = Object.values(array);
        var keys = function (array) {
            for (var key in array) {
                k.push(key);
            }
            return k;
        };
        return getObject(keys(array), walkArray(result));
    } else if (isArray(array)) {
        return walkArray(array);
    } else {
        return _filter(array);
    }
    ;
};