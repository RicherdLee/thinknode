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

        _before_editAction: function () {
            var self = this;
            if(!this.isPost()){
                return M("AuthRule").where({status:1,name:["!=",'']}).select().then(function (data) {
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