/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14-10-16
 */

module.exports = Controller("AppFrameController", function () {
    "use strict";
    return {

        loginAction: function(){
            this.display();
        },

        checkLoginAction: function(){
            var self = this;
            return this.session("verify").then(function(data){
                if(ucfirst(data) !== ucfirst(self.post("verify"))){
                    return self.error("验证码错误");
                }else{
                    return X("Admin/Passport").loginAdmin(self.post("username"),self.post("password"),self.http.ip()).then(function(user){
                        if(isEmpty(user)){
                            return self.error("用户名或密码错误");
                        }else{
                            self.session("userId",user.id);
                            self.session("userInfo",user);
                            return self.success("操作成功",{"referer":"/Admin/Index/public_index"});
                        }
                    });
                }
            });
        },

        logoutAction: function(){
            var self = this;
            return this.session().then(function(){
                self.redirect("/Admin/Public/login");
            });
        },

        captchaAction: function(){
            var ccap = thinkRequire("ccap")({
                width: 200,
                offset: 30,
                _text_len: 4
            });
            var captchaPromise = getPromise(ccap.get());
            var self = this;
            return captchaPromise.then(function(data){
                self.session("verify",data[0]);
                self.header("Content-Type", "image/jpeg");
                self.end(data[1]);
            });
        },

        errorAction: function(){
            this.assign("errmsg",php.urldecode(this.param("errmsg")));
            this.display();
        }

    };
});