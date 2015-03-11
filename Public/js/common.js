/**
 * Created by richen on 14/11/3.
 */
;
(function () {
    /*****************************全局控制************************************/
    if (/msie/.test(navigator.userAgent.toLowerCase())) {
        //ie 都不缓存
        $.ajaxSetup({
            cache: false
        });
    }
    //不支持placeholder浏览器下对placeholder进行处理
    if (document.createElement('input').placeholder !== '') {
        $('[placeholder]').focus(function () {
            var input = $(this);
            if (input.val() == input.attr('placeholder')) {
                input.val('');
                input.removeClass('placeholder');
            }
        }).blur(function () {
            var input = $(this);
            if (input.val() == '' || input.val() == input.attr('placeholder')) {
                input.addClass('placeholder');
                input.val(input.attr('placeholder'));
            }
        }).blur().parents('form').submit(function () {
            $(this).find('[placeholder]').each(function () {
                var input = $(this);
                if (input.val() == input.attr('placeholder')) {
                    input.val('');
                }
            });
        });
    }

    //iframe页面f5刷新
    $(document).on('keydown', function (event) {
        var e = window.event || event;
        if (e.keyCode == 116) {
            e.keyCode = 0;

            var $doc = $(parent.window.document),
                id = $doc.find('#B_history .current').attr('data-id'),
                iframe = $doc.find('#iframe_' + id);
            try {
                if (iframe[0].contentWindow) {
                    //common.js
                    reloadPage(iframe[0].contentWindow);
                }
            } catch (err) {
            }
            //!ie
            return false;
        }

    });

    /*****************************动态绑定其他组件************************************/
    //日期选择器
    if ($('.J_date').length) {
        head.use('jqueryui', function () {
            head.css('/Public/css/jquery-ui-1.10.3.custom.min.css');
            head.use('datePicker', function () {
                head.css('/Public/css/bootstrap-datetimepicker.min.css');
                $(".J_date").datetimepicker({
                    language:  'zh-CN',
                    //format: "yyyy-mm-dd",
                    weekStart: 1,
                    todayBtn:  1,
                    autoclose: 1,
                    todayHighlight: 1,
                    startView: 2,
                    minView: 2,
                    forceParse: 0
                });
            });
        });
    }

    //时间选择器
    if ($('.J_time').length) {
        head.use('jqueryui', function () {
            head.css('/Public/css/jquery-ui-1.10.3.custom.min.css');
            head.use('datePicker', function () {
                head.css('/Public/css/bootstrap-datetimepicker.min.css');
                $(".J_time").datetimepicker({
                    language:  'zh-CN',
                    //format: "hh:ii:ss",
                    weekStart: 1,
                    todayBtn:  1,
                    autoclose: 1,
                    todayHighlight: 1,
                    startView: 1,
                    minView: 0,
                    maxView: 1,
                    forceParse: 0
                });
            });
        });
    }
    //日期时间选择器
    if ($('.J_datetime').length) {
        head.css('/Public/css/jquery-ui-1.10.3.custom.min.css');
        head.use('jqueryui', function () {
            head.use('datePicker', function () {
                head.css('/Public/css/bootstrap-datetimepicker.min.css');
                $(".J_datetime").datetimepicker({
                    language:  'zh-CN',
                    //format: "yyyy-mm-dd hh:ii:ss",
                    todayBtn:  1,
                    autoclose: 1,
                    todayHighlight: 1,
                    startView: 2,
                    forceParse: 0,
                    showMeridian: 1
                });
            });
        });
    }

    //下拉列表
    if($(".J_select").length){
        head.use('jqueryui', function () {
            head.css("/Public/css/chosen.css");
            head.css("/Public/css/ace.min.css");
            head.use("chosen", function () {
                $(".J_select").chosen();
            });
        });
    }

    //开关控件
    if($(".J_switch").length){
        $(".J_switch").each(function (s,element) {
            if($(element).prop('checked')){
                $(element).val(1);
            }else{
                $(element).val(0);
                $('<input type="hidden" id="_'+s+$(element).attr("name")+'" name="'+$(element).attr("name")+'" value="0"/>').appendTo($(element));
            }

            $(element).on("click", function (e) {
                if($(element).prop('checked')){
                    $("#_"+s+$(element).attr("name")).remove();
                    $(element).val(1);
                }else{
                    $(element).val(0);
                    $('<input type="hidden" id="_'+s+$(element).attr("name")+'" name="'+$(element).attr("name")+'" value="0"/>').appendTo($(element));
                }
            });
        });
    }

    //图片上传(带预览)表单元素
    if($("input.J_upload_preview").length){
        if(typeof($("input.J_upload_preview").attr("id")) !== undefined){
            var _id = $("input.J_upload_preview").attr("id");
            $("input.J_upload_preview").after('<div style="text-align: center;">'
            +'<a onclick="doUpload(\''+_id+'\', \'图片上传\',imgPreview,1);return false;" href="javascript:void(0);">'
            +'<img style="cursor:hand" id="'+_id+'_preview" src="/Public/img/upload-pic.png">'
            +'</a><br />'
            //+'<button class="btn btn-info btn-mini" onclick="imgCrop($(\'#'+_id+'\').val(),\''+_id+'\',imgPreview);return false;" >图片裁剪</button>'
            +'<button class="btn btn-info btn-mini" onclick="doUpload(\''+_id+'\', \'图片上传\',imgPreview,1);return false;return false;" >图片上传</button>'
            +'<button class="btn btn-mini" onclick="$(\'#'+_id+'_preview\').attr(\'src\',\'/Public/img/upload-pic.png\');$(\'#'+_id+'\').val(\'\');return false;">取消图片</button>'
            +'</div>');
            if($("#"+_id).val()){
                $("#"+_id+"_preview").attr("src",$("#"+_id).val());
            }
        }
    }

    //文件上传(输入框不带预览)表单元素
    if($("input.J_upload_text").length){
        if(typeof($("input.J_upload_text").attr("id")) !== undefined){
            var _id = $("input.J_upload_text").attr("id");
            $("input.J_upload_text").after(
                '<button class="btn btn-info btn-mini" onclick="doUpload(\''+_id+'\',\'上传\',upInput,2);return false;" >上传</button>'
                +'<button class="btn btn-mini" onclick="$(\'#'+_id+'_preview\').attr(\'src\',\'/Public/img/upload-pic.png\');$(\'#'+_id+'\').val(\'\');return false;">取消</button>'
            );
        }
    }


    //文件上传控件
    if($(".J_upload_input").length){
        $(".J_upload_input").ace_file_input({
            style:'well',
            btn_choose:'Drop files here or click to choose',
            btn_change:null,
            no_icon:'icon-cloud-upload',
            droppable:true,
            thumbnail:'small'
            ,icon_remove:null//set null, to hide remove/reset button
            /**,before_change:function(files, dropped) {
						//Check an example below
						//or examples/file-upload.html
						return true;
					}*/
            /**,before_remove : function() {
						return true;
					}*/
            ,
            preview_error : function(filename, error_code) {
                //name of the file that failed
                //error_code values
                //1 = 'FILE_LOAD_FAILED',
                //2 = 'IMAGE_LOAD_FAILED',
                //3 = 'THUMBNAIL_FAILED'
                alert(error_code);
            }

        });
        var before_change;
        var btn_choose;
        var no_icon;
        $(".J_upload_input").each(function (s,element) {
            if($(element).attr("data_type") == "1"){
                btn_choose = "拖动图片到此或点击选择";
                no_icon = "icon-picture";
            }else{
                btn_choose = "拖动文件到此或点击选择";
                no_icon = "icon-cloud-upload";
            }
            before_change = function(files, dropped) {
                var allowed_files = [];
                var allowed_type = $(element).attr("file_type");
                var re = new RegExp("\\.?(" + allowed_type + ")$","i");
                for(var i = 0 ; i < files.length; i++) {
                    var file = files[i];
                    if(typeof file === "string") {
                        //IE8 and browsers that don't support File Object
                        if(! re.test(file) ) return false;
                    }else{
                        var type = $.trim(file.type);
                        var _type = type.split("/");
                        if( ( type.length > 0 && ! re.test(_type[1]) )
                            || ( type.length == 0 && ! re.test(file.name) )//for android's default browser which gives an empty string for file.type
                        ) continue;//not an image so don't keep this file
                    }
                    allowed_files.push(file);
                }
                if(allowed_files.length == 0) return false;

                return allowed_files;
            };
            $(element).ace_file_input('update_settings', {'before_change':before_change, 'btn_choose': btn_choose, 'no_icon':no_icon});
            $(element).ace_file_input('reset_input');
            $(element).ace_file_input().on('change', function(){
                //    //console.log($(this).data('ace_input_files'));
                var obj = $(this);
                var _span = obj.next().find("span").eq(0);
                head.use('ajaxForm', function () {
                    var form = $("#file_upload_form");
                    if(obj.val()){
                        form.ajaxSubmit({
                            url: form.attr('action') || "/Attachment/Index/publicDoUpload",
                            dataType: 'json',
                            beforeSubmit: function (arr, $form, options) {
                                _span.attr("data-title","上传中...");
                            },
                            success: function (result) {
                                if(result.status == true){
                                    obj.attr("readonly",true);
                                    _span.attr("data-title",result.info);
                                    $("#file_url").val(result.info);
                                    return;
                                }else{
                                    _span.attr("data-title",result.info);
                                    return false;
                                }
                            }
                        });
                    }else{
                        return false;
                    }
                });
            });
        });
    }

    /*****************************ajaxForm************************************/
    //ajax form提交
    var ajaxForm_list = $('form.J_ajaxForm');
    if (ajaxForm_list.length) {
        head.use('ajaxForm', function () {
            if (/msie/.test(navigator.userAgent.toLowerCase())) {
                //ie8及以下，表单中只有一个可见的input:text时，整个页面会跳转提交
                ajaxForm_list.on('submit', function (e) {
                    //表单中只有一个可见的input:text时，enter提交无效
                    e.preventDefault();
                });
            }
            $('button.J_ajax_submit_btn').on('click', function (e) {
                e.preventDefault();
                /*var btn = $(this).find('button.J_ajax_submit_btn'),
                 form = $(this);*/
                var btn = $(this),
                    form = btn.parents('form.J_ajaxForm');

                //ie处理placeholder提交问题
                if (/msie/.test(navigator.userAgent.toLowerCase())) {
                    form.find('[placeholder]').each(function () {
                        var input = $(this);
                        if (input.val() == input.attr('placeholder')) {
                            input.val('');
                        }
                    });
                }

                form.ajaxSubmit({
                    //按钮上是否自定义提交地址(多按钮情况)
                    url: btn.data('action') ? btn.data('action') : form.attr('action'),
                    dataType: 'json',
                    beforeSubmit: function (arr, $form, options) {
                        //var text = btn.text();
                        //按钮文案、状态修改
                        //btn.text(text + '中...').prop('disabled', true).addClass('disabled');
                        btn.prop('disabled', true).addClass('disabled');
                    },
                    success: function (result) {
                        //按钮文案、状态修改
                        //var text = btn.text();
                        //btn.removeClass('disabled').text(text.replace('中...', '')).parent().find('span').remove();
                        btn.removeClass('disabled').parent().find('span').remove();

                        if (result.errno > 0) {
                            $('<span class="alert alert-error"><i class="icon-remove bigger-150"></i> ' + result.errmsg + '</span>').appendTo(btn.parent()).fadeIn('fast').delay(3000).fadeOut(function(){
                                btn.prop('disabled',false).removeClass('disabled');
                            });
                        } else{ //if (result.errno == 0) {
                            $('<span class="alert alert-success"><i class="icon-ok bigger-150"></i> ' + result.errmsg + '</span>').appendTo(btn.parent()).fadeIn('slow').delay(1000).fadeOut(function () {
                                if (result.data.referer !== undefined && result.data.referer !== '') {
                                    //返回带跳转地址
                                    if (window.parent.art) {
                                        //iframe弹出页
                                        window.parent.location.href = result.data.referer;
                                    } else {
                                        window.location.href = result.data.referer;
                                    }
                                } else {
                                    if (window.parent.art) {
                                        reloadPage(window.parent);
                                    } else {
                                        //刷新当前页
                                        reloadPage(window);
                                    }
                                }
                            });
                        }
                    }
                });
            });
        });
    }

    /*****************************artDialog************************************/
    //a链接弹窗事件
    if ($('a.J_dialog').length) {
        head.use('artDialog', function () {
            head.css('/Public/js/artDialog/skins/default.css');
            $('.J_dialog').on('click', function (e) {
                e.preventDefault();
                var $_this = this,
                    _this = $($_this);

                art.dialog.open($(this).attr('href'), {
                    //close: function () {
                    //    $_this.focus(); //关闭时让触发弹窗的元素获取焦点
                    //    return true;
                    //},
                    id: $(this).attr('href')+"",
                    title: _this.attr('title'),
                    resize: true,
                    top: '0%',
                    width: '60%',
                    height: '60%'
                });
            }).attr('role', 'button');

        });
    }
    //按钮弹窗事件
    if($('.J_btdialog').length){
        head.use('artDialog', function () {
            head.css('/Public/js/artDialog/skins/default.css');
            $('.J_btdialog').on('click', function (e) {
                e.preventDefault();
                var $_this = this,
                    _this = $($_this);
                art.dialog.open($(this).attr('data-action'),{
                    //close: function(){
                    //    $_this.focus();
                    //    return true;
                    //},
                    id: $(this).attr('data-action')+"",
                    title: _this.text(),
                    resize: true,
                    top: '0%',
                    width: '60%',
                    height: '60%'
                });
            });
        });
    }

    //dialog弹窗内的关闭方法
    $('#J_dialog_close').on('click', function (e) {
        e.preventDefault();
        try{
            art.dialog.close();
        }catch(err){
            head.use('artDialog',function(){
                art.dialog.close();
            });
        }
    });

    //所有的删除操作，删除数据后刷新页面
    if ($('a.J_ajax_del').length) {
        head.use('artDialog', function () {
            head.css('/Public/js/artDialog/skins/default.css');
            $('.J_ajax_del').on('click', function (e) {
                e.preventDefault();
                var $_this = this,
                    $this = $($_this),
                    href = $this.attr('href'),
                    msg = $this.data('msg');
                art.dialog({
                    title: false,
                    icon: 'question',
                    content: '确定要删除吗？',
                    follow: $_this,
                    //close: function () {
                    //    $_this.focus(); //关闭时让触发弹窗的元素获取焦点
                    //    return true;
                    //},
                    ok: function () {
                        $this.find('span').remove();
                        $.getJSON(href).done(function (data) {
                            if (data.errno === 0) {
                                $('<span class="alert alert-success"><i class="icon-ok bigger-150"></i> ' + data.errmsg + '</span>').appendTo($this).fadeIn('slow').delay(1000).fadeOut(function () {
                                    if (data.data.referer) {
                                        location.href = data.data.referer;
                                    } else {
                                        reloadPage(window);
                                    }
                                });
                            } else if (data.errno > 0) {
                                //art.dialog.alert(data.errmsg);
                                $('<span class="alert alert-error"><i class="icon-remove bigger-150"></i> ' + data.errmsg + '</span>').appendTo($this).fadeIn('fast').delay(3000).fadeOut();
                            }
                        });
                    },
                    cancelVal: '关闭',
                    cancel: true
                });
            });

        });
    }

    //所有的请求刷新操作
    var ajax_refresh = $('a.J_ajax_refresh'),
        refresh_lock = false;
    if (ajax_refresh.length) {
        ajax_refresh.on('click', function (e) {
            e.preventDefault();
            if (refresh_lock) {
                return false;
            }
            refresh_lock = true;

            $.post(this.href, function (data) {
                refresh_lock = false;
                if (data.errno === 0) {
                    if (data.data.referer) {
                        location.href = data.data.referer;
                    } else {
                        reloadPage(window);
                    }
                } else if (data.errno > 0) {
                    art.dialog.alert(data.errmsg);
                }
            }, 'json');
        });
    }

    /*复选框全选(支持多个，纵横双控全选)。
     *实例：版块编辑-权限相关（双控），验证机制-验证策略（单控）
     *说明：
     *	"J_check"的"data-xid"对应其左侧"J_check_all"的"data-checklist"；
     *	"J_check"的"data-yid"对应其上方"J_check_all"的"data-checklist"；
     *	全选框的"data-direction"代表其控制的全选方向(x或y)；
     *	"J_check_wrap"同一块全选操作区域的父标签class，多个调用考虑
     */

    if ($('.J_check_wrap').length) {
        var total_check_all = $('input.J_check_all');
        //遍历所有全选框
        $.each(total_check_all, function () {

            var check_all = $(this),
                check_items;

            //分组各纵横项
            var check_all_direction = check_all.data('direction');
            check_items = $('input.J_check[data-' + check_all_direction + 'id="' + check_all.data('checklist') + '"]');

            //点击全选框
            check_all.change(function (e) {
                var check_wrap = check_all.parents('.J_check_wrap'); //当前操作区域所有复选框的父标签（重用考虑）

                if ($(this).prop('checked')) {

                    //全选状态
                    check_items.prop('checked', true);

                    //所有项都被选中
                    if (check_wrap.find('input.J_check').length === check_wrap.find('input.J_check:checked').length) {
                        check_wrap.find(total_check_all).prop('checked', true);
                    }

                } else {
                    //非全选状态
                    check_items.prop('checked',false);

                    //另一方向的全选框取消全选状态
                    var direction_invert = check_all_direction === 'x' ? 'y' : 'x';
                    check_wrap.find($('input.J_check_all[data-direction="' + direction_invert + '"]')).prop('checked',false);
                }

            });

            //点击非全选时判断是否全部勾选
            check_items.change(function () {

                if ($(this).prop('checked')) {

                    if (check_items.filter(':checked').length === check_items.length) {
                        //已选择和未选择的复选框数相等
                        check_all.prop('checked', true);
                    }

                } else {
                    check_all.prop('checked',false);
                }

            });


        });

    }

    /*li列表添加&删除(支持多个)，实例(“验证机制-添加验证问题”，“附件相关-添加附件类型”)：
     <ul id="J_ul_list_verify" class="J_ul_list_public">
     <li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
     <li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
     </ul>
     <a data-related="verify" class="J_ul_list_add" href="#">添加验证</a>

     <ul id="J_ul_list_rule" class="J_ul_list_public">
     <li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
     <li><input type="text" value="111" ><a class="J_ul_list_remove" href="#">[删除]</a></li>
     </ul>
     <a data-related="rule" class="J_ul_list_add" href="#">添加规则</a>
     */
    var ul_list_add = $('a.J_ul_list_add');
    if (ul_list_add.length) {
        var new_key = 0;

        //添加
        ul_list_add.click(function (e) {
            e.preventDefault();
            new_key++;
            var $this = $(this);

            //"new_"字符加上唯一的key值，_li_html 由列具体页面定义
            var $li_html = $(_li_html.replace(/new_/g, 'new_' + new_key));

            $('#J_ul_list_' + $this.data('related')).append($li_html);
            $li_html.find('input.input').first().focus();
        });

        //删除
        $('ul.J_ul_list_public').on('click', 'a.J_ul_list_remove', function (e) {
            e.preventDefault();
            $(this).parents('li').remove();
        });
    }

    /*****************************函数************************************/

    //重新刷新页面，使用location.reload()有可能导致重新提交
    function reloadPage(win) {
        var location = win.location;
        location.href = location.pathname + location.search;
    }
    //全局唯一标识符
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }

})();

//提示框 alert
function isAlert(content,icon){
    if(content == ''){
        return;
    }
    icon = icon|| "error";
    head.use("artDialog",function(){
        head.css('/Public/js/artDialog/skins/default.css');
        art.dialog({
            id:icon,
            icon: icon,
            fixed: true,
            lock: true,
            opacity:0,
            content: content,
            cancelVal: '确定',
            cancel: true
        });
    });
}
/**
 * 文件上传
 * @param obj       上传完成后表单赋值对象
 * @param title     上传窗口标题
 * @param callback  回调函数
 * @param type      上传类别
 */
function doUpload(obj,title,callback,type){
    // 前置检查
    $.ajax({
        type : "POST",
        url : '/Attachment/Index/publicCheckUpload/',
        dataType : "json",
        async : false,
        success : function(json) {
            if(json.status == true){
                head.use("artDialog", function() {
                    head.css('/Public/js/artDialog/skins/default.css');
                    art.dialog.open('/Attachment/Index/publicDoUpload/type/'+type,{
                        id : obj,
                        title : title,
                        width : '600px',
                        height : '400px',
                        lock : true,
                        fixed : true,
                        ok : function() {
                            if (callback) {
                                callback.apply(this, [ this, obj ]);
                            }
                        },
                        cancel : true
                    });
                });
            }else{
                isAlert(json.info || '没有上传权限');
                return false;
            }
        }
    });
}

// 验证地址是否为图片
function isImg(url) {
    var sTemp;
    var b = false;
    var opt = "jpg|gif|png|bmp|jpeg";
    var s = opt.toUpperCase().split("|");
    for (var i = 0; i < s.length; i++) {
        sTemp = url.substr(url.length - s[i].length - 1);
        sTemp = sTemp.toUpperCase();
        s[i] = "." + s[i];
        if (s[i] == sTemp) {
            b = true;
            break;
        }
    }
    return b;
}
//检查URL录入的文件是否有效
function isAllowdFile(allow,url){
    var sTemp;
    var b = false;
    var s = allow.toUpperCase().split("|");
    for (var i = 0; i < s.length; i++) {
        sTemp = url.substr(url.length - s[i].length - 1);
        sTemp = sTemp.toUpperCase();
        s[i] = "." + s[i];
        if (s[i] == sTemp) {
            b = true;
            break;
        }
    }
    return b;
}
//带预览的图片上传回调
function imgPreview(uploadid, returnid){
    // 取得iframe对象
    var d = uploadid.iframe.contentWindow;
    // 取得选择的图片
    var in_content = d.$("#file_url").val();

    if (in_content == ''){
        return false;
    }
    if (!isImg(in_content)) {
        isAlert('选择的类型必须为图片类型！');
        return false;
    }
    if ($('#' + returnid + '_preview').attr('src')) {
        $('#' + returnid + '_preview').attr('src', in_content);
    }
    $('#' + returnid).val(in_content);
}
//文本输入框上传回调
function upInput(uploadid, returnid){
    // 取得iframe对象
    var d = uploadid.iframe.contentWindow;
    // 取得选择的图片
    var in_content = d.$("#file_url").val();

    if (in_content == ''){
        return false;
    }
    $('#' + returnid).val(in_content);
}

/**
 * 图片裁切
 * @param value
 * @param obj
 * @param callback
 */
function imgCrop(value,obj,callback){
    return false;
}