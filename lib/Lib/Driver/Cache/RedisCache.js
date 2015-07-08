var redis = thinkRequire('RedisSocket');
module.exports = Cache(function () {
    'use strict';
    var instances = {};
    return {
        namePrefix: C('cache_key_prefix'),
        init: function (options) {
            this.super_('init', options);
            this.options = extend({
                redis_port: C('redis_port'),
                redis_host: C('redis_host'),
                redis_password: C('redis_password')
            }, options);
            var key = JSON.stringify(this.options);
            if (!(key in instances)) {
                instances[key] = redis(this.options.redis_port, this.options.redis_host);
            }
            this.namePrefix = this.options.cache_key_prefix ? this.options.cache_key_prefix : this.namePrefix;
            this.handle = instances;
        },
        get: function (name) {
            return this.handle.get(this.namePrefix + name).then(function (value) {
                return value ? JSON.parse(value) : value;
            })
        },
        set: function (name, value, timeout) {
            timeout = timeout || this.options.timeout;
            return this.handle.set(this.namePrefix + name, JSON.stringify(value), timeout);
        },
        rm: function (name) {
            return this.handle.rm(this.namePrefix + name);
        }

    };
});