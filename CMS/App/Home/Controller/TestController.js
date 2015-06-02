/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/4/10
 */
var rp = require('request-promise');
module.exports = Controller("AppFrameController", function () {
    "use strict";
    return {

        indexAction: function () {
            var self = this;
            return rp('http://ticket.cnautoshows.com/index.php/api/GetProjectList').promise().then(function (data) {
                self.assign('info',data);
                return self.display();
            }).catch(function (e) {
                console.log(e);
            });

        },

        testAction: function () {
            var self = this;
            //var options = {
            //    uri : 'http://ticket.cnautoshows.com/index.php/api/GetProjectGoodsInfoList/index',
            //    method : 'POST'
            //};
            //var form = {
            //    'projectid': 5,
            //    'tchannelid': 13
            //};
            //return rp.post(options).form(form).promise().then(function (data) {
            //    return self.end(data);
            //}).catch(function (e) {
            //    console.log(e);
            //});
        }
    };
});