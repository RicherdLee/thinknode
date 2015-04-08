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
        init: function (http) {
            this.super('init',http);
            //各种缓存
            this.Cache = {};
            // 页面公共过滤条件
            this.Map = {};
            // 定义数据对象
            this.Model = '';
            // index列表分页查询SQL数组参数
            this.Mo = {sortasc:'',sortby:'',field:'*',ispage:true,pagesize:10};
        },

        _empty: function(){
            this.redirect("/");
        }
    };
});