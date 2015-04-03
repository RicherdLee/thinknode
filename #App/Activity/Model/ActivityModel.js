/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/4/3
 */
module.exports = Model("CommonModel", function () {
    "use strict";
    return {
        tableName: 'activity',
        //验证字段,验证规则[,附加规则],错误提示[,验证时间(1新增 2编辑 null新增和编辑)]
        _validate : [
            {name: "name", valid: 'required', msg: "名称必填"},
            {name: "ruleid", valid: 'required', msg: "请选择规则"},
            {name: "prizeid", valid: 'required', msg: "请选择奖品"}
        ],
        //字段,自动填写的值[,完成时间(1新增 2编辑 null新增和编辑)]
        _auto:[
            {name: "starttime", value: php.time(),type: 1},
            {name: "endtime", value: php.time()}
        ]
    };
});