/**
 * Created by richen on 14/11/4.
 */

head.js('/Public/js/bootstrap.min.js','/Public/js/ace-elements.min.js','/Public/js/ace.min.js',function(){
    <!--band plugin-->
    head.add('jqueryui',['jquery-ui-1.10.3.custom.min.js','jquery.ui.touch-punch.min.js']);
    //下拉框
    head.add('chosen','chosen.jquery.min.js');
    //
    head.add('fuelux',['fuelux/fuelux.spinner.min.js','fuelux/fuelux.tree.min.js'],'fuelux/fuelux.wizard.min.js');
    //日期时间
    head.add('datePicker',['date-time/bootstrap-datetimepicker.min.js','date-time/locales/bootstrap-datetimepicker.zh-CN.js']);
    //拾色器
    head.add('colorPicker','bootstrap-colorpicker.min.js');
    //旋钮
    head.add('knob','jquery.knob.min.js');
    //textarea自动高度调整
    head.add('autoSize','jquery.autosize-min.js');
    //字数限制
    head.add('inputLimiter','jquery.inputlimiter.1.3.1.min.js');
    //固定格式输入数据
    head.add('maskedInput','jquery.maskedinput.min.js');
    //tags
    head.add('tags','bootstrap-tag.min.js');
    //ajaxform
    head.add('ajaxForm',['jquery.ajaxform.js']);
    //artDialog
    head.add('artDialog',['artDialog/jquery.artDialog.js','artDialog/plugins/iframeTools.js']);
});


