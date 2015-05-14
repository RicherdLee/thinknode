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
                return self.json(data);
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
        },

        test2Action: function () {
            var self = this;

            var id = I("id",this);

            //if(!isEmpty(id)){
            //return rp.get('http://ticket.cnautoshows.com/index.php/api/test/doCODE/id/'+id).promise().then(function (data) {
            //var options = {
            //    uri : 'http://newactivity.cnautoshows.com/index.php/api/ActivityAward/index',
            //    method : 'POST'
            //};

            //var info = JSON.parse(data);

            //var ps = [];
            //info.data.forEach(function (v,k) {
            //    //if(k>=100 && k<200){
            //        var form = {
            //            'code': v.deductionsnos
            //        };
            //        ps.push(rp.post(options).form(form).promise());
            //    //}
            //});
            //return Promise.all(ps).then(function (result) {
            //    return self.end(result);
            //});
            //});
            //}

            /**-------------**/

            //var code = ['05925069','05789105','05567241','05897156','05494263','05990616','05719547','05479121','05372879','05193509','05213412','05433216','05295521','05860583','05377339','05887235','05766242','05195971','05248106','05544818','05505734','05144275','05971284','05879854','05172347','05251646','05216213','05720977','05276428','05536117','05368428','05210912','05810367','05912818','05854692','05149105','05203441','05791755','05320204','05649209','05379261','05372889','05809427','05704775','05321564','05994977','05380481','05855242','05724427']//,'05450578','05857602','05804856','05668402','05581642','05636948','05500783','05912628','05465459','05844831','05601304','05872454','05154736','05731128','05730468','05595334','05182088','05152005','05187629','05334505','05328555','05980675','05103071','05794465','05754711','05747159','05493503','05249826','05351967','05915338','05733968','05819047','05662461','05329295','05685513','05632537','05864463','05593363','05720927','05622126','05494123','05214652','05417484','05828218','05463679','05376399','05238445','05970764','05545198','05809937','05822608','05408113','05959913','05955053','05743409','05198171','05292561','05864243','05542667','05532877','05599744','05722157','05570001','05852792','05421175','05535807','05873064','05551168','05576172','05241785','05716466','05640698','05256317','05270178','05813387','05351747','05774283','05225183','05314053','05395162','05225934','05783284','05230614','05984426','05212922','05479381','05337185','05355147','05369969','05919888','05485812','05437676','05279909','05117512','05166277','05866603','05534777','05192189','05755461','05706525','05219493','05574932','05134954','05972404','05157816','05947062','05674192','05387051','05922919','05973735','05306102','05939161','05139284','05983146','05686574','05686574','05234174','05122963','05726797','05645709','05906907','05489892','05225654','05173217','05489672','05178788','05558879','05747149','05312603','05457598','05284999','05438846','05699735','05198141','05456818','05593723','05118552','05778063','05911277','05135334','05557739','05215703','05803906','05100089','05820088','05749661','05601854','05604625','05373679','05263807','05600434','05679603','05492623','05155836','05428275','05543948'];
            //
            //var options = {
            //    uri : 'http://newactivity.cnautoshows.com/index.php/api/ActivityAward/index',
            //    method : 'POST'
            //};
            ////var form = {
            ////    'code': '05145185'
            ////};
            //
            //var ps = [];
            //code.forEach(function (v) {
            //    var form = {
            //        'code': v
            //    };
            //    ps.push(rp.post(options).form(form).promise());
            //});
            //return Promise.all(ps).then(function (result) {
            //    return self.json(result);
            //});

        }
    };
});