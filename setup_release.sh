#!/bin/bash

#Mysql数据库配置
cp ./#App/Common/Conf/config.js ./#App/Common/Conf/config.js.bak
sed -i "s/.*db_host.*/db_host:'192.168.0.20',/" ./#App/Common/Conf/config.js
sed -i "s/.*db_port.*/db_port:'4047',/" ./#App/Common/Conf/config.js
sed -i "s/.*db_name.*/db_name:'thinknode',/" ./#App/Common/Conf/config.js
sed -i "s/.*db_user.*/db_user:'thinknode',/" ./#App/Common/Conf/config.js
sed -i "s/.*db_pwd.*/db_pwd:'2014_thinknode_admin',/" ./#App/Common/Conf/config.js

#关闭调试
cp ./index.js ./index.js.bak
sed -i "s/.*THINK.APP_DEBUG.*/THINK.APP_DEBUG = false;/" ./index.js


#清除缓存
rm -rf /www/web/node/#Runtime/Cache/*
rm -rf /www/web/node/#Runtime/Data/*
rm -rf /www/web/node/#Runtime/Temp/*

chmod -R 755 /www/web/node
chmod -R 777 ./Public
chmod -R 777 ./\#Runtime
chown richen:docker /www/web/node

docker restart nodejs

rm -rf /www/web/node/*.sh

