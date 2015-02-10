/**
 * 路由识别
 * @type {Object}
 */
var Dispatcher = module.exports = Class(function(){
  'use strict';
  return {
    /**
     * 初始化
     * @param  {[type]} http [description]
     * @return {[type]}      [description]
     */
    init: function(http){
      this.http = http;
    },
    /**
     * 准备pathanem
     * @return {[type]} [description]
     */
    preparePathName: function(){
      var pathname = Dispatcher.splitPathName(this.http.pathname).join('/');
      //去除pathname前缀
      var prefix = C('url_pathname_prefix');
      if (prefix && pathname.indexOf(prefix) === 0) {
        pathname = pathname.substr(prefix.length);
      }
      //判断URL后缀
      var suffix = C('url_pathname_suffix');
      if (suffix && pathname.substr(0 - suffix.length) === suffix) {
        pathname = pathname.substr(0, pathname.length - suffix.length);
      }
      this.http.pathname = pathname;
    },
    /**
     * 解析pathname
     * @return {[type]} [description]
     */
    parsePathName: function(){
      if (this.http.group) {
        return true;
      }
      var paths = Dispatcher.splitPathName(this.http.pathname);
      //将group list变为小写
      var groupList = C('app_group_list');
      var group = '';
      var controller = '';
      var action = '';
      if (groupList.length && paths[0] && groupList.indexOf(paths[0].toLowerCase()) > -1) {
        group = paths[0];
      }
      if(paths[1]){
        controller = paths[1];
      }
      if(paths[2]){
        action = paths[2];
      }
      //解析剩余path的参数
      var tmpPaths = arrayRemove(paths,[0,1,2]);
      if (tmpPaths.length) {
        for(var i = 0,length = Math.ceil(tmpPaths.length) / 2; i < length; i++){
          this.http.get[tmpPaths[i * 2]] = tmpPaths[i * 2 + 1] || '';
        }
      }
      this.http.group = Dispatcher.getGroup(group);
      this.http.controller = Dispatcher.getController(controller);
      this.http.action = Dispatcher.getAction(action);
    },
    /**
     * run
     * @return {[type]} [description]
     */
    run: function(){
      var self = this;
      return tag('resource_check', this.http).then(function(){
        return self.preparePathName();
      }).then(function(){
        return tag('path_info', self.http);
      }).then(function(){
        return tag('route_check', self.http);
      }).then(function(){
        return self.parsePathName();
      });
    }
  };
});
/**
 * 分割pathname
 * @param  {[type]} pathname [description]
 * @return {[type]}          [description]
 */
Dispatcher.splitPathName = function(pathname){
  'use strict';
  var ret = [];
  var j = 0;
  pathname = pathname.split('/');
  for(var i = 0, length = pathname.length, item; i < length; i++){
    item = pathname[i].trim();
    if (item) {
      ret[j++] = item;
    }
  }
  return ret;
};
/**
 * 小驼峰命名正则转换
 * @type {RegExp}
 */
var sCamelReg = function(str){
    var re = /_(\w)/g;
    return str.replace(re, function(all,letter){
        return letter.toUpperCase();
    });
};
/**
 * 大驼峰命名正则转换
 * @type {RegExp}
 */
var bCamelReg = function(str){
    var re = /_(\w)/g;
    var rstr =  str.slice(1).replace(re, function(all,letter){
        return letter.toUpperCase();
    });
    return str[0].toUpperCase() + rstr;
};

/**
 * 获取group
 * @param  {[type]} group [description]
 * @return {[type]}       [description]
 */
Dispatcher.getGroup = function(group){
  'use strict';
  group = group || C('default_group');
  return bCamelReg(group);
};

/**
 * 检测Controller和Action是否合法的正则
 * @type {RegExp}
 */
var nameReg = /^[A-Za-z\_]\w*$/;
/**
 * 获取controller
 * @param  {[type]} controller [description]
 * @return {[type]}            [description]
 */
Dispatcher.getController = function(controller){
  'use strict';
  if (!controller) {
    return ucfirst(C('default_controller'));
  }else if (!nameReg.test(controller)) {
    return '';
  }
  return bCamelReg(controller);
};
/**
 * 获取action
 * @param  {[type]} action [description]
 * @return {[type]}        [description]
 */
Dispatcher.getAction = function(action){
  'use strict';
  if (!action) {
    return C('default_action');
  }else if (!nameReg.test(action)) {
    return '';
  }
  return sCamelReg(action);
};