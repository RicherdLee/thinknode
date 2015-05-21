/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/5/18
 */
module.exports = Model("MongoModel",function () {
    return {
        //字段列表
        fields: {
            username:  {
                type: String,
                required:true //姓名非空
            },
            nickname: String,
            passwd:   String,
            age:{
                type: Number,
                min:18,       //年龄最小18
                max:120     //年龄最大120
            },
            createtime:{
                type: Date,
                default: Date.now
            }
        },
        //mongoose模块里创建Schema的选项
        schema_options: {
            autoindex: false,
            username:1
        }


    };
});