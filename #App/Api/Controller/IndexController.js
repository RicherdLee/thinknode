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

            var id = I("id",this);

            if(!isEmpty(id)){
                return rp.get('http://ticket.cnautoshows.com/index.php/api/test/doCODE/id/'+id).promise().then(function (data) {
                    var options = {
                        uri : 'http://newactivity.cnautoshows.com/index.php/api/ActivityAward/index',
                        method : 'POST'
                    };

                    var info = JSON.parse(data);

                    var ps = [];
                    info.data.forEach(function (v,k) {
                        //if(k>=100 && k<200){
                            var form = {
                                'code': v.deductionsnos
                            };
                            ps.push(rp.post(options).form(form).promise());
                        //}
                    });
                    return Promise.all(ps).then(function (result) {
                        return self.echo(result);
                    });
                });
            }

            this.end();

        }
    };
});