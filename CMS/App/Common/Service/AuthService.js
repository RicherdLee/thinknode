/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    14/11/20
 */
module.exports = Class(function () {
    "use strict";
    return {
        /**
        * 初始化
        * @param  int userId 当前登录用户的id
        * @param  obj config 配置项
        * @return this
        */
        init: function(userId, config){
            //当前检测的用户id
            this.userId = userId || config.userInfo.id;
            //这里不能使用默认的深度复制，因为http对象包含了一些循环引用的对象
            this.config = extend(false, {
                type: C("auth_type"), //认证方式，1为实时认证，2为SESSION认证。如果检测非当前登录用户，则不能使用SESSION认证。
                http: null, //如果type为2，那么必须传入http对象
                user: C("auth_user"), //用户信息表
                role: C("auth_role"), //角色表
                rule: C("auth_rule"), //规则表
                userInfo: null //用户详细信息，用户condition判断。如果没有自动从User表里查询
            }, config);
        },
        /**
        * 检测权限，可以一次检测多个权限
        * @param  {[type]} name  [description]
        * @param  {[type]} and [description]
        * @return {[type]}       [description]
        */
        check: function(name, and){
            'use strict';
            if (isString(name)) {
                name = name.split(',');
            }
            return this.getAuthList().then(function(authList){
                if (name.length === 1) {
                    return authList.indexOf(name[0]) > -1;
                }
                var logic = and ? 'every' : 'some';
                return name[logic](function(item){
                    return authList.indexOf(item) > -1;
                })
            });
        },
        /**
        * 获取权限列表
        * @return {[type]} [description]
        */
        getAuthList: function(){
            'use strict';
            var authPromise;
            if (this.config.type === 1) {
                authPromise = this.flushAuthList();
            }else{
                var http = this.config.http;
                var self = this;
                //存在Session里的authList Key
                var key = 'think_auth_list';
                if (!http) {
                    return getPromise("config.http can't be null", true);
                }
                thinkRequire('Session').start(http);
                authPromise = http.session.get(key).then(function(data){
                    if (!isEmpty(data)) {
                        return data;
                    }
                    return self.flushAuthList().then(function(data){
                        http.session.set(key, data);
                        return data;
                    })
                })
            }
            var userInfoPromise = this.getUserInfo();
            return Promise.all([authPromise, userInfoPromise]).then(function(data){
                var authList = data[0];
                var userInfo = data[1];
                var result = [];
                authList.forEach(function(item){
                    if (!item.condition) {
                        result.push(item.name);
                    }else{
                        var condition = item.condition.replace(/\w+/, function(a){
                            return 'userInfo.' + a;
                        });
                        /*jslint evil: true */
                        var fn = new Function('userInfo', 'return ' + condition);
                        var flag = fn(userInfo);
                        if (flag) {
                            result.push(item.name);
                        }
                    }
                });
                return result;
            })
        },
        /**
        * 刷新权限列表，从数据库中拉取
        * @return {[type]} [description]
        */
        flushAuthList: function(){
            'use strict';
            var self = this;
            return this.getRuleIds().then(function(ids){
                return M().field('name,condition').table(self.config.rule).where({status: 1,_complex: {id: ['IN', ids],name: '',_logic: 'or'}}).select();
            });
        },
        /**
        * 获取用户信息
        * @return {[type]} [description]
        */
        getUserInfo: function(){
            'use strict';
            if (!isEmpty(this.config.userInfo)) {
                return getPromise(this.config.userInfo);
            }
            var self = this;
            return M().table(self.config.user).where({id: this.userId}).find().then(function(data){
                self.config.userInfo = data;
                return data;
            })
        },
        /**
        * 获取用户权限rule id列表
        * @return {[type]} [description]
        */
        getRuleIds: function(){
            'use strict';
            return this.getRoles().then(function(data){
                var ids = [];
                data.forEach(function(item){
                    var ruleIds = (item.rule_ids || '').split(',');
                    ids = ids.concat(ruleIds);
                });
                return ids;
            })
        },
        /**
        * 获取用户角色列表
        * @return {[type]} [description]
        */
        getRoles: function(){
            'use strict';
            var model = M();
            return model.table(this.config.user).alias('user').join({
                table: this.config.role,
                as: 'role',
                on: ['role_id', 'id']
            }).where({
                'user.id': this.userId,
                'user.status':1,
                'role.status': 1
            }).select();
        }
    };
});