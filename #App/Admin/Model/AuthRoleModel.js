/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14/11/19
 */
module.exports = Model("CommonModel", function () {
    "use strict";
    return {
        tableName: 'auth_role',
        //验证字段,验证规则[,附加规则],错误提示[,验证时间(1新增 2编辑 null新增和编辑)]
        _validate : [
            {name: "desc", valid: 'required', msg: "名称必填"},
            {name: "rule_ids", valid: 'required', msg: "请选择规则"}
        ],
        //字段,自动填写的值[,完成时间(1新增 2编辑 null新增和编辑)]
        _auto:[
            {name: "rule_ids", value: "function",func_name:"autoRuleIds"}
            //{name: "username", value: "function",func_name:"autoName"}
        ],

        autoRuleIds: function(data){
            if(data.rule_ids !== undefined){
                if(isArray(data.rule_ids)){
                    return php.implode(',',data.rule_ids);
                }else{
                    return data.rule_ids;
                }
            }
        },

        _afterFind: function(result){
            var ps = [];
            if(!isEmpty(result.rule_ids)){
                var rule_ids = result.rule_ids.split(',');
                ps.push(M("AuthRule").field("desc").where({id:["in",rule_ids]}).find().then(function (data) {
                    result.rule_names = data.desc;
                    result.rule_ids = rule_ids;
                    return result;
                }));
            }else{
                result.rule_names = [];
                result.rule_ids = [];
                ps.push(result);
            }
            return Promise.all(ps).then(function (data) {
                return data;
            });
        }




    };
});