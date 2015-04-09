/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14/11/19
 */
module.exports = Class(function(){
    'use strict';
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
            //当前检测的用户id
            this.userId = userId;
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
         * 获取用户后台菜单
         * @param userId
         */
        getAdminMenu: function(){
            var self = this;

            return S("adminMenu_"+this.userId).then(function(value){
                if(isEmpty(value)){
                    var ruleIds = self.getRuleIds();
                    var flag = false;
                    if(self.config.userInfo.role_id == C('auth_superroleid')){
                        flag = true;
                    }

                    var one = ruleIds.then(function (data) {
                        if(flag){
                            return M("AuthRule").where({status:1,isshow:1,level:1}).select();
                        }else{
                            return M("AuthRule").where({status:1,isshow:1,level:1,_complex: {id: ['IN', data],name: '',_logic: 'or'}}).select();
                        }
                    });
                    var two = ruleIds.then(function (data) {
                        if(flag){
                            return M("AuthRule").where({status:1,isshow:1,level:2}).select();
                        }else{
                            return M("AuthRule").where({status:1,isshow:1,level:2,_complex: {id: ['IN', data],name: '',_logic: 'or'}}).select();
                        }
                    });
                    var three = ruleIds.then(function (data) {
                        if(flag){
                            return M("AuthRule").where({status:1,isshow:1,level:3}).select();
                        }else{
                            return M("AuthRule").where({status:1,isshow:1,level:3,id:["in",data]}).select();
                        }
                    });

                    return Promise.all([one,two,three]).then(function (result) {
                        var oneObj = arrToObj(result[0], "id");
                        var twoObj = arrToObj(result[1], "id");
                        var threeObj = arrToObj(result[2], "id");

                        var temptree = [], items = [], tree = [];
                        for(var i in oneObj){
                            var trow = {
                                id:oneObj[i].id,
                                name:oneObj[i].desc,
                                url:oneObj[i].name,
                                icon:oneObj[i].icon,
                                children:[]
                            };
                            temptree[oneObj[i].id] = trow;

                            for(var m in twoObj){
                                if(twoObj[m].pid == oneObj[i].id){
                                    var items = {
                                        id:twoObj[m].id,
                                        name:twoObj[m].desc,
                                        url:twoObj[m].name,
                                        icon:twoObj[m].icon,
                                        children:[]
                                    };

                                    for(var n in threeObj){
                                        if(threeObj[n].pid == twoObj[m].id){
                                            items['children'].push({
                                                id:threeObj[n].id,
                                                name:threeObj[n].desc,
                                                url:threeObj[n].name,
                                                icon:threeObj[n].icon,
                                                children:[]
                                            });
                                        }
                                    }
                                    temptree[oneObj[i].id]['children'].push(items);
                                }
                            }
                            tree.push(temptree[oneObj[i].id]);
                        }

                        temptree = null;
                        items = null;
                        S("adminMenu_"+self.userId,tree);
                        return tree;
                    });
                }else{
                    return value;
                }
            });
        },
        /**
         * 获取用户权限rule id列表
         * @return {[type]} [description]
         */
        getRuleIds: function(){
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
    }
});