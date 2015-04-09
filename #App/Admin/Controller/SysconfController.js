/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    15/3/25
 */
module.exports = Controller("AdminBaseController", function () {
    "use strict";
    return {
        sysConfigAction: function(){
            if(this.isPost()){

            }else{
                return this.display();
            }
        }
    };
});