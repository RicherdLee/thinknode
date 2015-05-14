/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    14-8-29
 */
module.exports = Model(function(){
    "use strict";
    return {
        /**
         * 根据查询条件生成分页结果列表
         * @param model
         * @param map
         * @param mo
         * @private
         */
        _list: function(model,map,mo){
            if(isEmpty(model)){
                return getPromise(null);
            }else{
                if(isEmpty (mo.sortasc)){
                    mo.sortasc = ' DESC';
                }
                if(isEmpty (mo.field)){
                    mo.field = ' * ';
                }
                if(isEmpty (mo.ispage)){
                    mo.ispage = true;
                }
                if(isEmpty (mo.pagesize)){
                    mo.pagesize = 20;
                }
                if(isEmpty(map)){
                    map = ' 1 = 1 ';
                }

                if(isEmpty (mo.sortby)){
                    var pkPromise = getPromise(model.getPk());
                    return pkPromise.then(function (pk) {
                        if(mo.ispage == true){
                            return model.field(mo.field).where(map).order(getObject(pk,mo.sortasc)).page(mo.page,mo.pagesize).countSelect();
                        }else{
                            return model.field(mo.field).where(map).order(getObject(pk,mo.sortasc)).select();
                        }
                    });
                }else{
                    if(mo.ispage == true){
                        return model.field(mo.field).where(map).order(getObject(mo.sortby,mo.sortasc)).page(mo.page,mo.pagesize).countSelect();
                    }else{
                        return model.field(mo.field).where(map).order(getObject(mo.sortby,mo.sortasc)).select();
                    }
                }
            }
        }
    }
});