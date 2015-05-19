'use strict';

var mongoDb = thinkRequire('mongoDb');
/**
 * mongodb model
 * @type {[type]}
 */
module.exports = Class({
    //模型名
    name: '',
    // 数据表前缀
    tablePrefix: '',
    // 数据表名（不包含表前缀）
    tableName: '',
    // 实际数据表名（包含表前缀）
    trueTableName: '',
    //连接mongodb句柄
    db: null,
    //字段列表
    fields: {},
    //选项列表
    schema_options: {},
    //操作选项
    _options: {},
    /**
     * 初始化
     * @return {[type]} [description]
     */
    init: function (name, config) {
        // 获取模型名称
        if (name) {
            this.name = name;
        }
        if (isString(config)) {
            config = {db_prefix: config};
        }
        this.config = extend({
            db_host: C('db_host'),
            db_port: C('db_port'),
            db_name: C('db_name'),
            db_user: C('db_user'),
            db_pwd: C('db_pwd')
        }, config || {});

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
     * 初始化db
     * @return {[type]} [description]
     */
    initDb: function () {
        if (this.db) {
            return this.db;
        }
        var tableName = this.getTableName();
        this.db = mongoDb(this.config, tableName, this.fields, this.schema_options);
        return this.db;
    },
    /**
     * 获取model
     * @return {[type]} [description]
     */
    model: function () {
        return this.initDb().model();
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
     * 字符串命名风格转换
     * @param  {[type]} name [description]
     * @param  {[type]} type [description]
     * @return {[type]}      [description]
     */
    parseName: function (name) {
        name = name.trim();
        if (!name) {
            return name;
        }
        //首字母如果是大写，不转义为_x
        name = name[0].toLowerCase() + name.substr(1);
        return name.replace(/[A-Z]/g, function (a) {
            return '_' + a.toLowerCase();
        });
    },
    /**
     * 获取表名
     * @return {[type]} [description]
     */
    getTableName: function () {
        if (!this.trueTableName) {
            var tableName = this.tablePrefix || '';
            tableName += this.tableName || this.parseName(this.getModelName());
            this.trueTableName = tableName.toLowerCase();
        }
        return this.trueTableName;
    },
    /**
     * 查询条件
     * @param  {[type]} where [description]
     * @return {[type]}       [description]
     */
    where: function (where) {
        if (!where) {
            return this;
        }
        this._options.where = extend(this._options.where || {}, where);
        return this;
    },
    /**
     * 字段
     * @param  {[type]} field   [description]
     * @param  {[type]} reverse [description]
     * @return {[type]}         [description]
     */
    field: function (field) {
        if (!field) {
            return this;
        }
        if (isArray(field)) {
            field = field.join(' ');
        }
        this._options.field = field;
        return this;
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
     * 排序方式
     * @param  {[type]} order [description]
     * @return {[type]}       [description]
     */
    order: function (order) {
        if (order === undefined) {
            return this;
        }
        this._options.order = order;
    },
    /**
     * 添加数据
     * @param {[type]} data [description]
     */
    add: function (data) {
        return this.model().then(function (model) {
            var instance = new model(data);
            var deferred = getDefer();
            instance.save(function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        })
    },
    /**
     * 添加多个数据
     * @param {[type]} data [description]
     */
    addAll: function (data) {
        var self = this;
        var promises = data.map(function (item) {
            return self.add(item);
        });
        return Promise.all(promises);
    },
    /**
     * 删除数据
     * @return {[type]} [description]
     */
    delete: function () {
        var self = this;
        return this.model().then(function (model) {
            var where = self.parseWhere();
            var deferred = getDefer();
            model.remove(where, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        })
    },
    /**
     * 更新
     * @param  {[type]} data      [description]
     * @param  {[type]} ignoreRet [description]
     * @return {[type]}           [description]
     */
    update: function (data, ignoreRet) {
        var self = this;
        return this.model().then(function (model) {
            var method = ignoreRet ? 'update' : 'findByIdAndUpdate';
            var deferred = getDefer();
            model[method](self._options.where, data, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        })
    },
    /**
     * 查询数据
     * @return {[type]} [description]
     */
    select: function () {
        var self = this;
        return this.model().then(function (model) {
            var where = self.parseWhere();
            model = model.where(where).limit(self._options.limit).sort(self._options.order).select(self._options.field);
            var deferred = getDefer();
            model.exec(function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        })
    },
    /**
     * 查询单条数据
     * @return {[type]} [description]
     */
    find: function () {
        var self = this;
        return this.model().then(function (model) {
            var deferred = getDefer();
            model.findOne(self._options.where, self._options.field, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        })
    },
    /**
     * 解析where
     * @param  {[type]} model [description]
     * @return {[type]}       [description]
     */
    parseWhere: function () {
        this._options.where = extend({}, this._options.where);
        return this._options.where;
    }
});