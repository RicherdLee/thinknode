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
      //上传文件
      doUploadAction: function () {
          var self = this;
          if(this.isPost()){
              //获取上传的图片文件
              var vBImg = this.file('file_upload');
              return X("Attachment/Attachment").upload(vBImg).then(function (data) {
                  return self.json(data);
              });
          }else{
              var type = this.get("type") || 1;
              var allowUploadType = C("post_file_allow_type");
              if(type == 1){
                  allowUploadType = "jpg|jpeg|png|bmp|gif";
              }
              this.assign("type",type);
              this.assign("allowUploadType",allowUploadType);
              this.display();
          }
      },
      //上传前置检查
      publicCheckUploadAction: function(){
          var self = this;
          //判断用户是否登录
          return this.session("userInfo").then(function(user) {
              if (isEmpty(user)) {
                  self.json({"status":false,"info":"用户未登录，不能访问"});
              } else {
                  //检查用户权限
                  //...

                  self.json({"status":true,"info":""});
              }
          });
      },

      albumAction: function(){
          var self = this;
          this.display();
      }
  };
});