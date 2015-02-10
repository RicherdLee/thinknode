/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14/10/31
 */
module.exports = Model('CommonModel',function(){
    "use strict";
    return {
        tableName: 'User',
        //验证字段,验证规则[,附加规则],错误提示[,验证时间(1新增 2编辑 null新增和编辑)]
        _validate : [
            {name: "username", valid: 'required', msg: "用户名必填"},
            {name: "nickname", valid: 'required', msg: "姓名必填"},
            {name: "email", valid: "email", msg: "email格式不正确"},
            {name: "password", valid: 'required', msg:"密码不能为空" ,type: 1},
            {name: "password", valid: ["length"], length_args: [6, 20], msg:"密码长度至少6位" ,type: 2},
            {name: "role_id", valid: "required", msg:"用户角色必须" ,type: 1},
            //{name: "username", valid: "function",func_name:"checkName", msg: "username不合法"}
        ],
        //字段,自动填写的值[,完成时间(1新增 2编辑 null新增和编辑)]
        _auto:[
            {name: "create_time", value: php.time(),type: 1},
            {name: "update_time", value: php.time()},
            {name: "birthday", value: "function",func_name:"autoBirthday"},
            {name: "password", value: "function",func_name:"autoPassword"}
        ],

        /*checkName: function (data) {
            return true;
        },*/

        autoPassword: function(data){
            if(!isEmpty(data.password)){
                return md5(data.password);
            }
        },

        autoBirthday: function (data) {
            if(!isEmpty(data.birthday)){
                return php.strtotime(data.birthday);
            }
        },

        _afterSelect: function (result) {
            var ps = [];
            result.forEach(function (v) {
                if (v.role_id > 0) {
                    ps.push(M("AuthRole").field("desc").where({id: v.role_id}).find().then(function (s) {
                        v.role_name = s.desc;
                        return v;
                    }));
                } else {
                    v.role_name = "";
                    ps.push(v);
                }
            });
            return Promise.all(ps).then(function (data) {
                return data;
            });
        },

        _afterFind: function(result){
            if(result.birthday > 0){
                result.birthday = php.date("Y-m-d",result.birthday.toString());
            }else{
                result.birthday = '';
            }
            return result;
        }
    }
});