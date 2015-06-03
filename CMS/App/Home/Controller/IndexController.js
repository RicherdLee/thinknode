/**
 * controller
 * @return
 */
module.exports = Controller("AppFrameController", function () {
    "use strict";
    return {
        init: function (http) {
            this.super("init", http);
        },
        indexAction: function () {
            this.json(["Hello ThinkNode!", "A Node.js MVC Framework Based on Promise"]);
        }
    };
});