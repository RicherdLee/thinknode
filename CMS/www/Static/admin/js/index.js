/**
 * Created by richen on 14/10/31.
 */

//根据菜单点击加载TAB
function loadMenuContent(key, name, url) {
    //移除当前激活TAB的样式
    $("#myTab").find(".active").eq(0).removeClass("active");
    $("#myTabContent").find(".active").eq(0).removeClass("in").removeClass("active");

    //判断目标TAB是否存在,存在则直接激活
    if ($("#tab_" + key).length > 0) {
        //激活目标TAB
        activeSubTab(key);
    } else {
        addMenuTab(key, name, url);
        //加载内容
        $("#appiframe_" + key).load(function () {
            //iframe高度自适应
            $(this).height($(this).contents().height()>480 ? $(this).contents().height() : 480);
            $("#loading_" + key).hide();
            //登出事件
            var targetUrl = this.contentWindow.location.href;
            if(targetUrl.indexOf("login") >-1){
                window.location = targetUrl;
            }
        });
    }
}
//增加TAB
function addMenuTab(key, name, url) {
    var ftabs, pKey,prevTab;
    ftabs = '<li id="tab_' + key +
    '" class="active"><a data-toggle="tab" href="#tabContent_' + key +
    '"><input type="hidden" id="targetUrl_' + key +
    '" name="targetUrl" value="' + url +
    '"/>' + name + '<i class="icon-remove small-90" name="close_menu" onclick="closeMenuContent(\'' + key + '\')"></i></a></li>';
    var tabContent = '<div id="tabContent_' + key + '" class="tab-pane page-content in active"><p id="loading_' + key +
        '"><img src="/Static/img/loading.gif"></p><iframe id="appiframe_' + key +
        '" src="' + url + '" style="width:100%;height:100%;" frameborder="0" scrolling="no"></iframe></div>';
    //追加DOM元素
    $("#myTab").append(ftabs);
    $("#myTabContent").append(tabContent);
    //myTab总宽度
    var myTabWidth = $("#myTab").width();
    //当前所有TAB宽度和(包含此次事件新增Tab)
    var totalWidth = 0;
    for (var i = 0; i < $("#myTab").find("li").length; i++) {
        totalWidth += parseInt($("#myTab").find("li").eq(i).width());
    }
    //如果剩余宽度不够,跟前一个交换位置
    if (totalWidth > (myTabWidth - 150)) {
        if ($("#tab_submores").length > 0) {
            prevTab = $("#tab_submores").prev();
        }else{
            prevTab = $("#tab_" + key).prev();
        }
        pKey = prevTab.attr("id").replace("tab_", "");
        //不操作首页
        if($("#tab_" + pKey).attr("id") !== 'tab_home'){
            reChangeTab(key, pKey);
        }
    //已经存在MORETAB,同样做交换
    }else if($("#tab_submores").length > 0){
        prevTab = $("#tab_submores").prev();
        pKey = prevTab.attr("id").replace("tab_", "");
        //不操作首页
        if($("#tab_" + pKey).attr("id") !== 'tab_home'){
            reChangeTab(key, pKey);
        }
    }
}
//激活菜单
function activeSubTab(key) {
    var pKey;
    //移除当前激活TAB的样式
    $("#myTab").find(".active").eq(0).removeClass("active");
    $("#myTabContent").find(".active").eq(0).removeClass("in").removeClass("active");
    //如果激活的是隐藏在moreTAB的子菜单，需要露出
    if ($("#tab_" + key).parents().attr("id") == 'tab_submores_ul') {
        try{
            //当前所有TAB宽度和
            var totalWidth = 0;
            for (var i = 0; i < $("#myTab").find("li").length; i++) {
                totalWidth += parseInt($("#myTab").find("li").eq(i).width());
            }

            //如果剩余宽度不够,跟前一个交换位置
            if ($("#tab_" + key).width() > ($("#myTab").width() - totalWidth - 150 )) {
                pKey = $("#tab_submores").prev().attr("id").replace("tab_", "");
                //不操作首页
                if($("#tab_" + pKey).attr("id") !== 'tab_home') {
                    reChangeTab(key, pKey);
                }else{
                    showSubTab(key);
                }
            }else{
                showSubTab(key);
            }
        }catch (e){}
    }
    //激活目标TAB
    $("#tab_" + key).addClass("active");
    $("#tabContent_" + key).addClass("in").addClass("active");
}
//刷新当前TAB内容
function refreshMenuContent() {
    try{
        var current = $("#myTab").find(".active").eq(0);
        var currentKey = current.attr("id").replace("tab_", "");
        var href = current.find("a").eq(0).attr("href");
        //不刷新首页
        if (href !== '#tabContent_home') {
            $("#loading_" + currentKey).show();
            //加载内容
            $("#appiframe_" + currentKey).attr("src", current.find("input").eq(0).val(), function () {
                //iframe高度自适应
                $(this).height($(this).contents().height()>480 ? $(this).contents().height() : 480);
                $("#loading_" + currentKey).hide();
                //登出事件
                var targetUrl = this.contentWindow.location.href;
                if(targetUrl.indexOf("login") >-1){
                    window.location = targetUrl;
                }
            });
        }
    }catch (e){}
}


//关闭TAB
function closeMenuContent(key) {
    var currentWidth, current,activityTabKey;
    current = $("#tab_" + key);
    //当前操作的TAB宽度
    var currentTabWidth = current.width();
    //当前操作的TAB父级ID
    var currentTabParentsId = current.parents().attr("id");

    if($("#myTab").find(".active").length > 0){
        try{
            //当前激活的TabKey
            activityTabKey = $("#myTab").find(".active").eq(0).attr("id").replace("tab_", "");
            if(current.prev()){
                //上一个TABKey
                var prevTabKey = current.prev().attr("id").replace("tab_", "");
                //如果需要关闭的TAB为当前激活TAB,自动激活前一个
                if (activityTabKey == key) {
                    //激活上一个TAB
                    $("#tab_" + prevTabKey).addClass("active");
                    $("#tabContent_" + prevTabKey).addClass("in").addClass("active");
                }
            }
        }catch (e){}
    }

    //删除DOM元素
    $("#tab_" + key).remove();
    $("#tabContent_" + key).remove();

    //moreTAB li元素个数
    var moreTabNum = $("#tab_submores").find("ul").eq(0).find("li").length;

    //关闭TAB后宽度增加,将MORETAB中的TAB露出
    if (currentTabParentsId !== 'tab_submores_ul' && moreTabNum > 0) {
        //myTab总宽度
        var myTabWidth = $("#myTab").width();
        //当前所有TAB宽度和
        var totalWidth = 0;
        for (var i = 0; i < $("#myTab").find("li").length; i++) {
            totalWidth += parseInt($("#myTab").find("li").eq(i).width());
        }
        //能够空余的宽度
        var kWidth = myTabWidth - totalWidth + currentTabWidth - 150;

        for (var j = 0; j < moreTabNum; j++) {
            if (kWidth <= 0) {
                break;
            }
            currentWidth = $("#tab_submores").find("ul").eq(0).find("li").eq(j).width();
            if (currentWidth <= kWidth) {
                try{
                    showSubTab($("#tab_submores").find("ul").eq(0).find("li").eq(j).attr("id").replace("tab_", ""));
                }catch (e){break;}
                kWidth -= currentWidth;
            }
        }
    }
}

//露出MORETAB的子TAB
function showSubTab(key) {
    var obj = $("#tab_" + key);
    var targetHtml = obj.prop("outerHTML");

    if ($("#tab_submores").find("ul").eq(0).find("li").length > 0) {
        obj.remove();
        $("#tab_submores").before(targetHtml);
    } else {
        obj.remove();
        $("#myTab").append(targetHtml);
    }

    //修改a链接并去除click事件
    $("#tab_" + key).find("a").eq(0).attr("href", "#tabContent_" + key);
    $("#tab_" + key).find("a").eq(0).removeAttr("onclick");
    if($("#tab_" + key).find("a").eq(0).find("i").length <1){
        $("#tab_" + key).find("a").eq(0).append('<i onclick="closeMenuContent(\''+key+'\')" name="close_menu" class="icon-remove small-90"></i>');
    }

    //moreTAB内无子元素，即删除
    if ($("#tab_submores").find("ul").eq(0).find("li").length < 1) {
        $("#tab_submores").remove();
    }
}
//隐藏TAB进入MORETAB
function hideTabtoSubTab(key) {
    var obj = $("#tab_" + key);
    var targetHtml = obj.prop("outerHTML");
    obj.remove();
    //如果moreTAB存在，直接附加子元素
    if ($("#tab_submores").find("ul").eq(0).find("li").length > 0) {
        $("#tab_submores").find("ul").eq(0).append(targetHtml);
    } else {
        $("#myTab").append('<li id="tab_submores" class="dropdown"><a data-toggle="dropdown" class="dropdown-toggle" href="#">more \>\><b class="caret"></b></a><ul id="tab_submores_ul" class="dropdown-menu dropdown-info">' + targetHtml + '</ul></li>');
    }

    //修改a链接并增加click事件
    $("#tab_" + key).find("a").eq(0).attr("href", "#");
    $("#tab_" + key).find("a").eq(0).attr("onclick", "activeSubTab('" + key + "');");
    $("#tab_" + key).find("a").eq(0).find("i").remove();
}

//交换MORETAB子TAB和外部TAB
function reChangeTab(key, targetKey) {
    hideTabtoSubTab(targetKey);
    showSubTab(key);
}

//动态调整TAB个数
function resizeTabs(newWidth, newHeight, flag) {
    var prevTab, pKey, moreTabNum, currentWidth;
    //当前所有TAB宽度和(包含此次事件新增Tab)
    var totalWidth = 0;

    //宽度增大
    if (flag === 1) {
        moreTabNum = $("#tab_submores").find("ul").eq(0).find("li").length;
        //存在moreTAB
        if (moreTabNum > 0) {
            //当前所有TAB宽度和
            for (var i = 0; i < $("#myTab").find("li").length; i++) {
                totalWidth += parseInt($("#myTab").find("li").eq(i).width());
            }
            //能够空余的宽度
            var kWidth = newWidth - totalWidth - 150;

            currentWidth = $("#tab_submores").find("ul").eq(0).find("li").eq(0).width();
            if(currentWidth <= kWidth){
                showSubTab($("#tab_submores").find("ul").eq(0).find("li").eq(0).attr("id").replace("tab_", ""));
            }
        }

    } else {//宽度缩小
        //当前所有TAB宽度和
        for (var i = 0; i < $("#myTab").find("li").length; i++) {
            totalWidth += parseInt($("#myTab").find("li").eq(i).width());
        }
        //如果剩余宽度不够
        while ((totalWidth > (newWidth - 150))) {
            try{
                if ($("#tab_submores").find("ul").eq(0).find("li").length > 0) {
                    prevTab = $("#tab_submores").prev();
                }else{
                    prevTab = $("#myTab").find("li").eq($("#myTab").find("li").length - 1);
                }

                //前面没有TAB元素则退出
                if (prevTab == undefined || prevTab == '') {
                    break;
                }
                //如果上一个TAB当前激活，则往前跳
                if (prevTab.attr("id") == $("#myTab").find(".active").eq(0).attr("id")) {
                    prevTab = prevTab.prev();
                }
                //不操作首页
                if (prevTab.attr("id") == 'tab_home') {
                    break;
                }
                pKey = prevTab.attr("id").replace("tab_", "");
                hideTabtoSubTab(pKey);

                //当前所有TAB宽度和
                totalWidth = 0;
                for (var i = 0; i < $("#myTab").find("li").length; i++) {
                    totalWidth += parseInt($("#myTab").find("li").eq(i).width());
                }
            }catch (e){break;}
        }
    }

}
//监听窗口大小改变,动态调整TAB个数
$(document).ready(function () {
    //myTab总宽度
    myTabWidth = $("#myTab").width();
    $(window).resize(function () {
        var newWidth = $("#myTab").width();
        var newHeight = $("#myTab").height();
        if (newWidth > 0) {
            var flag = newWidth - myTabWidth;
            if (flag > 0) {
                resizeTabs(newWidth, newHeight, 1);
            } else if (flag < 0) {
                resizeTabs(newWidth, newHeight, 2);
            }
            myTabWidth = newWidth;
        }
    });
});