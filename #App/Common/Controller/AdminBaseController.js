/**
 * 后台基类
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14-8-29
 */
module.exports = Controller("AppFrameController", function () {
    "use strict";

    return {
        //定义是后台
        inAdmin: true,

        init: function (http) {
            this.super_("init", http);
            //初始化项目和用户
            return Promise.all([this.initSite(),this.initUser()]);
        },

        //初始化项目
        initSite: function () {
            var self = this;

            ////初始化配置
            //var Config = F("Config");
            //this.assign("Config",Config);
        },
        //初始化用户
        initUser: function () {
            var self = this;
            //判断用户是否登录
            return this.session("userInfo").then(function (user) {
                if (isEmpty(user)) {
                    //ajax访问返回一个json的错误信息
                    if (self.isAjax()) {
                        return self.error("用户未登录，不能访问");
                    } else {
                        //跳转到登录页
                        return self.redirect("/Admin/Public/login",302);
                    }
                } else {
                    return authCheck(self.http.group, self.http.controller, self.http.action, user, 2, 'or', self.http).then(function (check) {
                        if (check == false || check == "false") {
                            //ajax访问返回一个json的错误信息
                            if (self.isAjax()) {
                                return self.error("没有权限");
                            } else {
                                //跳转到错误页
                                return self.redirect("/Admin/Public/error/errmsg/没有权限",302);
                            }
                        }
                        //将用户信息赋值到模版变量里，供模版里使用
                        self.assign("userInfo", user);
                    });
                }
            }).catch(function (e) {
                //跳转到错误页
                return self.redirect("/Admin/Public/error/errmsg/请重新登录再操作",302);
            });
        },

        indexAction: function () {
            this.Mo.page = I("page", this) || 1;
            var self = this;
            if (!isEmpty(this.Model)) {
                return D("Common")._list(this.Model, this.Map, this.Mo).then(function (data) {
                    self.assign("data", data);
                    self.assign('pagerData', data);
                    return self.display();
                }).catch(function (e) {
                    return self.error(e.toString());
                });
            }
        },

        addAction: function () {
            var self = this;
            if (this.isPost()) {
                if (!isEmpty(this.Model)) {
                    //表单令牌验证
                    if (C('token_on')) {
                        if (this.token(this.post(C('token_name')))) {
                            return this.error("表单令牌失效");
                        }
                    }
                    return this.Model.add(I('', this, 'post')).then(function (data) {
                        return self.success("操作成功");
                    }).catch(function (e) {
                        return self.error(e.toString());
                    });
                }

            } else {
                this.display();
            }
        },

        editAction: function () {
            var self = this;
            var id = I("id", this);
            if (!isEmpty(this.Model)) {
                if (this.isPost()) {
                    //表单令牌验证
                    if (C('token_on')) {
                        if (this.token(this.post(C('token_name')))) {
                            return this.error("表单令牌失效");
                        }
                    }
                    return this.Model.update(I('', this, 'post')).then(function (data) {
                        return self.success("操作成功");
                    }).catch(function (e) {
                        return self.error(e.toString());
                    });
                } else {
                    return getPromise(this.Model.getPk()).then(function (pk) {
                        return self.Model.where(getObject(pk, id)).find().then(function (data) {
                            self.assign("info", isArray(data) ? data[0] : data);
                            return self.display();
                        });
                    });
                }
            }
        },

        delAction: function () {
            var self = this;
            var ids = I("id", this);
            if (isEmpty(ids)) {
                ids = I("ids", this);
            }
            if (isEmpty(ids)) {
                return this.error("没有选择要操作的对象");
            }
            if (!isArray(ids)) {
                ids = ids.split(',');
            }

            if (!isEmpty(this.Model)) {
                var promises = ids.map(function (id) {
                    return getPromise(self.Model.getPk()).then(function (pk) {
                        var model = D(self.Model);
                        return model.where(getObject(pk, id)).delete();
                    });
                });
                return Promise.all(promises).then(function () {
                    return self.success("操作成功");
                }).catch(function (e) {
                    return self.error(e.toString());
                });
            }
        },

        sortAction: function () {
            var self = this;
            var ids = I("ids", this, "post");

            if (isEmpty(ids)) {
                return this.error("没有选择要操作的对象");
            }
            if (!isArray(ids)) {
                ids = ids.split(',');
            }
            if (!isEmpty(this.Model)) {
                var promises = ids.map(function (id) {
                    var sort = (function () {
                        return getPromise(self.Model.getPk()).then(function (pk) {
                            var listOrder = I("listorders-" + id, self, "post");
                            var model = D(self.Model);
                            return model.where(getObject(pk, id)).update({listorders: listOrder});
                        });
                    }());

                    return sort;
                });
                return Promise.all(promises).then(function () {
                    return self.success("操作成功");
                }).catch(function (e) {
                    return self.error(e.toString());
                });
            }
        },

        viewAction: function () {
            var self = this;
            var id = I("id", this);
            if (!isEmpty(this.Model)) {
                return getPromise(this.Model.getPk()).then(function (pk) {
                    return self.Model.where(getObject(pk, id)).find().then(function (data) {
                        self.assign("info", isArray(data) ? data[0] : data);
                        return self.display();
                    });
                });
            }
        },

        copyAction: function () {
            var self = this;
            var id = I("id", this);
            if (!isEmpty(this.Model)) {
                if (this.isPost()) {
                    //表单令牌验证
                    if (C('token_on')) {
                        if (this.token(this.post(C('token_name')))) {
                            return this.error("表单令牌失效");
                        }
                    }
                    return this.Model.add(I('', this, 'post')).then(function (data) {
                        return self.success("操作成功");
                    }).catch(function (e) {
                        return self.error(e.toString());
                    });
                } else {
                    return getPromise(this.Model.getPk()).then(function (pk) {
                        return self.Model.where(getObject(pk, id)).find().then(function (data) {
                            self.assign("info", isArray(data) ? data[0] : data);
                            return self.display();
                        });
                    });
                }
            }
        }

    };
});