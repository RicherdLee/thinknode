/**
 * controller
 * @return
 */
module.exports = Controller("AdminBaseController", function () {
    "use strict";
    return {
        init: function (http) {
            this.super_("init", http);
            this.Model = D("Activity/Activity");
        },

        _before_indexAction: function () {
            var name = I("activityname",this);
            var status = I("status",this);

            if(!isEmpty(name)){
                this.Map.name = ['like', '%'+name+'%'];
            }
            if(!isEmpty(status)){
                this.Map.status = status;
            }
            //查询参数反赋值
            this.assign("activityname",name);
            this.assign("status",status);
        },

        _before_addAction: function () {
            this.error('cao');
        }
    };
});