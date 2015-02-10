/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14/11/12
 */
module.exports = Controller("AdminBaseController",function(){
    "use strict";
    return {
        init: function(http){
            this.super_("init", http);
            this.Model = D("Admin/AuthRule");
        },
        _before_indexAction: function(){
            var desc = I("desc",this);
            var status = I("status",this);
            var isshow = I("isshow",this);

            if(!isEmpty(desc)){
                this.Map.desc = ['like', '%'+desc+'%'];
            }
            if(!isEmpty(status)){
                this.Map.status = status;
            }
            if(!isEmpty(isshow)){
                this.Map.isshow = isshow;
            }
            //查询参数反赋值
            this.assign("desc",desc);
            this.assign("status",status);
            this.assign("isshow",isshow);

            this.Mo.sortby = 'listorders desc,pid';
            this.Mo.sortasc = 'asc';
        },

        _before_addAction: function () {
            var self = this;
            return this.Model.where({level:['<',4]}).select().then(function (data) {
                self.assign("parents",data);
            });
        },

        _before_editAction: function(){
            var self = this;
            return this.Model.where({level:['<',4]}).select().then(function (data) {
                self.assign("parents",data);
            });
        },

        _before_viewAction: function(){
            var self = this;
            return this.Model.where({level:['<',4]}).select().then(function (data) {
                self.assign("parents",data);
            });
        }
    };
});