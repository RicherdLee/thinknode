/**
 * 定位模版路径
 * @return {[type]} [description]
 */

module.exports = Behavior(function () {
    'use strict';
    return {
        run: function (templateFile) {
            templateFile = templateFile || '';
            if (!templateFile) {
                //根据group, controller, action自动生成
                templateFile = [
                    THINK.APP_PATH, '/',
                    this.http.group,
                    '/View/',
                    C('tpl_default_theme') || 'default',
                    '/',
                    this.http.controller.toLowerCase(),
                    C('tpl_file_depr'),
                    this.http.action.toLowerCase(),
                    C('tpl_file_suffix')
                ].join('');
            } else if (templateFile.indexOf('/') > -1) {
                //自动追加VIEW_PATH
                if (templateFile.indexOf('/') !== 0) {
                    templateFile = THINK.APP_PATH + '/' + templateFile;
                }
            } else if (templateFile.indexOf(C('tpl_file_suffix')) === -1) {
                var path = templateFile.split(':');
                var action = path.pop();
                var controller = path.pop() || this.http.controller.toLowerCase();
                var group = ucfirst(path.pop() || this.http.group);
                templateFile = [
                    THINK.APP_PATH,
                    '/',
                    group,
                    '/View/',
                    C('tpl_default_theme') || 'default',
                    '/',
                    controller,
                    C('tpl_file_depr'),
                    action,
                    C('tpl_file_suffix')
                ].join('');
            }
            return templateFile;
        }
    };
});