/**
 * 权限认证
 * 需要创建如下的数据表
  
DROP TABLE IF EXISTS `think_auth_role`;
CREATE TABLE `think_auth_role` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `desc` varchar(255) NOT NULL DEFAULT '',
  `status` tinyint(11) NOT NULL DEFAULT '1',
  `rule_ids` varchar(255) DEFAULT '' COMMENT '含有的权限列表',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `think_auth_rule`;
CREATE TABLE `think_auth_rule` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '名称',
  `desc` varchar(255) NOT NULL DEFAULT '' COMMENT '描述',
  `pid` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '父级id',
  `status` tinyint(11) NOT NULL DEFAULT '1',
  `condition` varchar(255) DEFAULT '' COMMENT '附加条件',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `status` (`status`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `think_auth_user_role`;
CREATE TABLE `think_auth_user_role` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_role` (`user_id`,`role_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

 * @type {[type]}
 */
module.exports = Class({
  /**
   * 初始化
   * @param  int userId 当前登录用户的id
   * @param  obj config 配置项
   * @return this        
   */
  init: function(userId, config){
    'use strict';
    if (isObject(userId)) {
      config = userId;
      userId = config.id;
    }
    //当前检测的用户id
    this.userId = userId;
    //这里不能使用默认的深度复制，因为http对象包含了一些循环引用的对象
    this.config = extend(false, {
      type: 1, //认证方式，1为实时认证，2为SESSION认证。如果检测非当前登录用户，则不能使用SESSION认证。
      http: null, //如果type为2，那么必须传入http对象
      user: 'user', //用户信息表
      role: 'auth_role', //角色表
      rule: 'auth_rule', //规则表 
      user_role: 'auth_user_role', //用户-角色关系表
      userInfo: null //用户详细信息，用户condition判断。如果没有自动从User表里查询
    }, config);
  },
  /**
   * 检测权限，可以一次检测多个权限
   * @param  {[type]} name  [description]
   * @param  {[type]} and [description]
   * @return {[type]}       [description]
   */
  check: function(name, and){
    'use strict';
    if (isString(name)) {
      name = name.split(',');
    }
    return this.getAuthList().then(function(authList){
      if (name.length === 1) {
        return authList.indexOf(name[0]) > -1;
      }
      var logic = and ? 'every' : 'some';
      return name[logic](function(item){
        return authList.indexOf(item) > -1;
      })
    });
  },
  /**
   * 获取权限列表
   * @return {[type]} [description]
   */
  getAuthList: function(){
    'use strict';
    var authPromise;
    if (this.config.type === 1) {
      authPromise = this.flushAuthList();
    }else{
      var http = this.config.http;
      var self = this;
      //存在Session里的authList Key
      var key = 'think_auth_list';
      if (!http) {
        return getPromise("config.http can't be null", true);
      }
      thinkRequire('Session').start(http);
      authPromise = http.session.get(key).then(function(data){
        if (!isEmpty(data)) {
          return data;
        }
        return self.flushAuthList().then(function(data){
          http.session.set(key, data);
          return data;
        })
      })
    }
    var userInfoPromise = this.getUserInfo();
    return Promise.all([authPromise, userInfoPromise]).then(function(data){
      var authList = data[0];
      var userInfo = data[1];
      var result = [];
      authList.forEach(function(item){
        if (!item.condition) {
          result.push(item.name);
        }else{
          var condition = item.condition.replace(/\w+/, function(a){
            return 'userInfo.' + a;
          });
          /*jslint evil: true */
          var fn = new Function('userInfo', 'return ' + condition);
          var flag = fn(userInfo);
          if (flag) {
            result.push(item.name);
          }
        }
      })
      return result;
    })
  },
  /**
   * 刷新权限列表，从数据库中拉取
   * @return {[type]} [description]
   */
  flushAuthList: function(){
    'use strict';
    var self = this;
    return this.getRuleIds().then(function(ids){
      return M().field('name,condition').table(self.config.rule).where({id: ['IN', ids], status: 1}).select();
    });
  },
  /**
   * 获取用户信息
   * @return {[type]} [description]
   */
  getUserInfo: function(){
    'use strict';
    if (!isEmpty(this.config.userInfo)) {
      return getPromise(this.config.userInfo);
    }
    var self = this;
    return M().table(self.config.user).where({id: this.userId}).find().then(function(data){
      self.config.userInfo = data;
      return data;
    })
  },
  /**
   * 获取用户权限rule id列表
   * @return {[type]} [description]
   */
  getRuleIds: function(){
    'use strict';
    return this.getRoles().then(function(data){
      var ids = [];
      data.forEach(function(item){
        var ruleIds = (item.rule_ids || '').split(',');
        ids = ids.concat(ruleIds);
      })
      return ids;
    })
  }, 
  /**
   * 获取用户角色列表
   * @return {[type]} [description]
   */
  getRoles: function(){
    'use strict';
    var model = M();
    return model.table(this.config.user_role).alias('a').join({
      table: this.config.role,
      as: 'b',
      on: ['role_id', 'id']
    }).where({
      'a.user_id': this.userId,
      'b.status': 1
    }).select();
  }
});