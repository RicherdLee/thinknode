/**
 * controller
 * @return 
 */
module.exports = Controller("AppFrameController", function(){
  "use strict";
  return {
      init: function(http){
          this.super_("init", http);
          //this.Model = D("Attachment");
      },

      publicDoUploadAction: function () {
          var allowUploadType = C("post_file_allow_type");
          if(this.isPost()){
              //获取上传的图片文件
              var self = this;
              var vBImg = this.file('file_upload');
              var fs = require('fs');
              //读取文件
              fs.readFile(vBImg.path, function(err, data) {
                  if (err) {
                      console.log('There was an error when reading file');
                  } else {
                      //写入文件到uplaod
                      var filepath = C("post_file_save_path") + vBImg.originalFilename;
                      var fileurl = C('post_file_save_url') + vBImg.originalFilename;
                      fs.writeFile(filepath, data, function(err) {
                          if (err) {
                              console.log('There was an error when write file');
                              return self.json({"status":false,"info":"There was an error when write file"});
                          } else {
                              console.log('saved');
                              return self.json({"status":true,"info":fileurl});
                          }
                      });
                  }
              });
          }else{
              var type = this.get("type") || 1;
              if(type == 1){
                  allowUploadType = "jpg|jpeg|png|bmp|gif";
              }
              this.assign("type",type);
              this.assign("allowUploadType",allowUploadType);
              this.display();
          }
      },

      publicCheckUploadAction: function(){
          this.json({"status":true,"info":""});
      }
  };
});