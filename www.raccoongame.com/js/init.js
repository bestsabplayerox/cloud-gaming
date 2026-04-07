var asToken = '';
var my_user_info = {};
var cloud_game_index_list = [];
var jy = new JYSDK();
var locale = 'en';
jy.initObj();
var sdk = null;
var myvgpid = false;
var reg = new RegExp("RaccoonGame");
var transList = {};
if (!reg.test(navigator.userAgent)) {
    sdk = new JY(2);
//    window.onerror = function (errorMessage, scriptURI, lineNumber, columnNumber, errorObj) {
//        console.log(errorMessage, '|', lineNumber, '|', columnNumber, errorObj);
//        alert(errorMessage + '|' + lineNumber + '|' + columnNumber + JSON.stringify({e: errorObj}));
//        return true;
//    }
//    window.addEventListener("unhandledrejection", function (e) {
//        console.log('unhandledrejection', e)
//        alert('unhandledrejection' + JSON.stringify({e: e}));
//    }, true);

    window.onload = function () {
        var lastTouchEnd = 0;
        document.addEventListener('touchstart', function (event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        });
        document.addEventListener('touchend', function (event) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        document.addEventListener('gesturestart', function (event) {
            event.preventDefault();
        });
    };
    var playRotate = function () {
        if(isPc()|| !document.getElementById("videoContainer")){
            return;
        }
        // 利用 CSS3 旋转 对根容器逆时针旋转 90 度
        var width = document.documentElement.clientWidth,
                height = document.documentElement.clientHeight,
                $wrapper = document.getElementById("videoContainer");
        var style = "";
        if (0&&width >= height) { // 横屏
            style += "width:" + width + "px;"; // 注意旋转后的宽高切换
            style += "height:" + height + "px;";
            style += "-webkit-transform: rotate(0); transform: rotate(0);";
            style += "-webkit-transform-origin: 0 0;";
            style += "transform-origin: 0 0;";
        } else { // 竖屏
            style += "width:" + height + "px;";
            style += "height:" + width + "px;";
            style += "-webkit-transform: rotate(90deg); transform: rotate(90deg);";
            // 注意旋转中点的处理
            style += "-webkit-transform-origin: " + width / 2 + "px " + width / 2 + "px;";
            style += "transform-origin: " + width / 2 + "px " + width / 2 + "px;";
        }
        $wrapper.style.cssText = style;
    }
    window.onresize = playRotate;
}

function isPc() {
    var userAgentInfo = navigator.userAgent;
    var agents = [
        'android', 'iphone', 'symbianos', 'windows phone', 'ipad', 'ipod'
    ];
    var flag = true;
    for (var i = 0; i < agents.length; i++) {
        if (userAgentInfo.toLowerCase().indexOf(agents[i]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}
function $t(str){
    var arr = str.split('.');
    var the_tran = transList;
    var len = arr.length;
    for (var i=0;i<len;i++){
        if(typeof(the_tran[arr[i]]) == 'undefined'){
            break;
        }
        the_tran = the_tran[arr[i]];
        if(len == i + 1 && typeof(the_tran) == 'string'){
            str = the_tran;
        }
    }
    return str;
}

