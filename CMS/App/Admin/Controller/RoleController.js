/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    14/11/19
 */
module.exports = Controller("AdminBaseController", function () {
    "use strict";
    return {
        init: function(http){
            this.super_("init", http);
            this.Model = D("Admin/AuthRole");
        },

        _before_indexAction: function(){
            var desc = I("desc",this);
            var status = I("status",this);

            if(!isEmpty(desc)){
                this.Map.desc = ['like', '%'+desc+'%'];
            }
            if(!isEmpty(status)){
                this.Map.status = status;
            }

            //查询参数反赋值
            this.assign("desc",desc);
            this.assign("status",status);
        },

        _before_addAction: function(){
            var self = this;
            if(!this.isPost()){
                return M("AuthRule").where({status:1,name:["!=",'']}).select().then(function (data) {
                    self.assign("rules",data);
                });
            }
        },

        editAction: function () {
            var self = this;
            var id = I("id", this);
            if (!isEmpty(this.Model)) {
                if (this.isPost()) {
                    //表单令牌验证
                    if (C('token_on')) {
                        if (this.token(this.post(C('token_name')))) {
                            return this.error("表单令牌失效");
                        }
                    }
                    return this.Model.update(I('', this, 'post')).then(function (data) {
                        return self.success("操作成功");
                    }).catch(function (e) {
                        return self.error(e.toString());
                    });
                } else {
                    return getPromise(this.Model.getPk()).then(function (pk) {
                        return self.Model.where(getObject(pk, id)).find().then(function (data) {
                            self.assign("info", isArray(data) ? data[0] : data);
                            return data;
                        }).then(function (data) {
                            return M("AuthRule").where({status:1,name:["!=",'']}).select().then(function (alldata) {
                                var all = [],one = [];
                                alldata.forEach(function (v) {
                                    if(php.in_array(v.id,data[0].rule_ids)){
                                        one.push(v);
                                    }else{
                                        all.push(v);
                                    }
                                });
                                self.assign("allRules",all);
                                self.assign("rules",one);
                                return self.display();
                            });
                        });
                    });
                }
            }else{
                return this.end();
            }



            if(!this.isPost()){
                return M("AuthRule").where({status:1,name:["!=",'']}).select().then(function (data) {
                    var ps = [];
                    data.forEach(function (v) {
                        ps.push();
                    });

                    self.assign("rules",data);
                });
            }
        },

        _before_delAction: function(){
            if(I("id",this) == 1){
                return this.error("超级管理员不允许删除");
            }
        },

        _before_viewAction: function(){
            var self = this;
            return M("AuthRule").where({status:1,name:["!=",'']}).select().then(function (data) {
                self.assign("rules",data);
            });
        }
    };
});