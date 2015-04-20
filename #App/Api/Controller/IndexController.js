/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/4/15
 */
var rp = require('request-promise');
module.exports = Controller("AppFrameController", function () {
    "use strict";
    return {
        indexAction: function () {
            return this.json(["Hello ThinkNode!","A Node.js MVC Framework Based on Promise"]);
        }
    };
});