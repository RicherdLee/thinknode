/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    14/10/31
 */

module.exports = Controller("AdminBaseController", function(){
    "use strict";
    return {
        init : function(http) {
            this.super_("init", http);
            this.Model = D("Admin/User");
        },

        publicProfileAction: function(){
            var self = this;
            return this.session("userId").then(function (uid) {
                if(self.isPost()){
                    var postData = I('',self);
                    if(isEmpty(postData.password) && isEmpty(postData.repassword)){
                        delete postData.password;
                        delete postData.repassword;
                    }else{
                        if(postData.password !== postData.repassword){
                            return self.error("两次输入的密码不一致");
                        }
                    }
                    return self.Model.where({id:uid}).update(postData).then(function(data){
                        return self.success("操作成功");
                    }).catch(function (e) {
                        return self.error(e.toString());
                    });
                }else{
                    return self.Model.where({id:uid}).find().then(function (data) {
                        self.assign("userinfo",data);
                        return self.display();
                    });
                }
            });
        }
    };
});