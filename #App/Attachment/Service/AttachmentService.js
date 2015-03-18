/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14-10-21
 */
module.exports = Class(function(){
    "use strict";
    return {
        getFilePath: function(){
            var path = new Date().Format('YYYY/MM/DD') + "/";
            var tempPath = C("post_file_save_path") + path;
            if(!isDir(tempPath)){
                mkdir(tempPath);
            }
            return getPromise(path);
        },

        upload: function(file){
            var self = this;
            var filePath = '',fileUrl='';
            if(!isEmpty(file.originalFilename) && !isEmpty(file.path) && !isEmpty(file.size)){
                //检查文件类型
                var mime = require('mime');
                var mimetype = mime.extension(mime.lookup(file.path));
                var allowUploadType = C("post_file_allow_type");
                if(allowUploadType.split("|").indexOf(mimetype) <0 ){
                    return getPromise({"status":false,"info":"上传的文件类型非法"});
                }
                //检查文件大小
                var allowUploadSize = C("post_max_file_size");
                if(file.size > allowUploadSize){
                    return getPromise({"status":false,"info":"上传的文件大小超限"});
                }
                //var ext = file.originalFilename.split(".");
                var newFileName = md5(file.originalFilename + file.size) + "." + mimetype;
                //读取文件
                //return Promise.all([self.getFilePath(),mReadFile(file.path)]).then(function (data) {
                //    filePath = C("post_file_save_path") + data[0] + newFileName;
                //    fileUrl = C('post_file_save_url') + data[0] + newFileName;
                //    return mWriteFile(filePath,data[1]);
                //}).then(function () {
                //    return getPromise({"status":true,"info":fileUrl});
                //}).catch(function (e) {
                //    return getPromise({"status":false,"info":e});
                //});

                return self.getFilePath().then(function (path) {
                    filePath = C("post_file_save_path") + path + newFileName;
                    fileUrl = C('post_file_save_url') + path + newFileName;
                    return mReName(file.path,filePath);
                }).then(function () {
                    return getPromise({"status":true,"info":fileUrl});
                }).catch(function (e) {
                    //删除未成功上传的临时文件
                    try{
                        var fs = require("fs");
                        fs.unlink(file.path, fn);
                    }catch (e){}

                    return getPromise({"status":false,"info": e.toString()});
                });
            }else{
                return getPromise({"status":false,"info":"获取文件错误"});
            }
        }
    };
});