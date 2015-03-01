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
          if(this.isPost()){
              //获取上传的图片文件
              var vBImg = this.file('file_upload');
              echo(vBImg);
              var fs = require('fs');
              //读取文件
              fs.readFile(vBImg.path, function(err, data) {
                  if (err) {
                      console.log('There was an error when reading file');
                  } else {
                      //写入文件到uplaod
                      fs.writeFile(C("post_file_save_path") + vBImg.originalFilename, data, function(err) {
                          if (err) {
                              console.log('There was an error when write file');
                          } else {
                              console.log('saved');
                          }
                      });
                  }
              });
          }else{
              this.display();
          }
      }
  };
});