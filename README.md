## 介绍

ThinkNode是ThinkJs的fork,在ThkinkJs 1.x的基础上,增加了以下特性：

* 将系统配置类全局变量全部放入THINK命名空间
* 完整实现了ThinkPHP 3.2.3相同的独立分组模式，各分组完全解耦
* 去除APP执行流程中分散的异常捕获，统一由APP类catch，便于错误跟踪和定位
* 增加I方法获取get和post等传输的参数，自动实现安全过滤
* 修改Mysql为连接池模式，解决在并发情况下，原ThinkJS导致的链接溢出
* 完善mongoDB模型类(持续改进中)
* 改进http.res.end调用机制，防止致命异常导致的node崩溃
* 其他优化...

## 协议

MIT
