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
          this.display();
      }
  };
});