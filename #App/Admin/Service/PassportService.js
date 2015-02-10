/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    CC BY-NC-ND
 * @version    14-10-21
 */
module.exports = Class(function(){
    "use strict";
    return {

        loginAdmin: function (username, password, clientIp) {
            if (isEmpty(username) || isEmpty(password)) {
                return getPromise({});
            }

            return this.getAdminUser(username, password).then(function (data) {
                if (!isEmpty(data)) {
                    var timestamp = php.time();
                    M().table('user').where({'id': data.id}).update({'last_login_time': timestamp, 'last_login_ip': clientIp});
                }
                return data;
            });
        },

        getAdminUser: function (username, password) {
            var model = M();
            return model.table('user').alias('user').join({
                table: 'auth_role',
                as: 'role',
                on: ['role_id', 'id']
            }).field('user.id,user.username,user.nickname,user.bind_account,user.last_login_time,user.last_login_ip,user.email,user.role_id,role.desc as role_name')
                .where({
                    'user.username': username,
                    'user.password': md5(password),
                    'user.status': 1
                }).find();
        }
    };
});