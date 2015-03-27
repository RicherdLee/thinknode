/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14-10-21
 */
var fs = require("fs");

module.exports = Class(function(){
    "use strict";
    return {
        handle: null,

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
                    return getPromise({"errno":403,"errmsg":"上传的文件类型非法","data":{}});
                }
                //检查文件大小
                var allowUploadSize = C("post_max_file_size");
                if(file.size > allowUploadSize){
                    return getPromise({"errno":403,"errmsg":"上传的文件大小超限","data":{}});
                }
                //var ext = file.originalFilename.split(".");
                var newFileName = md5(file.originalFilename + file.size) + "." + mimetype;
                var uploadType = C("post_file_upload_type");

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
                    if(uploadType == 'ftp'){
                        return self.doUploadFtp(file.path,path,newFileName);
                    }else if(uploadType == 'aliyun'){
                        return self.doUploadAliyun(file.path,path,newFileName);
                    }else if(uploadType == 'aws'){
                        return self.doUploadAws(file.path,path,newFileName);
                    }else{
                        return self.doUploadLocal(file.path,path,newFileName);
                    }
                }).then(function (data) {
                    return getPromise({"errno":0,"errmsg":"","data":{filename:newFileName,fileurl:data,filesize:file.size}});
                }).catch(function (e) {
                    return getPromise({"errno":500,"errmsg":e.toString(),"data":{}});
                });
            }else{
                return getPromise({"errno":500,"errmsg":"获取文件错误","data":{}});
            }
        },
        //本地上传
        doUploadLocal: function (srcfile, filepath, filename) {
            return mReName(srcfile,C("post_file_save_path") + filepath + filename).then(function () {
                return C('post_file_save_url') + filepath + filename;
            });
        },
        //FTP上传
        doUploadFtp: function (srcfile, filepath, filename) {
            var ftp = require("ftp");
            var config = {
                host:C("ftp_server"),
                port:C("ftp_port"),
                user:C("ftp_user"),
                password:C("ftp_pwd")
            };

            return new Promise(function (fulfill, reject){
                var client = new ftp();
                client.on('ready', function () {
                    client.mkdir(filepath,true, function (err) {
                        if (err) {
                            reject(err);
                        }else {
                            client.put (srcfile, filepath + filename,function (err, res){
                                if (err) {
                                    reject(err);
                                }else {
                                    //删除临时文件
                                    var fn = function(){};
                                    try{
                                        fs.unlink(srcfile, fn);
                                    }catch (e){}
                                    fulfill(C("ftp_url") + filepath + filename);
                                }
                            });
                        }
                    });
                });
                client.connect(config);
            });

        },
        //阿里云上传
        doUploadAliyun: function (srcfile, filepath, filename) {

        },
        //亚马逊AWS上传
        doUploadAws: function(srcfile, filepath, filename){

        }

    };
});