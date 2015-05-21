/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/5/20
 */
module.exports = Controller("AppFrameController", function(){
    "use strict";
    return {
        init: function (http) {
            this.super_("init", http);
        },
        indexAction: function(){
            var self = this;
            var userData = {username:'test',nickname:'test',passwd:'5555555555'};
            //return D("Home/user").add(userData).then(function (data) {
            //     self.json(data);
            //});
            return D("Home/User").where({_id:'54fd89f32744ccbbd96c2d60'}).countSelect().then(function (data) {
                self.json(data);
                return D("Home/User").getLastSql().then(function (sql) {
                    return self.json(sql);
                });
            });
        }
    };
});