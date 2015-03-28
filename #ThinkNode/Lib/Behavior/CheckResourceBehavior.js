var fs = require('fs');
var mime = require('mime');
var path = require('path');
var zlib = require('zlib');
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
            var file = THINK.ROOT_PATH + '/' + decodeURI(pathname);
            //正则判断是否文件
            //var urlReg = new RegExp(/[^\/]+\/([^\.]*)\/([^\/]+\.[^\/\.]+)$/);
            //if (!!file.match(urlReg)) {
            if (isFile(file)) {
                var res = this.http.res;
                var req = this.http.req;
                var contentType = mime.lookup(file);
                res.setHeader('Content-Type', contentType + '; charset=' + C('encoding'));
                var acceptEncoding = "Accept-Encoding".toLowerCase();
                var fileStream = fs.createReadStream(file);
                if ((req.headers[acceptEncoding] || '').indexOf('gzip') != -1 && contentType.match(/(javascript|css)/)) {
                    res.setHeader('Content-Encoding', 'gzip');
                    var gzip = fileStream.pipe(zlib.createGzip());
                    gzip.pipe(res);
                    gzip.on('end', function () {
                        res.end();
                    });
                } else {
                    fileStream.pipe(res);
                    fileStream.on('end', function () {
                        res.end();
                    });
                }
            } else {
                res.statusCode = 404;
                res.end();
            }
            //返回一个pendding promise, 不让后续执行
            return getDefer().promise;
        }
    };
});