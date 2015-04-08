module.exports = {
    //配置项: 配置值
    port: 3000, //监听的端口
    app_group_list: ['Admin', 'Home'], //分组列表
    default_group: 'Home',//默认分组
    /**数据库配置**/
    db_type: 'mysql', // 数据库类型
    db_host: '127.0.0.1', // 服务器地址
    db_port: '3306', // 端口
    db_name: 'test', // 数据库名
    db_user: 'root', // 用户名
    db_pwd: 'richenlin', // 密码
    db_prefix: 'think_', // 数据库表前缀

    /**缓存配置**/
    cache_type: "File", //数据缓存类型File,Redis,Memcache
    cache_key_prefix: 'ThinkNode__', //缓存key前置(memcache和redis下有效)
    cache_timeout: 6 * 3600, //数据缓存有效期，单位: 秒
    cache_path: THINK.CACHE_PATH,  //缓存路径设置 (File缓存方式有效)
    cache_file_suffix: ".json", //File缓存方式下文件后缀名
    cache_gc_hour: [4], //缓存清除的时间点，数据为小时

    /**权限配置**/
    auth_type: 2, //认证方式，1为实时认证，2为SESSION认证。如果检测非当前登录用户，则不能使用SESSION认证。
    auth_user: 'user', //用户信息表
    auth_role: 'auth_role', //角色表
    auth_rule: 'auth_rule', //规则表
    auth_superroleid: 1,//超级管理员角色id(无需权限验证)

    /**其他配置**/
    filter_data: false,//对GET/POST提交的数据进行过滤，去除值为数组
    app_version: '1.0',
    app_version_code: '20141101'
};