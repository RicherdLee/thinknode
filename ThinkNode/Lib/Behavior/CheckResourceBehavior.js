var mime = require('mime');
var path = require('path');
/**
 * 静态资源请求
 * @return {[type]} [description]
 */
module.exports = Behavior(function () {
    'use strict';
    return {
        options: {
            'url_resource_on': false
        },
        run: function () {
            var url_resource_on = C('url_resource_on');
            if (!url_resource_on || !this.http.pathname) {
                return false;
            }
            var pathname = this.http.pathname;
            if (pathname.indexOf('/') === 0) {
                pathname = pathname.substr(1);
            }
            //通过正则判断是否是静态资源请求
            var reg = C('url_resource_reg');
            if (!reg.test(pathname)) {
                return false;
            }
            pathname = path.normalize(pathname);
            var file = THINK.RESOURCE_PATH + '/' + decodeURI(pathname);
            //正则判断是否文件
            //var urlReg = new RegExp(/[^\/]+\/([^\.]*)\/([^\/]+\.[^\/\.]+)$/);
            //if (!!file.match(urlReg)) {
            var res = this.http.res;
            if (isFile(file)) {
                var contentType = mime.lookup(file);
                res.setHeader('Content-Type', contentType + '; charset=' + C('encoding'));
                tag('resource_output', this.http, file);
            }else{
                res.statusCode = 404;
                this.http.end();
            }
            //返回一个pendding promise, 不让后续执行
            return getDefer().promise;
        }
    };
});