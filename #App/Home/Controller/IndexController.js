/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/5/20
 */
module.exports = Controller("AppFrameController", function(){
  "use strict";
  return {
    init: function (http) {
      this.super_("init", http);
    },
    indexAction: function(){
        var self = this;
        return this.json(["Hello ThinkNode!","A Node.js MVC Framework Based on Promise"]);
    }
  };
});