var redis = require('redis');
module.exports = Class(function () {
    'use strict';
    return {
        init: function (config) {
            this.config = extend(false,{
                redis_port: C('redis_port'),
                redis_host: C('redis_host'),
                redis_password: C('redis_password')
            }, config);
            this.handle = null;
            this.deferred = null;
        },

        connect: function () {
            if (this.handle) {
                return this.deferred.promise;
            }
            var self = this;
            var deferred = getDefer();
            var port = this.config.redis_port || '6379';
            var host = this.config.redis_host || '127.0.0.1';
            var connection = redis.createClient(port, host, this.config);
            if (this.config.redis_password) {
                connection.auth(this.config.redis_password, function () {
                });
            }
            connection.on('ready', function () {
                deferred.resolve();
            });
            connection.on('connect', function () {
                deferred.resolve();
            });
            connection.on('error', function () {
                self.close();
            });
            connection.on('end', function () {
                self.close();
            });
            this.handle = connection;
            if (this.deferred) {
                this.deferred.reject(new Error('connection closed'));
            }
            this.deferred = deferred;
            return this.deferred.promise;
        },

        close: function () {
            if (this.handle) {
                this.handle.end();
                this.handle = null;
            }
        },

        wrap: function (name, data) {
            var self = this;
            return this.connect().then(function () {
                var deferred = getDefer();
                if (!isArray(data)) {
                    data = data === undefined ? [] : [data];
                }
                data.push(function (err, data) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(data);
                    }
                });
                self.handle[name].apply(self.handle, data);
                return deferred.promise;
            })
        },

        /**
         * 字符串获取
         * @param name
         * @returns {*}
         */
        get: function (name) {
            return this.wrap('get', [name]);
        },
        /**
         * 字符串写入
         * @param name
         * @param value
         * @param timeout
         * @returns {*}
         */
        set: function (name, value, timeout) {
            var setP = [this.wrap('set', [name, value])];
            if (timeout !== undefined) {
                setP.push(this.expire(name, timeout));
            }
            return Promise.all(setP);
        },
        /**
         * 设置key超时属性
         * @param name
         * @param timeout
         * @returns {*}
         */
        expire: function (name, timeout) {
            return this.wrap('expire', [name, timeout]);
        },
        /**
         * 判断key是否存在
         * @param name
         * @returns {*}
         */
        exists: function (name) {
            return this.wrap('exists', [name]);
        },
        /**
         * 哈希写入
         * @param name
         * @param key
         * @param value
         * @param timeout
         * @returns {*}
         */
        hSet: function (name, key, value, timeout) {
            var setP = [this.wrap('hset', [name, key, value])];
            if (timeout !== undefined) {
                setP.push(this.expire(name, timeout));
            }
            return Promise.all(setP);
        },
        /**
         * 哈希获取
         * @param name
         * @param key
         * @returns {*}
         */
        hGet: function (name, key) {
            return this.wrap('hget', [name, key]);
        },
        /**
         * 查看哈希表 hashKey 中，给定域 key 是否存在
         * @param name
         * @param key
         * @returns {*}
         */
        hExists: function (name, key) {
            return this.wrap('hexists',[name, key]);
        },
        /**
         * 返回哈希表 key 中域的数量
         * @param name
         * @returns {*}
         */
        hLen: function (name) {
            return this.wrap('hlen',[name]);
        },
        /**
         * 给哈希表指定key，增加increment
         * @param name
         * @param key
         * @param incr
         */
        hIncrBy: function (name, key, incr) {
            incr = incr || 1;
            return this.wrap('hincrby',[name, key, incr]);
        },
        /**
         * 返回哈希表所有key-value
         * @param name
         * @returns {*}
         */
        hGetAll: function (name) {
            return this.wrap('hgetall', [name]);
        },
        /**
         * 返回哈希表所有value
         * @param name
         */
        hVals: function (name) {
            return this.wrap('hvals',[name]);
        },
        /**
         * 返回哈希表所有key
         * @param name
         */
        hKeys: function (name) {
            return this.wrap('hkeys',[name]);
        },
        /**
         * 哈希删除
         * @param name
         * @param key
         * @returns {*}
         */
        hDel: function (name, key) {
            return this.wrap('hdel',[name, key]);
        },
        /**
         * 删除key
         * @param name
         */
        rm: function (name) {
            return this.wrap('delete', [name]);
        },
        /**
         * 批量删除，可模糊匹配
         * @param keyword
         * @returns {*}
         */
        batchRm: function (keyword) {
            var self = this;
            return this.wrap('keys', keyword + '*').then(function (keys) {
                return self.wrap('delete', [keys]);
            });
        },
        /**
         * 判断列表长度，若不存在则表示为空
         * @param name
         */
        lLen: function (name) {
            return this.wrap('llen',[name]);
        },
        /**
         * 将值插入列表表尾
         * @param name
         * @param value
         */
        rPush: function (name, value) {
            return this.wrap('rpush',[name, value]);
        },
        /**
         * 将列表表头取出，并去除
         * @param name
         */
        lPop: function (name) {
            return this.wrap('lpop',[name]);
        },
        /**
         * 自增
         * @param name
         */
        incr: function (name) {
            return this.wrap('incr',[name]);
        },
        /**
         * 字符key增加指定长度
         * @param name
         * @param incr
         * @returns {*}
         */
        incrBy: function (name, incr) {
            incr = incr || 1;
            return this.wrap('incrby',[name, incr]);
        },
        /**
         * 自减
         * @param name
         * @returns {*}
         */
        decr: function (name) {
            return this.wrap('decr',[name]);
        },
        /**
         * 集合新增
         * @param name
         * @param value
         * @returns {*}
         */
        sAdd: function (name, value) {
            return this.wrap('sadd',[name, value])
        },
        /**
         * 返回集合的基数(集合中元素的数量)
         * @param name
         * @returns {*}
         */
        sCard: function (name) {
            return this.wrap('scard',[name]);
        },
        /**
         * 判断 member 元素是否集合的成员
         * @param name
         * @param key
         * @returns {*}
         */
        sisMember: function (name, key) {
            return this.wrap('sismember',[name, key]);
        },
        /**
         * 返回集合中的所有成员
         * @param name
         * @returns {*}
         */
        sMembers: function (name) {
            return this.wrap('smembers',[name]);
        },
        /**
         * 移除并返回集合中的一个随机元素
         * @param name
         * @returns {*}
         */
        sPop: function (name) {
            return this.wrap('spop',[name]);
        },
        /**
         * 移除集合 key 中的一个 member 元素
         * @param name
         * @param key
         * @returns {*}
         */
        sRem: function (name, key) {
            return this.wrap('srem',[name, key]);
        }


    }
});