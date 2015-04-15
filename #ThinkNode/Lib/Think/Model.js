var util = require('util');
var querystring = require('querystring');
var Db = thinkRequire('Db');
var Filter = thinkRequire('Filter');
var Valid = thinkRequire('Valid');

//数据库实例化对象
var dbInstances = {};
//数据表的字段信息
var tableFieldsCache = {};

/**
 * Model类
 * @type {[type]}
 */
var Model = module.exports = Class(function () {
    'use strict';
    //解析page参数
    var parsePage = function (options) {
        if ('page' in options) {
            var page = options.page + '';
            var num = 0;
            if (page.indexOf(',') > -1) {
                page = page.split(',');
                num = parseInt(page[1], 10);
                page = page[0];
            }
            num = num || C('db_nums_per_page');
            page = parseInt(page, 10) || 1;
            return {
                page: page,
                num: num
            };
        }
        return {
            page: 1,
            num: C('db_nums_per_page')
        };
    };
    /**
     * 字符串命名风格转换
     * @param  {[type]} name [description]
     * @param  {[type]} type [description]
     * @return {[type]}      [description]
     */
    var parseName = function (name) {
        name = name.trim();
        if (!name) {
            return name;
        }
        //首字母如果是大写，转义为_x
        name = name[0].toLowerCase() + name.substr(1);
        return name.replace(/[A-Z]/g, function (a) {
            return '_' + a;
        });
    };


    return {
        // 当前数据库操作对象
        db: null,
        // 主键名称
        pk: 'id',
        // 数据库配置信息
        config: null,
        // 配置信息key
        configKey: '',
        // 模型名称
        name: '',
        // 数据表前缀
        tablePrefix: '',
        // 数据表名（不包含表前缀）
        tableName: '',
        // 实际数据表名（包含表前缀）
        trueTableName: '',
        // 数据表字段信息
        _fields: {},
        // 数据信息
        _data: {},
        // 参数
        _options: {},
        // 自定义字段信息，数据校验使用
        fields: {},
        //自动验证
        _validate: [],
        //自动完成
        _auto: [],
        /**
         * 初始化
         * @access public
         * @param string $name 模型名称
         * @param mixed config 数据库连接信息
         */
        init: function (name, config) {
            // 获取模型名称
            if (name) {
                this.name = name;
            }
            if (isString(config)) {
                config = {db_prefix: config};
            }
            this.config = config || {};

            //如果Model设置了实际数据库名，则需要将数据库名进行设置
            if (this.dbName) {
                this.config.db_name = this.dbName;
            }

            //数据表前缀
            if (this.config.db_prefix) {
                this.tablePrefix = this.config.db_prefix;
            } else if (!this.tablePrefix) {
                this.tablePrefix = C('db_prefix');
            }
        },
        /**
         * 初始化数据库连接
         * @return {[type]} [description]
         */
        initDb: function () {
            if (this.db) {
                return this.db;
            }
            var config = this.config;
            var configKey = md5(JSON.stringify(config));
            if (!dbInstances[configKey]) {
                dbInstances[configKey] = Db.getInstance(config);
            }
            this.db = dbInstances[configKey];
            this.configKey = configKey;
            return this.db;
        },
        /**
         * 获取模型名
         * @access public
         * @return string
         */
        getModelName: function () {
            if (this.name) {
                return this.name;
            }
            var filename = this.__filename || __filename;
            var last = filename.lastIndexOf('/');
            this.name = filename.substr(last + 1, filename.length - last - 9);
            return this.name;
        },
        /**
         * 获取表名
         * @return {[type]} [description]
         */
        getTableName: function () {
            if (!this.trueTableName) {
                var tableName = this.tablePrefix || '';
                tableName += this.tableName || parseName(this.getModelName());
                this.trueTableName = tableName.toLowerCase();
            }
            return this.trueTableName;
        },
        /**
         * 获取数据表信息
         * @access protected
         * @return Promise
         */
        getTableFields: function (table, all) {
            this.initDb();
            if (table === true) {
                table = undefined;
                all = true;
            }
            if (!isEmpty(this._fields)) {
                return getPromise(all ? this._fields : this._fields._field);
            }
            var tableName = table || this.getTableName();
            var fields = tableFieldsCache[tableName];
            if (!isEmpty(fields)) {
                this._fields = fields;
                return getPromise(all ? fields : fields._field);
            }
            var self = this;
            //从数据表里查询字段信息
            return this.flushFields(tableName).then(function (fields) {
                self._fields = fields;
                if (C('db_fields_cache')) {
                    tableFieldsCache[tableName] = fields;
                }
                return getPromise(all ? fields : fields._field);
            });
        },
        /**
         * 获取数据表信息
         * @param  {[type]} table [description]
         * @return Promise       [description]
         */
        flushFields: function (table) {
            table = table || this.getTableName();
            return this.initDb().getFields(table).then(function (data) {
                var fields = {
                    '_field': Object.keys(data),
                    '_autoinc': false,
                    '_unique': []
                };
                var types = {};
                for (var key in data) {
                    var val = data[key];
                    types[key] = val.type;
                    if (val.primary) {
                        fields._pk = key;
                        if (val.autoinc) {
                            fields._autoinc = true;
                        }
                    } else if (val.unique) {
                        fields._unique.push(key);
                    }
                }
                fields._type = types;
                return fields;
            })
        },
        /**
         * 根据数据获取类型为唯一的字段
         * @return {[type]} [description]
         */
        getUniqueField: function (data) {
            if (!data) {
                return this._fields._unique[0];
            }
            var fields = this._fields._unique;
            for (var i = 0, length = fields.length; i < length; i++) {
                if (data[fields[i]]) {
                    return fields[i];
                }
            }
        },
        /**
         * 获取上一次操作的sql
         * @return {[type]} [description]
         */
        getLastSql: function () {
            return this.initDb().getLastSql();
        },
        /**
         * 获取主键名称
         * @access public
         * @return string
         */
        getPk: function () {
            //如果fields为空，那么异步去获取
            if (isEmpty(this._fields)) {
                var self = this;
                return this.getTableFields().then(function () {
                    return self._fields._pk || self.pk;
                })
            }
            return this._fields._pk || this.pk;
        },
        /**
         * 缓存
         * @param  {[type]} key    [description]
         * @param  {[type]} expire [description]
         * @param  {[type]} type   [description]
         * @return {[type]}        [description]
         */
        cache: function (key, timeout) {
            if (key === undefined) {
                return this;
            }
            var options = this._getCacheOptions(key, timeout);
            this._options.cache = options;
            return this;
        },
        /**
         * 获取缓存的选项
         * @param  {[type]} key     [description]
         * @param  {[type]} timeout [description]
         * @return {[type]}         [description]
         */
        _getCacheOptions: function (key, timeout, type) {
            if (isObject(key)) {
                return key;
            }
            if (isNumber(key)) {
                timeout = key;
                key = '';
            }
            //如果key为true，那么使用sql的md5值
            if (key === true) {
                key = '';
            }
            var cacheType = type === undefined ? C('db_cache_type') : type;
            var options = {
                key: key,
                timeout: timeout || C('db_cache_timeout'),
                type: cacheType,
                gcType: 'dbCache'
            };
            if (cacheType === 'File') {
                options.cache_path = C('db_cache_path');
            }
            return options;
        },
        /**
         * 指定查询数量
         * @param  {[type]} offset [description]
         * @param  {[type]} length [description]
         * @return {[type]}        [description]
         */
        limit: function (offset, length) {
            if (offset === undefined) {
                return this;
            }
            this._options.limit = length === undefined ? offset : offset + ',' + length;
            return this;
        },
        /**
         * 自动验证
         * @param data
         * @param type
         * @returns {*}
         * @private
         */
        _autoValidation: function (data, type) {
            var self = this;
            //解析_validate规则
            //验证字段,验证规则[,附加规则],错误提示[,验证时间 1新增 2编辑 null新增和编辑]
            /*this._validate = [
             {name: "email", valid: "email", msg: "email不合法",type: 1},
             {name: "pwd", valid: ["length"], length_args: [6, 20], msg:"密码长度不合法" ,type: 2},
             {name: "url", valid: "required", msg: "url必填"},
             {name: "username", valid: "function",func_name:"checkName", msg: "username不合法"}
             ];*/
            if (!isEmpty(this._validate)) {
                var promises = this._validate.map(function (validate) {
                    if (isEmpty(validate.name)) {
                        return true;
                    } else {
                        validate.type = validate.type || type;
                        if (validate.valid == 'function') {
                            if (validate.type === type) {
                                if (self[validate.func_name](data) === false) {
                                    return getObject(validate.name, validate.msg);
                                } else {
                                    return true;
                                }
                            } else {
                                return true;
                            }
                        } else {
                            //此处修改为字段存在才验证
                            //if(isEmpty(data[validate.name]) && validate.valid !== 'required'){
                            if (validate.name in data) {
                                if (validate.type === type) {
                                    //删除type属性兼容Vaild类
                                    delete validate.type;
                                    validate.value = data[validate.name];

                                    return Valid(validate);
                                } else {
                                    return true;
                                }
                            } else {
                                return true;
                            }
                        }
                    }

                });

                return Promise.all(promises).then(function (status) {
                    for (var name in status) {
                        if (!isEmpty(status[name]) && status[name] !== true) {
                            return Object.values(status[name]);
                        }
                    }
                    return true;
                }).catch(function (e) {
                    return getPromise({"errmsg": e});
                });
            } else {
                return getPromise(true);
            }

        },
        /**
         * 自动完成
         * @param data
         * @param type
         * @private
         */
        _autoOperation: function (data, type) {
            var self = this;
            //解析完成规则
            //字段,自动填写的值[,完成时间 1新增 2编辑 null新增和编辑]
            /*this._auto = [
             {name: "email", value: "xxx@xxx.cn", type: 1},
             {name: "username", value: "admin", type: 2},
             {name: "url", value: 'http://xxx.com'},
             {name: "username", value: "function",func_name:"autoName"}
             ];*/
            if (!isEmpty(this._auto)) {
                var data = extend({}, data);
                var promises = this._auto.map(function (auto) {
                    if (isEmpty(auto.name)) {
                        return;
                    }
                    auto.type = auto.type || type;
                    if (auto.type !== type) {
                        return;
                    }
                    if (auto.value === 'function' && auto.func_name !== undefined) {
                        //自定义方法内没有定义返回结果,data内不增加此属性
                        return getPromise(self[auto.func_name](data)).then(function (fvalue) {
                            if (fvalue !== undefined) {
                                data[auto.name] = fvalue;
                            }
                        });
                    } else {
                        data[auto.name] = auto.value;
                    }
                });

                return Promise.all(promises).then(function () {
                    return data;
                }).catch(function (e) {
                    return getPromise({"errmsg": e});
                });
            } else {
                return data;
            }
        },
        /**
         * 指定分页
         * @return {[type]} [description]
         */
        page: function (page, listRows) {
            if (page === undefined) {
                return this;
            }
            this._options.page = listRows === undefined ? page : page + ',' + listRows;
            return this;
        },
        /**
         * where条件
         * @return {[type]} [description]
         */
        where: function (where, ignoreValue) {
            if (!where) {
                return this;
            }
            if (isString(where)) {
                where = {_string: where};
            } else if (ignoreValue !== undefined) {
                where = Filter.ignore(where, ignoreValue);
            }
            this._options.where = extend(this._options.where || {}, where);
            return this;
        },
        /**
         * 要查询的字段
         * @param  {[type]} field   [description]
         * @param  {[type]} reverse [description]
         * @return {[type]}         [description]
         */
        field: function (field, reverse) {
            if (isArray(field)) {
                field = field.join(',');
            } else if (!field) {
                field = '*';
            }
            this._options.field = field;
            this._options.fieldReverse = reverse;
            return this;
        },
        /**
         * 设置表名
         * @param  {[type]} table [description]
         * @return {[type]}       [description]
         */
        table: function (table, hasPrefix) {
            if (!table) {
                return this;
            }
            table = table.trim();
            if (table.indexOf(' ') > -1) {
                hasPrefix = true;
            }
            this._options.table = hasPrefix ? table : this.tablePrefix + table;
            return this;
        },
        /**
         * 联合查询
         * @return {[type]} [description]
         */
        union: function (union, all) {
            if (!union) {
                return this;
            }
            if (!this._options.union) {
                this._options.union = [];
            }
            this._options.union.push({
                union: union,
                all: all
            });
            return this;
        },
        /**
         * .join({
     *   'xxx': {
     *     join: 'left',
     *     as: 'c',
     *     on: ['id', 'cid']
     *   }
     * })
         * 联合查询
         * @param  {[type]} join [description]
         * @return {[type]}      [description]
         */
        join: function (join) {
            if (!join) {
                return this;
            }
            if (!this._options.join) {
                this._options.join = [];
            }
            if (isArray(join)) {
                this._options.join = this._options.join.concat(join);
            } else {
                this._options.join.push(join);
            }
            return this;
        },
        /**
         * 生成查询SQL 可用于子查询
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        buildSql: function (options) {
            var self = this;
            return this.parseOptions(options).then(function (options) {
                return '( ' + self.db.buildSelectSql(options).trim() + ' )';
            });
        },
        /**
         * 解析参数
         * @param  {[type]} options [description]
         * @return promise         [description]
         */
        parseOptions: function (oriOpts, extraOptions) {
            var options;
            if (isScalar(oriOpts)) {
                options = extend({}, this._options);
            } else {
                options = extend({}, this._options, oriOpts, extraOptions);
            }
            //查询过后清空sql表达式组装 避免影响下次查询
            this._options = {};
            //获取表名
            var table = options.table = options.table || this.getTableName();
            //表前缀，Db里会使用
            options.tablePrefix = this.tablePrefix;
            options.model = this.getModelName();
            //数据表别名
            if (options.alias) {
                options.table += ' AS ' + options.alias;
            }
            var promise = this.getTableFields(table).then(function (fields) {
                if (isScalar(oriOpts)) {
                    options = extend(options, self.parseWhereOptions(oriOpts), extraOptions);
                }
                return fields;
            });
            var self = this;
            return promise.then(function (fields) {
                // 字段类型验证
                if (isObject(options.where) && !isEmpty(fields)) {
                    var keyReg = /[\.\|\&]/;
                    // 对数组查询条件进行字段类型检查
                    for (var key in options.where) {
                        var val = options.where[key];
                        key = key.trim();
                        if (fields.indexOf(key) > -1) {
                            if (isScalar(val) || !val) {
                                options.where[key] = self.parseType(options.where, key)[key];
                            }
                        } else if (key[0] !== '_' && !keyReg.test(key)) { //字段名不合法，报错
                            return getPromise(new Error('field `' + key + '` in where condition is not valid'), true);
                        }
                    }
                }
                //field反选
                if (options.field && options.fieldReverse) {
                    //fieldReverse设置为false
                    options.fieldReverse = false;
                    var optionsField = options.field.split(',');
                    options.field = fields.filter(function (item) {
                        if (optionsField.indexOf(item) > -1) {
                            return;
                        }
                        return item;
                    }).join(',');
                }
                return self._optionsFilter(options, fields);
            });
        },
        /**
         * 选项过滤器
         * 具体的Model类里进行实现
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        _optionsFilter: function (options) {
            return options;
        },
        /**
         * 数据类型检测
         * @param  {[type]} data [description]
         * @param  {[type]} key  [description]
         * @return {[type]}      [description]
         */
        parseType: function (data, key) {
            var fieldType = this._fields._type[key] || '';
            if (fieldType.indexOf('bigint') === -1 && fieldType.indexOf('int') > -1) {
                data[key] = parseInt(data[key], 10) || 0;
            } else if (fieldType.indexOf('double') > -1 || fieldType.indexOf('float') > -1) {
                data[key] = parseFloat(data[key]) || 0.0;
            } else if (fieldType.indexOf('bool') > -1) {
                data[key] = !!data[key];
            }
            return data;
        },
        /**
         * 对插入到数据库中的数据进行处理，要在parseOptions后执行
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        parseData: function (data) {
            //因为会对data进行修改，所以这里需要深度拷贝
            data = extend({}, data);
            var key;
            if (!isEmpty(this._fields)) {
                for(key in data){
                    var val = data[key];
                    if (this._fields._field.indexOf(key) === -1) {
                        delete data[key];
                    }else if(isScalar(val)){
                        //data = this.parseType(data, key);
                    }
                }
            }
            //安全过滤
            if (isFunction(this._options.filter)) {
                for(key in data){
                    var ret = this._options.filter.call(this, key, data[key]);
                    if (ret === undefined) {
                        delete data[key];
                    }else{
                        data[key] = ret;
                    }
                }
                delete this._options.filter;
            }
            data = this._dataFilter(data);
            return data;
        },
        /**
         * 数据过滤器
         * 具体的Model类里进行实现
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        _dataFilter: function (data) {
            return data;
        },
        /**
         * 数据插入之前操作，可以返回一个promise
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        _beforeAdd: function (data) {
            return data;
        },
        /**
         * 数据插入之后操作，可以返回一个promise
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        _afterAdd: function (data) {
            return data;
        },
        /**
         * 添加一条数据
         * @param {[type]} data    [description]
         * @param {[type]} options [description]
         * @param int 返回插入的id
         */
        add: function (data, options, replace) {
            if (options === true) {
                replace = true;
                options = {};
            }
            //copy data
            data = extend({}, this._data, data);
            this._data = {};
            if (isEmpty(data)) {
                return getPromise(new Error('_DATA_TYPE_INVALID_'), true);
            }
            var self = this;
            //解析后的选项
            var parsedOptions = {};
            //解析后的数据
            var parsedData = {};
            //自动完成和自动验证
            return Promise.all([this._autoValidation(data, 1), this._autoOperation(data, 1)]).then(function (result) {
                if (result[0] !== true) {
                    return getPromise(new Error(result[0]), true);
                } else if (result[1].errmsg !== undefined) {
                    return getPromise(new Error('_DATA_AUTO_OPERATION_INVALID_'), true);
                } else {
                    data = result[1];
                    return self.parseOptions(options).then(function (options) {
                        parsedOptions = options;
                        return self._beforeAdd(data, parsedOptions);
                    }).then(function (data) {
                        parsedData = data;
                        data = self.parseData(data);
                        return self.db.insert(data, parsedOptions, replace);
                    }).then(function () {
                        parsedData[self.getPk()] = self.db.getLastInsertId();
                        return self._afterAdd(parsedData, parsedOptions);
                    }).then(function () {
                        return parsedData[self.getPk()];
                    });
                }
            });

        },
        /**
         * 如果当前条件的数据不存在，才添加
         * @param  {[type]} data      要插入的数据
         * @param  {[type]} where      where条件
         * @param  boolean returnType 返回值是否包含type
         * @return {[type]}            promise
         */
        thenAdd: function (data, where, returnType) {
            if (where === true) {
                returnType = true;
                where = '';
            }
            var self = this;
            return this.where(where).find().then(function (findData) {
                if (!isEmpty(findData)) {
                    var idValue = findData[self.getPk()];
                    return returnType ? {id: idValue, type: 'exist'} : idValue;
                }
                return self.add(data).then(function (insertId) {
                    return returnType ? {id: insertId, type: 'add'} : insertId;
                });
            });
        },
        /**
         * 插入多条数据
         * @param {[type]} data    [description]
         * @param {[type]} options [description]
         * @param {[type]} replace [description]
         */
        addAll: function (data, options, replace) {
            if (!isArray(data) || !isObject(data[0])) {
                return getPromise(new Error('_DATA_TYPE_INVALID_'), true);
            }
            if (options === true) {
                replace = true;
                options = {};
            }
            var self = this;
            var promises = data.map(function (item) {
                return self.add(item, options, replace);
            });

            return Promise.all(promises);
        },
        /**
         * 删除后续操作
         * @return {[type]} [description]
         */
        _afterDelete: function (data) {
            return data;
        },
        /**
         * 删除数据
         * @return {[type]} [description]
         */
        delete: function (options) {
            var self = this;
            var parsedOptions = {};
            var affectedRows = 0;
            return this.parseOptions(options).then(function (options) {
                parsedOptions = options;
                return self.db.delete(options);
            }).then(function (rows) {
                affectedRows = rows;
                return self._afterDelete(parsedOptions.where || {}, parsedOptions);
            }).then(function () {
                return affectedRows;
            })
        },
        /**
         * 更新前置操作
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        _beforeUpdate: function (data) {
            return data;
        },
        /**
         * 更新后置操作
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        _afterUpdate: function (data) {
            return data;
        },
        /**
         * 更新数据
         * @return {[type]} [description]
         */
        update: function (data, options) {
            data = extend({}, this._data, data);
            this._data = {};
            if (isEmpty(data)) {
                return getPromise(new Error('_DATA_TYPE_INVALID_'), true);
            }
            var self = this;
            var parsedOptions = {};
            var parsedData = {};
            var affectedRows = 0;
            //自动完成和自动验证
            return Promise.all([this._autoValidation(data, 2), this._autoOperation(data, 2)]).then(function (result) {
                if (result[0] !== true) {
                    return getPromise(new Error(result[0]), true);
                } else if (result[1].errmsg !== undefined) {
                    return getPromise(new Error('_DATA_AUTO_OPERATION_INVALID_'), true);
                } else {
                    data = result[1];
                    return self.parseOptions(options).then(function (options) {
                        parsedOptions = options;
                        return self._beforeUpdate(data, options);
                    }).then(function (data) {
                        var pk = self.getPk();
                        parsedData = data;
                        data = self.parseData(data);
                        if (isEmpty(parsedOptions.where)) {
                            // 如果存在主键数据 则自动作为更新条件
                            if (!isEmpty(data[pk])) {
                                parsedOptions.where = getObject(pk, data[pk]);
                                delete data[pk];
                            } else {
                                return getPromise(new Error('_OPERATION_WRONG_'), true);
                            }
                        } else {
                            parsedData[pk] = parsedOptions.where[pk];
                        }
                        return self.db.update(data, parsedOptions);
                    }).then(function (rows) {
                        affectedRows = rows;
                        return self._afterUpdate(parsedData, parsedOptions);
                    }).then(function () {
                        return affectedRows;
                    });
                }
            });
        },
        /**
         * 更新多个数据，自动用主键作为查询条件
         * @param  {[type]} dataList [description]
         * @return {[type]}          [description]
         */
        updateAll: function (dataList) {
            if (!isArray(dataList) || !isObject(dataList[0])) {
                return getPromise(new Error('_DATA_TYPE_INVALID_'), true);
            }
            var self = this;
            var promises = dataList.map(function (data) {
                return self.update(data);
            });
            return Promise.all(promises);
        },
        /**
         * 更新某个字段的值
         * @param  {[type]} field [description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        updateField: function (field, value) {
            var data = {};
            if (isObject(field)) {
                data = field;
            } else {
                data[field] = value;
            }
            return this.update(data);
        },
        /**
         * 字段值增长
         * @return {[type]} [description]
         */
        updateInc: function (field, step) {
            step = parseInt(step, 10) || 1;
            return this.updateField(field, ['exp', field + '+' + step]);
        },
        /**
         * 字段值减少
         * @return {[type]} [description]
         */
        updateDec: function (field, step) {
            step = parseInt(step, 10) || 1;
            return this.updateField(field, ['exp', field + '-' + step]);
        },
        /**
         * 解析options中简洁的where条件
         * @return {[type]} [description]
         */
        parseWhereOptions: function (options) {
            if (isNumber(options) || isString(options)) {
                var pk = this.getPk();
                options += '';
                var where = {};
                if (options.indexOf(',') > -1) {
                    where[pk] = ['IN', options];
                } else {
                    where[pk] = options;
                }
                options = {
                    where: where
                };
            }
            return options || {};
        },
        /**
         * find查询后置操作
         * @return {[type]} [description]
         */
        _afterFind: function (result) {
            return result;
        },
        /**
         * 查询一条数据
         * @return 返回一个promise
         */
        find: function (options) {
            var self = this;
            var parsedOptions = {};
            return this.parseOptions(options, {limit: 1}).then(function (options) {
                parsedOptions = options;
                return self.db.select(options);
            }).then(function (data) {
                return self._afterFind(data[0] || {}, parsedOptions);
            });
        },
        /**
         * 查询后置操作
         * @param  {[type]} result  [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        _afterSelect: function (result) {
            return result;
        },
        /**
         * 查询数据
         * @return 返回一个promise
         */
        select: function (options) {
            var self = this;
            var parsedOptions = {};
            return this.parseOptions(options).then(function (options) {
                parsedOptions = options;
                return self.db.select(options);
            }).then(function (result) {
                return self._afterSelect(result, parsedOptions);
            });
        },
        /**
         * 返回数据里含有count信息的查询
         * @param  options  查询选项
         * @param  pageFlag 当页面不合法时的处理方式，true为获取第一页，false为获取最后一页，undefined获取为空
         * @return promise
         */
        countSelect: function (options, pageFlag) {
            if (isBoolean(options)) {
                pageFlag = options;
                options = {};
            }
            var self = this;
            //解析后的options
            var parsedOptions = {};
            var result = {};
            return this.parseOptions(options).then(function (options) {
                //delete options.table;
                parsedOptions = options;
                return self.options({
                    //where: options.where,
                    //cache: options.cache,
                    //join: options.join,
                    //alias: options.alias
                    alias: options.alias,
                    table: options.table,
                    group: options.group
                }).count((options.alias || self.getTableName()) + '.' + self.getPk());
            }).then(function (count) {
                var pageOptions = parsePage(parsedOptions);
                var totalPage = Math.ceil(count / pageOptions.num);
                if (isBoolean(pageFlag)) {
                    if (pageOptions.page > totalPage) {
                        pageOptions.page = pageFlag === true ? 1 : totalPage;
                    }
                    parsedOptions.page = pageOptions.page + ',' + pageOptions.num;
                }
                result = extend({count: count, total: totalPage}, pageOptions);
                if (!parsedOptions.page) {
                    parsedOptions.page = pageOptions.page;
                }
                return self.select(parsedOptions);
            }).then(function (data) {
                result.data = data;
                return result;
            });
        },
        /**
         * 获取某个字段下的记录
         * @return {[type]} [description]
         */
        getField: function (field, one) {
            var self = this;
            return this.parseOptions({'field': field}).then(function (options) {
                if (isNumber(one)) {
                    options.limit = one;
                } else if (one === true) {
                    options.limit = 1;
                }
                return self.db.select(options);
            }).then(function (data) {
                var multi = field.indexOf(',') > -1;
                if (multi) {
                    var fields = field.split(/\s*,\s*/);
                    var result = {};
                    fields.forEach(function (item) {
                        result[item] = [];
                    })
                    data.every(function (item) {
                        fields.forEach(function (fItem) {
                            if (one === true) {
                                result[fItem] = item[fItem];
                            } else {
                                result[fItem].push(item[fItem]);
                            }
                        })
                        return one !== true;
                    })
                    return result;
                } else {
                    data = data.map(function (item) {
                        return Object.values(item)[0];
                    })
                    return one === true ? data[0] : data;
                }
            });
        },
        /**
         * 根据某个字段值获取一条数据
         * @param  {[type]} name  [description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        getBy: function (name, value) {
            var where = getObject(name, value);
            return this.where(where).find();
        },
        /**
         * SQL查询
         * @return {[type]} [description]
         */
        query: function (sql, parse) {
            if (parse !== undefined && !isBoolean(parse) && !isArray(parse)) {
                parse = [].slice.call(arguments, 1);
            }
            var self = this;
            sql = this.parseSql(sql, parse);
            return this.initDb().select(sql, this._options.cache).then(function (data) {
                self._options = {};
                return data;
            });
        },
        /**
         * 执行SQL语法，非查询类的SQL语句，返回值为影响的行数
         * @param  {[type]} sql   [description]
         * @param  {[type]} parse [description]
         * @return {[type]}       [description]
         */
        execute: function (sql, parse) {
            if (parse !== undefined && !isBoolean(parse) && !isArray(parse)) {
                parse = [].slice.call(arguments, 1);
            }
            sql = this.parseSql(sql, parse);
            return this.initDb().execute(sql);
        },
        /**
         * 解析SQL语句
         * @return promise [description]
         */
        parseSql: function (sql, parse) {
            if (parse === undefined) {
                parse = [];
            } else if (!isArray(parse)) {
                parse = [parse];
            }
            parse.unshift(sql);
            sql = util.format.apply(null, parse);
            var map = {
                '__TABLE__': '`' + this.getTableName() + '`'
            };
            var self = this;
            sql = sql.replace(/__([A-Z]+)__/g, function (a, b) {
                return map[a] || ('`' + self.tablePrefix + b.toLowerCase() + '`');
            });
            return sql;
        },
        /**
         * 启动事务
         * @return {[type]} [description]
         */
        startTrans: function () {
            var self = this;
            return this.initDb().commit().then(function () {
                return self.db.startTrans();
            });
        },
        /**
         * 提交事务
         * @return {[type]} [description]
         */
        commit: function () {
            return this.initDb().commit();
        },
        /**
         * 回滚事务
         * @return {[type]} [description]
         */
        rollback: function () {
            return this.initDb().rollback();
        },
        /**
         * 设置数据对象值
         * @return {[type]} [description]
         */
        data: function (data) {
            if (data === true) {
                return this._data;
            }
            if (isString(data)) {
                data = querystring.parse(data);
            }
            this._data = data;
            return this;
        },
        /**
         * 设置操作选项
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        options: function (options) {
            if (options === true) {
                return this._options;
            }
            this._options = options;
            return this;
        },
        /**
         * 关闭数据库连接
         * @return {[type]} [description]
         */
        close: function () {
            delete dbInstances[this.configKey];
            if (this.db) {
                this.db.close();
                this.db = null;
            }
        }
    };
}).extend(function () {
    'use strict';
    //追加的方法
    var methods = {};
    // 链操作方法列表
    var methodNameList = [
        'order', 'alias', 'having', 'group',
        'lock', 'auto', 'filter', 'validate'
    ];
    methodNameList.forEach(function (item) {
        methods[item] = function (data) {
            this._options[item] = data;
            return this;
        };
    });
    methods.distinct = function (data) {
        this._options.distinct = data;
        //如果传过来一个字段，则映射到field上
        if (isString(data)) {
            this._options.field = data;
        }
        return this;
    };
    ['count', 'sum', 'min', 'max', 'avg'].forEach(function (item) {
        methods[item] = function (field) {
            field = field || this.pk;
            return this.getField(item.toUpperCase() + '(' + field + ') AS thinkjs_' + item, true);
        };
    });
    //方法别名
    var aliasMethodMap = {
        update: 'save',
        updateField: 'setField',
        updateInc: 'setInc',
        updateDec: 'setDec'
    };
    Object.keys(aliasMethodMap).forEach(function (key) {
        var value = aliasMethodMap[key];
        methods[value] = function () {
            return this[key].apply(this, arguments);
        };
    });
    return methods;
});
/**
 * 关闭所有的数据库连接
 * @return {[type]} [description]
 */
Model.close = function () {
    'use strict';
    for (var key in dbInstances) {
        dbInstances[key].close();
    }
    dbInstances = {};
};
/**
 * 清除数据表字段缓存
 * @return {[type]} [description]
 */
Model.clearTableFieldsCache = function () {
    'use strict';
    tableFieldsCache = {};
}