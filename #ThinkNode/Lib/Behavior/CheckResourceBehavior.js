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
            var urlReg= new RegExp(/[^\/]+\/([^\.]*)\/([^\/]+\.[^\/\.]+)$/);
            var flag = !!file.match(urlReg);

            var res = this.http.res;
            var req = this.http.req;
            if(flag){
                fs.stat(file, function (err, stats) {
                    if (err) {
                        res.statusCode = 404;
                        res.end();
                    } else {
                        var contentType = mime.lookup(file);
                        var exp_maxage = 30 * 24 * 3600;
                        var expires = new Date();
                        var lastModified = stats.mtime.toUTCString();
                        var ifModifiedSince = "If-Modified-Since".toLowerCase();
                        var acceptEncoding = "Accept-Encoding".toLowerCase();
                        expires.setTime(expires.getTime() + exp_maxage * 1000);
                        res.setHeader('Content-Type', contentType || "text/plain");
                        res.setHeader("Cache-Control", "max-age=" + exp_maxage);
                        res.setHeader("Expires", expires.toUTCString());
                        res.setHeader("Last-Modified", lastModified);
                        if (req.headers[ifModifiedSince] && lastModified == req.headers[ifModifiedSince]) {
                            res.writeHead(304, "Not Modified");
                            res.end();
                        } else {
                            var fileStream = fs.createReadStream(file);
                            if ((req.headers[acceptEncoding] || '').indexOf('gzip') != -1 && contentType.match(/(javascript|css)/)) {
                                res.setHeader('Content-Encoding', 'gzip');
                                var gzip = fileStream.pipe(zlib.createGzip());
                                gzip.pipe(res);
                                gzip.on('end', function () {
                                    res.end();
                                });
                            }else {
                                fileStream.pipe(res);
                                fileStream.on('end', function () {
                                    res.end();
                                });
                            }
                        }
                    }
                });
            }else{
                res.statusCode = 403;
                res.end();
            }
            //返回一个pendding promise, 不让后续执行
            return getDefer().promise;
        }
    };
});