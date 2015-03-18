var zlib = require('zlib');

/**
 * Gzip压缩
 */
module.exports = Behavior(function () {
    return {
        run: function (content) {
            var self = this;
            var deferred = getDefer();
            if (self.http.headers["accept-encoding"].indexOf("gzip") != -1) {
                self.gzip(content, self.http, deferred);
            } else if (self.http.headers["accept-encoding"].indexOf("deflate") != -1) {
                self.deflate(content, self.http, deferred);
            } else {
                return content;
            }
            //if (self.http.headers["accept-encoding"].indexOf("gzip") != -1) {
            //    self.gzip(content, self.http, deferred);
            //} else {
            //    return content;
            //}
            return deferred.promise;
        },
        gzip: function (content, http, deferred) { //检测是否是手机访问
            zlib.gzip(content, function (err, data) {
                if (!err) {
                    http.res.setHeader("Content-Encoding", "gzip");
                    deferred.resolve(data);
                } else {
                    deferred.resolve(content);
                }
            });
        },
        deflate: function (content, http, deferred) { //检测是否是手机访问
            zlib.deflate(content, function (err, data) {
                if (!err) {
                    http.res.setHeader("Content-Encoding", "deflate");
                    deferred.resolve(data);
                } else {
                    deferred.resolve(content);
                }
            });
        }
    }
});