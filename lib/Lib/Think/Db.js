var querystring = require('querystring');
/**
 * 数据库基类
 * @return {[type]} [description]
 */
var Db = module.exports = Class(function () {
    'use strict';
    //数据库连接
    var dbConnections = {};
    //获取数据配置的基本信息
    var getDbItem = function (value, index) {
        value = value || "";
        if (isString(value)) {
            value = value.split(',');
        }
        return index !== undefined ? (value[index] || value[0]) : value;
    };

    return {
        // 数据库类型
        dbType: null,
        // 当前操作所属的模型名
        model: 'think',
        // 当前SQL指令
        sql: '',
        // 操作的sql列表
        modelSql: {},
        // 数据库连接参数配置
        config: '',
        // 事务次数
        transTimes: 0,
        //最后插入的id
        lastInsertId: 0,
        //查询等待
        queryWaiting: {},
        //用于查询的sql语句，所有select语句根据该语句解析
        selectSql: 'SELECT%DISTINCT% %FIELD% FROM %TABLE%%JOIN%%WHERE%%GROUP%%HAVING%%ORDER%%LIMIT% %UNION%%COMMENT%',
        //where条件里的表达式
        comparison: {
            'EQ': '=',
            'NEQ': '!=',
            '<>': '!=',
            'GT': '>',
            'EGT': '>=',
            'LT': '<',
            'ELT': '<=',
            'NOTLIKE': 'NOT LIKE',
            'LIKE': 'LIKE',
            'IN': 'IN',
            'NOTIN': 'NOT IN'
        },
        /**
         * 初始化
         * @return {[type]} [description]
         */
        init: function (config) {
            this.config = config;
        },
        /**
         * 初始化数据库连接
         * @param  {[type]} master [description]
         * @return {[type]}        [description]
         */
        initConnect: function (master) {
            var hosts = getDbItem(this.config.host);
            //单个host
            if (hosts.length === 1) {
                return this.getConnection(0, this.connect, [this.config]);
            }
            return this.multiConnect(master);
        },
        /**
         * 分布式连接
         * @return {[type]} [description]
         */
        multiConnect: function (master) {
            var config = this.config;
            var index = 0;
            var hostnameLength = getDbItem(config.host).length;
            //读写分离
            if (config.rw_separate) {
                if (master) {
                    index = rand(0, config.master_num - 1);
                } else {
                    if (isNumber(config.slave_no)) {
                        index = config.slave_no;
                    } else {
                        index = rand(config.master_num, hostnameLength - 1);
                    }
                }
            } else {
                index = rand(0, hostnameLength - 1);
            }
            var dbConfig = {
                user: getDbItem(config.user, index),
                password: getDbItem(config.password, index),
                host: getDbItem(config.host, index),
                port: getDbItem(config.port, index),
                database: getDbItem(config.database, index),
                charset: getDbItem(config.charset, index)
            };
            dbConfig = extend({}, config, dbConfig);
            return this.getConnection(index, this.connect, [dbConfig]);
        },
        /**
         * 获取数据连接句柄
         * @param  {[type]}   index    [description]
         * @param  {Function} callback [description]
         * @param  {[type]}   data     [description]
         * @return {[type]}            [description]
         */
        getConnection: function (index, callback, data) {
            var key = md5(JSON.stringify(this.config));
            if (!(key in dbConnections)) {
                dbConnections[key] = [];
            }
            if (dbConnections[key][index]) {
                return dbConnections[key][index];
            }
            var connection = callback.apply(this, data);
            this.linkId = dbConnections[key][index] = connection;
            return connection;
        },
        /**
         * 解析set集合
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        parseSet: function (data) {
            data = data || {};
            var set = [];
            for (var key in data) {
                var value = this.parseValue(data[key]);
                if (isScalar(value)) {
                    set.push(this.parseKey(key) + '=' + value);
                }
            }
            return ' SET ' + set.join(',');
        },
        /**
         * 解析字段名，具体的数据库里实现
         * @param  {[type]} key [description]
         * @return {[type]}     [description]
         */
        parseKey: function (key) {
            return key;
        },
        /**
         * value分析
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        parseValue: function (value) {
            if (isString(value)) {
                value = '\'' + this.escapeString(value) + '\'';
            } else if (isArray(value)) {
                if ((value[0] + '').toLowerCase() === 'exp') {
                    value = value[1];
                } else {
                    var self = this;
                    value = value.map(function (item) {
                        return self.parseValue(item);
                    });
                }
            } else if (isBoolean(value)) {
                value = value ? '1' : '0';
            } else if (value === null) {
                value = 'null';
            }
            return value;
        },
        /**
         * field分析
         * parseField('name');
         * parseField('name,email');
         * parseField({
     *     xx_name: 'name',
     *     xx_email: 'email'
     * })
         * @return {[type]} [description]
         */
        parseField: function (fields) {
            if (isString(fields) && fields.indexOf(',') > -1) {
                fields = fields.split(',');
            }
            if (isArray(fields)) {
                var self = this;
                return fields.map(function (item) {
                    return self.parseKey(item);
                }).join(',');
            } else if (isObject(fields)) {
                var data = [];
                for (var key in fields) {
                    data.push(this.parseKey(key) + ' AS ' + this.parseKey(fields[key]));
                }
                return data.join(',');
            } else if (isString(fields) && fields) {
                return this.parseKey(fields);
            }
            return '*';
        },
        /**
         * table别名分析
         * @param  {[type]} tables [description]
         * @return {[type]}        [description]
         */
        parseTable: function (tables) {
            if (isString(tables)) {
                tables = tables.split(',');
            }
            if (isArray(tables)) {
                var self = this;
                return tables.map(function (item) {
                    return self.parseKey(item);
                }).join(',');
            } else if (isObject(tables)) {
                var data = [];
                for (var key in tables) {
                    data.push(this.parseKey(key) + ' AS ' + this.parseKey(tables[key]));
                }
                return data.join(',');
            }
            return '';
        },
        /**
         * where条件分析
         * @param  {[type]} where [description]
         * @return {[type]}       [description]
         */
        parseWhere: function (where) {
            var whereStr = '';
            var self = this;
            where = where || {};
            if (isString(where)) {
                whereStr = where;
            } else {
                // 定义逻辑运算规则 例如 OR XOR AND NOT
                var oList = ['AND', 'OR', 'XOR'];
                var operate = (where._logic + '').toUpperCase();
                delete where._logic;
                operate = oList.indexOf(operate) > -1 ? ' ' + operate + ' ' : ' AND ';
                //key值的安全检测正则
                var keySafeRegExp = /^[\w\|\&\-\.\(\)\,]+$/;
                var multi = where._multi;
                delete where._multi;

                var val;
                var fn = function (item, i) {
                    var v = multi ? val[i] : val;
                    return '(' + self.parseWhereItem(self.parseKey(item), v) + ')';
                };
                for (var key in where) {
                    key = key.trim();
                    val = where[key];
                    whereStr += '( ';
                    if (key.indexOf('_') === 0) {
                        // 解析特殊条件表达式
                        whereStr += this.parseThinkWhere(key, val);
                    } else {
                        if (!keySafeRegExp.test(key)) {
                            console.log(key + ' is not safe');
                            continue;
                        }
                        var arr;
                        // 支持 name|title|nickname 方式定义查询字段
                        if (key.indexOf('|') > -1) {
                            arr = key.split('|');
                            whereStr += arr.map(fn).join(' OR ');
                        } else if (key.indexOf('&') > -1) {
                            arr = key.split('&');
                            whereStr += arr.map(fn).join(' AND ');
                        } else {
                            whereStr += this.parseWhereItem(this.parseKey(key), val);
                        }
                    }
                    whereStr += ' )' + operate;
                }
                whereStr = whereStr.substr(0, whereStr.length - operate.length);
            }

            return whereStr ? (' WHERE ' + whereStr) : '';
        },
        /**
         * 解析单个查询条件
         * @param  {[type]} key [description]
         * @param  {[type]} val [description]
         * @return {[type]}     [description]
         */
        parseWhereItem: function (key, val) {
            if (isObject(val)) { // {id: {'<': 10, '>': 1}}
                var logic = (val._logic || 'AND').toUpperCase();
                delete val._logic;
                var result = [];
                for (var opr in val) {
                    var nop = opr.toUpperCase();
                    nop = this.comparison[nop] || nop;
                    result.push(key + ' ' + nop + ' ' + this.parseValue(val[opr]));
                }
                return result.join(' ' + logic + ' ');
            } else if (!isArray(val)) {
                //对字符串类型字段采用模糊匹配
                if (C('db_like_fields').indexOf(key) > -1) {
                    return key + ' LIKE ' + this.parseValue('%' + val + '%');
                } else {
                    return key + ' = ' + this.parseValue(val);
                }
            }
            var whereStr = '';
            var data;
            if (isString(val[0])) {
                var val0 = val[0].toUpperCase();
                val0 = this.comparison[val0] || val0;
                if (/^(=|!=|>|>=|<|<=)$/.test(val0)) { // 比较运算
                    whereStr += key + ' ' + val0 + ' ' + this.parseValue(val[1]);
                } else if (/^(NOT\s+LIKE|LIKE)$/.test(val0)) { // 模糊查找
                    if (isArray(val[1])) { //多个like
                        var likeLogic = (val[2] || 'OR').toUpperCase();
                        var likesLogic = ['AND', 'OR', 'XOR'];
                        var self = this;
                        if (likesLogic.indexOf(likeLogic) > -1) {
                            var like = val[1].map(function (item) {
                                return key + ' ' + val0 + ' ' + self.parseValue(item);
                            }).join(' ' + likeLogic + ' ');
                            whereStr += '(' + like + ')';
                        }
                    } else {
                        whereStr += key + ' ' + val0 + ' ' + this.parseValue(val[1]);
                    }
                } else if (val0 === 'EXP') { // 使用表达式
                    whereStr += '(' + key + ' ' + val[1] + ')';
                } else if (val0 === 'IN' || val0 === 'NOT IN') { // IN 运算
                    if (val[2] === 'exp') {
                        whereStr += key + ' ' + val0 + ' ' + val[1];
                    } else {
                        if (isString(val[1])) {
                            val[1] = val[1].split(',');
                        }
                        //如果不是数组，自动转为数组
                        if (!isArray(val[1])) {
                            val[1] = [val[1]];
                        }
                        val[1] = this.parseValue(val[1]);
                        //如果只有一个值，那么变成＝或者!=
                        if (val[1].length === 1) {
                            whereStr += key + (val0 === 'IN' ? ' = ' : ' != ') + val[1];
                        } else {
                            whereStr += key + ' ' + val0 + ' (' + val[1].join(',') + ')';
                        }
                    }
                } else if (val0 === 'BETWEEN') { // BETWEEN运算
                    data = isString(val[1]) ? val[1].split(',') : val[1];
                    if (!isArray(data)) {
                        data = [val[1], val[2]];
                    }
                    whereStr += ' (' + key + ' ' + val0 + ' ' + this.parseValue(data[0]);
                    whereStr += ' AND ' + this.parseValue(data[1]) + ')';
                } else {
                    console.log('_EXPRESS_ERROR_', key, val);
                    return '';
                }
            } else {
                var length = val.length;
                var rule = 'AND';
                if (isString(val[length - 1])) {
                    var last = val[length - 1].toUpperCase();
                    if (last && ['AND', 'OR', 'XOR'].indexOf(last) > -1) {
                        rule = last;
                        length--;
                    }
                }
                for (var i = 0; i < length; i++) {
                    var isArr = isArray(val[i]);
                    data = isArr ? val[i][1] : val[i];
                    var exp = ((isArr ? val[i][0] : '') + '').toUpperCase();
                    if (exp === 'EXP') {
                        whereStr += '(' + key + ' ' + data + ') ' + rule + ' ';
                    } else {
                        var op = isArr ? (this.comparison[val[i][0].toUpperCase()] || val[i][0]) : '=';
                        whereStr += '(' + key + ' ' + op + ' ' + this.parseValue(data) + ') ' + rule + ' ';
                    }
                }
                whereStr = whereStr.substr(0, whereStr.length - 4);
            }
            return whereStr;
        },
        /**
         * 解析一些特殊的where条件
         * @param  {[type]} key [description]
         * @param  {[type]} val [description]
         * @return {[type]}     [description]
         */
        parseThinkWhere: function (key, val) {
            switch (key) {
                // 字符串模式查询条件
                case '_string':
                    return val;
                // 复合查询条件
                case '_complex':
                    return this.parseWhere(val).substr(6);
                // 字符串模式查询条件
                case '_query':
                    var where = isString(val) ? querystring.parse(val) : val;
                    var op = ' AND ';
                    if ('_logic' in where) {
                        op = ' ' + where._logic.toUpperCase() + ' ';
                        delete where._logic;
                    }
                    var arr = [];
                    for (var name in where) {
                        val = where[name];
                        val = this.parseKey(name) + ' = ' + this.parseValue(val);
                        arr.push(val);
                    }
                    return arr.join(op);
                default:
                    return '';
            }
            return '';
        },
        /**
         * 解析limit，对非法的limit进行过滤
         * @param  {[type]} limit [description]
         * @return {[type]}       [description]
         */
        parseLimit: function (limit) {
            if (!limit) {
                return '';
            }
            limit = (limit + '').split(',');
            var data = [];
            for (var i = 0; i < Math.min(2, limit.length); i++) {
                data[i] = limit[i] | 0;
            }
            return ' LIMIT ' + data.join(',');
        },
        /**
         * 解析join
         * @param  {[type]} join [description]
         * @return {[type]}      [description]
         */
        parseJoin: function (join, options) {
            if (!join) {
                return '';
            }
            var joinStr = '';
            var defaultJoin = ' LEFT JOIN ';
            if (isArray(join)) {
                var joins = {
                    'left': ' LEFT JOIN ',
                    'right': ' RIGHT JOIN ',
                    'inner': ' INNER JOIN '
                };
                join.forEach(function (val) {
                    if (isString(val)) {//字符串，直接拼接
                        var hasJoin = val.toLowerCase().indexOf(' join ') > -1;
                        joinStr += (hasJoin ? ' ' : defaultJoin) + val;
                    } else if (isObject(val)) {
                        var ret = [];
                        if (!('on' in val)) {
                            for (var key in val) {
                                var v = val[key];
                                v.table = key;
                                ret.push(v);
                            }
                        } else {
                            ret.push(val);
                        }
                        ret.forEach(function (item) {
                            var joinType = joins[item.join] || item.join || defaultJoin;
                            // join 表中包含空格、tab等，认为是sql语句使用情况，与buildSql结合使用
                            var table = item.table.trim();
                            if (/\s+/.test(table)) {
                                if (table.indexOf('(') !== 0) {
                                    table = '(' + table + ')';
                                }
                                joinStr += joinType + table;
                            } else {
                                table = options.tablePrefix + table;
                                joinStr += joinType + '`' + table + '`';
                            }
                            if (item.as) {
                                joinStr += ' AS ' + item.as;
                            }
                            //ON条件
                            if (item.on) {
                                var mTable = options.alias || options.table;
                                var jTable = item.as || table;
                                //多个＝条件
                                if (isObject(item.on)) {
                                    var where = [];
                                    for (var key in item.on) {
                                        where.push([
                                            key.indexOf('.') > -1 ? key : (mTable + '.`' + key + '`'),
                                            '=',
                                            item.on[key].indexOf('.') > -1 ? item.on[key] : (jTable + '.`' + item.on[key] + '`')
                                        ].join(''));
                                    }
                                    joinStr += ' ON (' + where.join(' AND ') + ')';
                                } else {
                                    if (isString(item.on)) {
                                        item.on = item.on.split(/\s*,\s*/);
                                    }
                                    joinStr += ' ON ' + (item.on[0].indexOf('.') > -1 ? item.on[0] : (mTable + '.`' + item.on[0] + '`'));
                                    joinStr += '=' + (item.on[1].indexOf('.') > -1 ? item.on[1] : (jTable + '.`' + item.on[1] + '`'));
                                }
                            }
                        })
                    }
                });
            } else {
                joinStr += defaultJoin + join;
            }
            return joinStr;
        },
        /**
         * 解析order
         * @param  {[type]} order [description]
         * @return {[type]}       [description]
         */
        parseOrder: function (order) {
            var self = this;
            if (isArray(order)) {
                order = order.map(function (item) {
                    return self.parseKey(item);
                }).join(',');
            } else if (isObject(order)) {
                var arr = [];
                for (var key in order) {
                    var val = order[key];
                    val = this.parseKey(key) + ' ' + val;
                    arr.push(val);
                }
                order = arr.join(',');
            }
            return order ? (' ORDER BY ' + order) : '';
        },
        /**
         * 解析group
         * @param  {[type]} group [description]
         * @return {[type]}       [description]
         */
        parseGroup: function (group) {
            if (!group) {
                return '';
            }
            if (isString(group)) {
                group = group.split(',');
            }
            var result = [];
            group.forEach(function (item) {
                item = item.trim();
                if (!item) {
                    return;
                }
                if (item.indexOf('.') === -1) {
                    result.push('`' + item + '`');
                } else {
                    item = item.split('.');
                    result.push(item[0] + '.`' + item[1] + '`');
                }
            })
            if (!result.length) {
                return '';
            }
            return ' GROUP BY ' + result.join(',');
        },
        /**
         * 解析having
         * @param  {[type]} having [description]
         * @return {[type]}        [description]
         */
        parseHaving: function (having) {
            return having ? (' HAVING ' + having) : '';
        },
        /**
         * 解析注释，一般情况下用不到
         * @param  {[type]} comment [description]
         * @return {[type]}         [description]
         */
        parseComment: function (comment) {
            return comment ? (' /* ' + comment + '*/') : '';
        },
        /**
         * 解析Distinct
         * @param  {[type]} distinct [description]
         * @return {[type]}          [description]
         */
        parseDistinct: function (distinct) {
            return distinct ? ' Distinct ' : '';
        },
        /**
         * 解析Union
         * @param  {[type]} union [description]
         * @return {[type]}       [description]
         */
        parseUnion: function (union) {
            if (!union) {
                return '';
            }
            if (isArray(union)) {
                var self = this;
                var sql = '';
                union.forEach(function (item) {
                    sql += item.all ? 'UNION ALL ' : 'UNION ';
                    sql += '(' + (isObject(item.union) ? self.buildSelectSql(item.union).trim() : item.union) + ') ';
                });
                return sql;
            } else {
                return 'UNION (' + (isObject(union) ? this.buildSelectSql(union).trim() : union) + ') ';
            }
        },
        /**
         * 解析Lock
         * @param  {[type]} lock [description]
         * @return {[type]}      [description]
         */
        parseLock: function (lock) {
            if (!lock) {
                return '';
            }
            return ' FOR UPDATE ';
        },
        /**
         * 将page转化为sql里的limit
         * @return {[type]} [description]
         */
        pageToLimit: function (options) {
            options = options || {};
            //根据page生成limit
            if ('page' in options) {
                var page = options.page + '';
                var listRows = 0;
                if (page.indexOf(',') > -1) {
                    page = page.split(',');
                    listRows = page[1] | 0;
                    page = page[0];
                }
                page = parseInt(page, 10) || 1;
                if (!listRows) {
                    listRows = isNumberString(options.limit) ? options.limit : C('db_nums_per_page');
                }
                var offset = listRows * (page - 1);
                options.limit = offset + ',' + listRows;
            }
            return options;
        },
        /**
         * 拼接select查询语句
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        buildSelectSql: function (options) {
            options = this.pageToLimit(options);
            var sql = this.parseSql(this.selectSql, options);
            sql += this.parseLock(options.lock);
            return sql;
        },
        /**
         * 解析sql语句
         * @param  {[type]} sql     [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        parseSql: function (sql, options) {
            options = options || {};
            var self = this;
            return sql.replace(/\%([A-Z]+)\%/g, function (a, type) {
                type = type.toLowerCase();
                return self['parse' + ucfirst(type)](options[type] || '', options);
            }).replace(/__([A-Z_-]+)__/g, function (a, b) {
                return '`' + C('db_prefix') + b.toLowerCase() + '`';
            });
        },
        /**
         * 插入一条记录
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @param  {[type]} replace [description]
         * @return {[type]}         [description]
         */
        insert: function (data, options, replace) {
            data = data || {};
            options = options || {};
            var values = [];
            var fields = [];
            this.model = options.model;
            for (var key in data) {
                var val = data[key];
                val = this.parseValue(val);
                if (isScalar(val)) {
                    values.push(val);
                    fields.push(this.parseKey(key));
                }
            }
            var sql = (replace ? 'REPLACE' : 'INSERT') + ' INTO ';
            sql += this.parseTable(options.table) + ' (' + fields.join(',') + ') ';
            sql += 'VALUES(' + values.join(',') + ')';
            sql += this.parseLock(options.lock) + this.parseComment(options.comment);
            return this.execute(sql);
        },
        /**
         * 插入多条记录
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @param  {[type]} replace [description]
         * @return {[type]}         [description]
         */
        insertAll: function (data, options, replace) {
            var fields = Object.keys(data[0]);
            var self = this;
            fields = fields.map(function (item) {
                return self.parseKey(item);
            }).join(',');
            var values = data.map(function (item) {
                var value = [];
                for (var key in item) {
                    var val = item[key];
                    val = self.parseValue(val);
                    if (isScalar(val)) {
                        value.push(val);
                    }
                }
                return '(' + value.join(',') + ')';
            }).join(',');
            var sql = replace ? 'REPLACE' : 'INSERT';
            sql += ' INTO ' + this.parseTable(options.table) + '(' + fields + ') VALUES ' + values;
            return this.execute(sql);
        },
        /**
         * 从一个选择条件的结果插入记录
         * @param  {[type]} fields  [description]
         * @param  {[type]} table   [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        selectAdd: function (fields, table, options) {
            options = options || {};
            this.model = options.model;
            if (isString(fields)) {
                fields = fields.split(',');
            }
            var self = this;
            fields = fields.map(function (item) {
                return self.parseKey(item);
            });
            var sql = 'INSERT INTO ' + this.parseTable(table) + ' (' + fields.join(',') + ') ';
            sql += this.buildSelectSql(options);
            return this.execute(sql);
        },
        /**
         * 删除记录
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        delete: function (options) {
            options = options || {};
            this.model = options.model;
            var sql = [
                'DELETE FROM ',
                this.parseTable(options.table),
                this.parseWhere(options.where),
                this.parseOrder(options.order),
                this.parseLimit(options.limit),
                this.parseLock(options.lock),
                this.parseComment(options.comment)
            ].join('');
            return this.execute(sql);
        },
        /**
         * 更新数据
         * @param  {[type]} data    [description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        update: function (data, options) {
            options = options || {};
            this.model = options.model;
            var sql = [
                'UPDATE ',
                this.parseTable(options.table),
                this.parseSet(data),
                this.parseWhere(options.where),
                this.parseOrder(options.order),
                this.parseLimit(options.limit),
                this.parseLock(options.lock),
                this.parseComment(options.comment)
            ].join('');
            return this.execute(sql);
        },
        /**
         * 数据查询
         * @todo 返回是个promise，缓存调用需要修改
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        select: function (options) {
            var sql, cache;
            if (isString(options) && options.toUpperCase().indexOf('SELECT ') > -1) {
                sql = options;
                cache = arguments[1];
            } else {
                options = options || {};
                this.model = options.model;
                sql = this.buildSelectSql(options);
                cache = options.cache;
            }
            var self = this;
            if (!isEmpty(cache) && C('db_cache_on')) {
                var key = cache.key || md5(sql);
                return S(key, function () {
                    return self.query(sql);
                }, cache);
            }
            return this.query(sql);
        },
        /**
         * 转义字符
         * @param  {[type]} str [description]
         * @return {[type]}     [description]
         */
        escapeString: function (str) {
            if (!str) {
                return '';
            }
            return str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (s) {
                switch (s) {
                    case '\0':
                        return '\\0';
                    case '\n':
                        return '\\n';
                    case '\r':
                        return '\\r';
                    case '\b':
                        return '\\b';
                    case '\t':
                        return '\\t';
                    case '\x1a':
                        return '\\Z';
                    default:
                        return '\\' + s;
                }
            });
        },
        /**
         * 获取上次的sql语句
         * @param  {[type]} model [description]
         * @return {[type]}       [description]
         */
        getLastSql: function (model) {
            return model ? this.modelSql[model] : this.sql;
        },
        /**
         * 设置当前操作的sql
         * @param {[type]} sql [description]
         */
        setSql: function (sql) {
            this.sql = sql;
            this.modelSql[this.model] = sql;
        },
        /**
         * 设置模型
         * @param {[type]} model [description]
         */
        setModel: function (model) {
            this.model = model;
            return this;
        },
        /**
         * 获取最后插入的id
         * @return {[type]} [description]
         */
        getLastInsertId: function () {
            return this.lastInsertId;
        },
        /**
         * 查询一条sql
         * @param  string str
         * @return promise
         */
        query: function (str) {
            this.setSql(str);
            var self = this;
            if (!(str in this.queryWaiting)) {
                this.queryWaiting[str] = [];
                return this.initConnect(false).query(str).then(function (data) {
                    data = self.bufferToString(data);
                    process.nextTick(function () {
                        self.queryWaiting[str].forEach(function (deferred) {
                            deferred.resolve(data);
                        });
                        delete self.queryWaiting[str];
                    });
                    return data;
                });
            } else {
                var deferred = getDefer();
                this.queryWaiting[str].push(deferred);
                return deferred.promise;
            }
        },
        /**
         * 将buffer转为string
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        bufferToString: function (data) {
            if (!C('db_buffer_tostring') || !isArray(data)) {
                return data;
            }
            for (var i = 0, length = data.length; i < length; i++) {
                for (var key in data[i]) {
                    if (isBuffer(data[i][key])) {
                        data[i][key] = data[i][key].toString();
                    }
                }
            }
            return data;
        },
        /**
         * 执行一条sql, 返回影响的行数
         * @param  {[type]} str [description]
         * @return {[type]}     [description]
         */
        execute: function (str) {
            this.setSql(str);
            var self = this;
            return this.initConnect(true).query(str).then(function (data) {
                if (data.insertId) {
                    self.lastInsertId = data.insertId;
                }
                return data.affectedRows || 0;
            });
        },
        /**
         * 关闭连接
         * @return {[type]} [description]
         */
        close: function () {
            if (this.linkId) {
                this.linkId.close();
                this.linkId = null;
            }
        }
    };
});
/**
 * 解析配置
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
Db.parseConfig = function (config) {
    'use strict';
    config = config || {};
    var conf = {
        type: config.db_type || C('db_type'),
        user: config.db_user || C('db_user'),
        password: config.db_pwd || C('db_pwd'),
        host: config.db_host || C('db_host'),
        port: config.db_port || C('db_port'),
        database: config.db_name || C('db_name'),
        charset: config.db_charset || C('db_charset'),
        rw_separate: config.db_rw_separate || false,
        master_num: config.db_master_num || 1,
        slave_no: config.db_slave_no
    };
    conf = extend({}, C('db_ext_config'), config, conf);
    return conf;
};
/**
 * 根据配置获取对应的数据库实例
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
Db.getInstance = function (config) {
    'use strict';
    var conf = this.parseConfig(config);
    var instance = thinkRequire(ucfirst(conf.type) + 'Db')(conf);
    instance.dbType = conf.type.toUpperCase();
    return instance;
};