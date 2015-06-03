#!/bin/bash

#Mysql数据库配置
cp ./App/Common/Conf/config.js ./App/Common/Conf/config.js.bak
sed -i "s/.*db_type.*/db_type:'mysql',/" ./App/Common/Conf/config.js
sed -i "s/.*db_host.*/db_host:'10.0.2.40',/" ./App/Common/Conf/config.js
sed -i "s/.*db_port.*/db_port:'3306',/" ./App/Common/Conf/config.js
sed -i "s/.*db_name.*/db_name:'exhibition',/" ./App/Common/Conf/config.js
sed -i "s/.*db_user.*/db_user:'root',/" ./App/Common/Conf/config.js
sed -i "s/.*db_pwd.*/db_pwd:'richenlin',/" ./App/Common/Conf/config.js

#关闭调试
cp ./www/index.js ./www/index.js.bak
sed -i "s/.*THINK.APP_DEBUG.*/THINK.APP_DEBUG = false;/" ./www/index.js


#清除缓存
rm -rf ./Runtime/Cache/*
rm -rf ./Runtime/Data/*
rm -rf ./Runtime/Temp/*

chmod -R 755 ./*
chmod -R 777 ./www
chmod -R 777 ./Runtime

docker restart node_test

rm -rf ./*.sh

