/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/1/15
 */
'use strict';
var mongoDb = thinkRequire('mongoDb');
var lastSql = '';
/**
 * mongodb model
 * @type {[type]}
 */
module.exports = Class({
    // 主键名称
    pk: '_id',
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
        this.trueTableName = this.getTableName();
        this.db = mongoDb(this.config, this.trueTableName, this.fields, this.schema_options);
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
     * 获取上一次操作的sql
     * @return {[type]} [description]
     */
    getLastSql: function () {
        return getPromise(lastSql);
    },
    /**
     * 获取主键名称
     * @access public
     * @return string
     */
    getPk: function () {
        return this.pk;
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
    //解析page参数
    parsePage: function (options) {
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
     * 数据插入之前操作，可以返回一个promise
     * @param  {[type]} data    [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    _beforeAdd: function (data) {
        return data;
    },
    /**
     * 添加数据
     * @param {[type]} data [description]
     */
    add: function (data) {
        var self = this;
        return this._beforeAdd(data).then(function (data) {
            return {model:self.model(),data:data};
        }).then(function (res) {
            var instance = new res.model(res.data);
            lastSql = {table: self.trueTableName, data: res.data, where: ''};
            var deferred = getDefer();
            instance.save(function (err, res) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(res);
                }
            });
            return deferred.promise;
        }).then(function (data) {
            return self._afterAdd(data);
        });
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
     * 数据删除之前操作，可以返回一个promise
     * @param  {[type]} data    [description]
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    _beforeDelete: function (options) {
        return options;
    },
    /**
     * 删除数据
     * @return {[type]} [description]
     */
    delete: function () {
        var self = this;
        return this._beforeDelete(self.parseWhere()).then(function (where) {
            return {model:self.model(),where:where};
        }).then(function (res) {
            lastSql = {table: self.trueTableName, data: '', where: res.where};
            var deferred = getDefer();
            res.model.remove(where, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        }).then(function (data) {
            return self._afterDelete(data);
        });
    },
    /**
     * 删除后续操作
     * @return {[type]} [description]
     */
    _afterDelete: function (data) {
        return data;
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
     * 更新
     * @param  {[type]} data      [description]
     * @param  {[type]} ignoreRet [description]
     * @return {[type]}           [description]
     */
    update: function (data, ignoreRet) {
        var self = this;
        return this._beforeUpdate(data).then(function (data) {
            return {model:self.model(),data:data};
        }).then(function (res) {
            var method = ignoreRet ? 'update' : 'findByIdAndUpdate';
            lastSql = {table: self.trueTableName, data: res.data, where: self._options.where};
            var deferred = getDefer();
            res.model[method](self._options.where, data, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        }).then(function (data) {
            return self._afterUpdate(data);
        });
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
     * 查询单条数据
     * @return {[type]} [description]
     */
    find: function () {
        var self = this;
        return this.model().then(function (model) {
            lastSql = {table: self.trueTableName, data: '', where: self._options.where, field: self._options.field};
            var deferred = getDefer();
            model.findOne(self._options.where, self._options.field, function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        }).then(function (data) {
            return self._afterFind(data || {});
        });
    },
    /**
     * find查询后置操作
     * @return {[type]} [description]
     */
    _afterFind: function (result) {
        return result;
    },
    /**
     * 查询数据
     * @return {[type]} [description]
     */
    select: function () {
        var self = this;
        return this.model().then(function (model) {
            var where = self.parseWhere();
            lastSql = {table: self.trueTableName,data: '',where: where,limit: self._options.limit,sort: self._options.order};
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
        }).then(function (result) {
            return self._afterSelect(result);
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
        var where = self.parseWhere();
        return this.model().then(function (model) {
            lastSql = {table: self.trueTableName,data: '',where: where,limit: self._options.limit,sort: self._options.order};
            model = model.where(where).limit(self._options.limit).sort(self._options.order).count(self.getPk());
            var deferred = getDefer();
            model.exec(function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        }).then(function (count) {
            var pageOptions = self.parsePage(parsedOptions);
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
     * 解析where
     * @param  {[type]} model [description]
     * @return {[type]}       [description]
     */
    parseWhere: function () {
        this._options.where = extend({}, this._options.where);
        return this._options.where;
    }
});