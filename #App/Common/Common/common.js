/**
 *
 * @author     richen
 * @copyright  Copyright (c) 2014- <ric3000(at)163.com>
 * @license    MIT
 * @version    15/2/4
 */

//加载 phpjs 扩展
global.php = thinkRequire("phpjs");

//---------------------------------------------------
// 日期格式化
// 格式 YYYY/yyyy/YY/yy 表示年份
// MM/M 月份
// W/w 星期
// dd/DD/d/D 日期
// hh/HH/h/H 时间
// mi 分钟
// ss/SS/s/S 秒
//---------------------------------------------------
Date.prototype.Format = function (formatStr) {
    var str = formatStr;
    var Week = ['日', '一', '二', '三', '四', '五', '六'];

    str = str.replace(/yyyy|YYYY/, this.getFullYear());
    str = str.replace(/yy|YY/, (this.getYear() % 100) > 9 ? (this.getYear() % 100).toString() : '0' + (this.getYear() % 100));

    str = str.replace(/mi/, this.getMinutes() > 9 ? this.getMinutes().toString() : '0' + this.getMinutes());

    str = str.replace(/mm|MM/, this.getMonth()+1 > 9 ? (this.getMonth()+1).toString() : '0' + (this.getMonth()+1));
    str = str.replace(/m|M/g, this.getMonth()+1);

    str = str.replace(/w|W/g, Week[this.getDay()]);

    str = str.replace(/dd|DD/, this.getDate() > 9 ? this.getDate().toString() : '0' + this.getDate());
    str = str.replace(/d|D/g, this.getDate());

    str = str.replace(/hh|HH/, this.getHours() > 9 ? this.getHours().toString() : '0' + this.getHours());
    str = str.replace(/h|H/g, this.getHours());


    str = str.replace(/ss|SS/, this.getSeconds() > 9 ? this.getSeconds().toString() : '0' + this.getSeconds());
    str = str.replace(/s|S/g, this.getSeconds());

    return str;
};

/**
 * 权限验证
 * @param rule string|array  group-controller-action
 * @param uid  int           认证用户的id
 * @param string mode        执行check的模式
 * @param relation string    如果为 'or' 表示满足任一条规则即通过验证;如果为 'and'则表示需满足所有规则才能通过验证(仅限同时验证多条规则情况下)
 * @return boolean           通过验证返回true;失败返回false
 */
global.authCheck = function (group,controller,action, user, mode, relation,http) {
    mode = mode || 1;
    relation = relation || 'or';
    if (isEmpty(user)) {
        return getPromise(false);
    }
    //控制器名为PublicController或者以public_开头的方法无需权限认证
    if(controller == 'Public' || action.toString().substring(0,6) == "public" || C('auth_superroleid') == user.role_id){
        return getPromise(true);
    }else{
        //实例化Auth类
        var auth = X("Auth",user.id,{type:mode,http:http,userInfo:user});
        return auth.check('/'+group+'/'+controller+'/'+action,relation).then(function (data) {
            if(data){
                return true;
            }else{
                return false;
            }
        });
    }
};