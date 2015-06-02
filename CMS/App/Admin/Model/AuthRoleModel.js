/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    14/11/19
 */
module.exports = Model("CommonModel", function () {
    "use strict";
    return {
        tableName: 'auth_role',

        //定义数据校验的字段
        fields: {
            desc: {
                valid: ['required'],
                msg: {
                    required: '名称必填'
                }
            },
            rule_ids: {
                valid: ['required'],
                msg: {
                    required: '请选择规则'
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