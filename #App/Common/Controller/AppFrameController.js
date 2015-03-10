/**
 * 项目基类
 * @author     Richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14-8-28
 */
module.exports = Controller(function(){
    "use strict";

    return {
        //各种缓存
        Cache:{},
        // 页面公共过滤条件
        Map:{},
        // 定义数据对象
        Model:'',
        // index列表分页查询SQL数组参数
        Mo:{sortasc:'',sortby:'',field:'*',ispage:true,pagesize:10},

        init: function(http){
            this.super("init", http);
        },

        _empty: function(){
            //this.redirect("/");
        }
    };
});