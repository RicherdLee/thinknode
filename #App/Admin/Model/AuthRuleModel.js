/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14/11/17
 */
module.exports = Model("CommonModel", function () {
    "use strict";
    return {
        //tableName: 'auth_rule',
        //验证字段,验证规则[,附加规则],错误提示[,验证时间(1新增 2编辑 null新增和编辑)]
        _validate : [
            {name: "desc", valid: 'required', msg: "规则名称必填"}
        ],

        _afterSelect: function(result){
            var ps = [];
            result.forEach(function (v) {
                if(v.pid > 0){
                    ps.push(M("AuthRule").field("desc").where({id: v.pid}).find().then(function (s) {
                        v.pname = s.desc;
                        return v;
                    }));
                }else{
                    v.pname = '';
                    ps.push(v);
                }
            });
            return Promise.all(ps).then(function (data) {
                return data;
            });
        },

        _afterFind: function(result){
            var ps = [];
            if(result.pid > 0){
                ps.push(this.field("desc").where({id:result.pid}).find().then(function (data) {
                    result.pname = data.desc;
                    return result;
                }));
            }else{
                result.pname = '';
                ps.push(result);
            }
            return Promise.all(ps).then(function (data) {
                return data;
            });
        },

        _beforeAdd: function(data){
            if(data.pid !== undefined){
                if(data.pid.indexOf("-") > -1){
                    var pidArr = data.pid.split('-');
                    data.pid = pidArr[0];
                    data.level = parseInt(pidArr[1])  + 1;
                }else{
                    data.level = 1;
                }
            }
            return data;
        },

        _beforeUpdate: function(data){
            return this._beforeAdd(data);
        }
    };
});