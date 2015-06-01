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
            return rp.post('http://app2.cnautoshows.com/index.php/api/GetExhibitionList').promise().then(function (data) {
                return data;
            }).then(function (data) {
                return rp.post('http://ticket.cnautoshows.com/index.php/api/GetProjectList/aaa/'+data.aaa).promise();
            }).then(function (rest) {
                self.assign('rest',rest);
                return self.display();
            });
            //var promise2 =
            //return Promise.all([promise1,promise2]).then(function (data) {
            //    return self.end(data[0]+'<br>'+data[1]);
            //});
        }
    };
});