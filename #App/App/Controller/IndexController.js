/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/4/15
 */
var rp = require('request-promise');
module.exports = Controller("AppFrameController", function () {
    "use strict";
    return {
        indexAction: function () {
            return this.json('test');
        }
    };
});