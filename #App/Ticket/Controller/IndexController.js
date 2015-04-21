/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/4/15
 */
var rp = require('request-promise');
module.exports = Controller("AppFrameController", function () {
    "use strict";
    return {
        indexAction: function () {
            var self = this;
            return this.display();
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