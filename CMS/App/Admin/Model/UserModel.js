/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    14/10/31
 */
module.exports = Model('CommonModel',function(){
    "use strict";
    return {
        tableName: 'User',

        //定义数据校验的字段
        fields: {
            username: {
                valid: ['required'],
                msg: {
                    required: '用户名必填'
                }
            },
            nickname: {
                valid: ['required'],
                msg: {
                    required: '姓名必填'
                }
            },
            email: {
                valid: ['email'],
                msg: {
                    required: 'email格式不正确'
                }
            }
        },

        _beforeAdd: function (data) {
            this.fields = extend(this.fields,{
                password: {
                    valid: ['required', 'length'],
                    length_args: [6],
                    msg: {
                        required: '密码不能为空',
                        length: '密码长度至少6位'
                    }
                },
                role_id: {
                    valid: ['required'],
                    msg: {
                        required: '用户角色必须'
                    }
                }
            });
            data.create_time = php.time();
            data.update_time = php.time();
            data.birthday = this.autoBirthday(data);
            if(!isEmpty(data.password)){
                data.password = this.autoPassword(data);
            }
            return data;
        },

        _beforeUpdate: function (data) {
            data.update_time = php.time();
            data.birthday = this.autoBirthday(data);
            if(!isEmpty(data.password)){
                data.password = this.autoPassword(data);
            }
            return data;
        },

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