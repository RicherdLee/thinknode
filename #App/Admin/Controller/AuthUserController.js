/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14/11/20
 */
module.exports = Controller("AdminBaseController", function () {
    "use strict";
    return {
        init: function(http){
            this.super_("init", http);
            this.Model = D("Admin/User");
        },

        _before_indexAction: function(){
            var username = I("username",this);
            var nickname = I("nickname",this);
            var status = I("status",this);

            if(!isEmpty(username)){
                this.Map.username = ['like', '%'+username+'%'];
            }
            if(!isEmpty(nickname)){
                this.Map.nickname = ['like', '%'+nickname+'%'];
            }
            if(!isEmpty(status)){
                this.Map.status = status;
            }

            //查询参数反赋值
            this.assign("username",username);
            this.assign("nickname",nickname);
            this.assign("status",status);
        },

        _before_addAction: function () {
            if(!this.isPost()){
                var self = this;
                return M("AuthRole").where({status:1}).select().then(function (data) {
                    self.assign("roles",data);
                });
            }
        },

        _before_editAction: function () {
            var self = this;
            if(!this.isPost()){
                return M("AuthRole").where({status:1}).select().then(function (data) {
                    self.assign("roles",data);
                });
            }else{
                if(I("id",this) == 1){
                    //跳转到错误页
                    return self.error("此超级管理员不允许编辑");
                }
                if(isEmpty(self.post("password")) && isEmpty(self.post("repassword"))){
                    delete self.http.post.password;
                    delete self.http.post.repassword;
                }else{
                    if(self.post("password") !== self.post("repassword")){
                        return self.error("两次输入的密码不一致");
                    }
                }
            }
        },

        _before_delAction: function(){
            if(I("id",this) == 1){
                return this.error("此超级管理员不允许删除");
            }
        },

        _before_viewAction: function(){
            var self = this;
            return M("AuthRole").where({status:1}).select().then(function (data) {
                self.assign("roles",data);
            });
        }
    };
});