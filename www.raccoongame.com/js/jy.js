var JYSDK = function () {
    this.interactObj = null;
    this.roomId = 0;
    this.host = '';
    const _this = this;
    this.user = new User(this);
    this.chat = new ChatStorage();
    this.asHost = '';
    this.asOverHost = '';
    this.rtHost = '';
}

/**
 * 初始化
 */
JYSDK.prototype.initObj = function (callback) {
    this.rtHost = window.location.protocol+'//'+window.location.host;
    this.asHost = "https://www.raccoongame.com";
    // this.asHost = "https://cloud-pc-test.raccoongame.com";
    var _this = this;
    new QWebChannel(qt.webChannelTransport, function (channel) {
        _this.interactObj = channel.objects.interactObj;
        _this.setUserToken(_this.getCookie('as_user_token'));
        _this.interactObj.ConManualVerify.connect(function (str) {
            $('#test_print').append('ConManualVerify:' + str);
            var data = JSON.parse(str);
            //连接提醒
            _this.post('/api/device/getApplyCon', data, function (con_res) {
                if (con_res.status == 200) {
                    $('#test_print').append('ConManualVerify Confirm:' + '用户：【' + con_res.data.from_user.nickname + '】请求连接');
                    _this.myConfirm('连接申请', '用户：【' + con_res.data.from_user.nickname + '】请求连接?',
                        JSON.stringify({
                            apply_connection_id: con_res.data.apply_connection_id,
                            device_id: con_res.data.from_user.device_id
                        }),
                        function (json_str) {
                            _this.interactObj.AgreeApplyConnect(json_str, function (arg) {
                                console.log('同意连接', arg);
                            });
                        },
                        function (json_str) {
                            _this.interactObj.RefuseApplyConnect(json_str, function (arg) {
                                console.log('拒绝连接', arg);
                            });
                        });
                }
            });
        });
        _this.interactObj.ConPasswdVerify.connect(function (str) {
            $('#test_print').append('ConPasswdVerify:' + str);
            var con_res = JSON.parse(str);
            //连接密码验证
            _this.myConfirm('连接设备', '<label style="width:50px;">密码 ：</label><input type="text" class="confirm_password" value="" />', {
                    apply_connection_id: con_res.apply_connection_id,
                    device_id: con_res.device_id
                },
                function (json, that) {
                    $('#test_print').append('Before1 PasswdVerify :' + JSON.stringify(json));
                    json['password'] = that.find('.confirm_password').val();
                    $('#test_print').append('Before2 PasswdVerify :' + JSON.stringify(json));
                    _this.interactObj.PasswdVerify(JSON.stringify(json), function (arg) {
                        $('#test_print').append('PasswdVerify :' + JSON.stringify(json) + ' result:' + arg);
                        console.log('密码输入验证', arg);
                    });
                },
                function (json) {
                    _this.interactObj.PasswdVerifyCancel(JSON.stringify(json), function (arg) {
                        $('#test_print').append('PasswdVerifyCancel:' + JSON.stringify(json) + ' result:' + arg);
                        console.log('取消密码输入验证', arg);
                    });
                });
        });
        _this.interactObj.SendH5Msg.connect(function (str) {
            $('#test_print').append('SendH5Msg:' + str);
            _this.receive(JSON.parse(str));
        });
        _this.interactObj.ClosedDeviceGameRoom.connect(function (str) {
            $('#test_print').append('ClosedDeviceGameRoom:' + str);
            var json = JSON.parse(str);
            _this.room.quitRoomReport(json.room_id);
        });
        _this.user.getInfo();
        if (callback !== undefined) {
            callback();
        }
    });

};
/**
 * post请求
 * @param {string} url
 * @param {object} obj
 * @param {function} callback
 * @returns {object}
 */
JYSDK.prototype.post = function (url, obj, callback, async) {
    if (async ==undefined) {
        async = true;
    }

    $.each(obj, function (k, v) {
        if (v == undefined) {
            delete obj[k];
        }
    });
    var _this = this;
    this.interactObj.GetMultiConfigFormTool(JSON.stringify({
        key: 'sn,model,version_code,version_name,device_name,os',
        is_server: 0,
        sn_user_id: this.user.userid
    }), function (str) {
        var data = JSON.parse(str);
        $.each(obj, function (k, v) {
            data[k] = v;
        });
        data['user_token'] = asToken;
        $.ajax({
            url: _this.host + url,
            data: data,
            type: "POST",
            async: async,
            success: function (res, status, request) {
                var reg = new RegExp("octet-stream");
                if (reg.test(request.getResponseHeader('Content-Type'))) {
                    res = JSON.parse(apidecode(res, data.sn, 'sn,os,model'));
                }
                if (res.status == 100) {
                    var reg = new RegExp('login');
                    // if (!reg.test(window.location.href)) {
                    //      window.location.href = _this.asHost + "/login?redirect_uri=" + encodeURIComponent(_this.rtHost + "/web2/dist/#/platform/cloudgame");
                    // }
                    callback(res);
                } else {
                    callback(res);
                }
            },
            error: function (error_mes) {
                console.log(error_mes);
            }
        });
    });
};

JYSDK.prototype.get = function (url, obj, callback) {
    $.each(obj, function (k, v) {
        if (v == undefined) {
            delete obj[k];
        }
    });
    var _this = this;
    this.interactObj.GetMultiConfigFormTool(JSON.stringify({
        key: 'sn,model,version_code,version_name,device_name,os',
        is_server: 0,
        sn_user_id: this.user.userid
    }), function (str) {
        var data = JSON.parse(str);
        $.each(obj, function (k, v) {
            data[k] = v;
        });
        $.ajax({
            url: _this.host + url,
            data: obj,
            type: "GET",
            success: function (res, status, request) {
                var reg = new RegExp("octet-stream");
                if (reg.test(request.getResponseHeader('Content-Type'))) {
                    res = JSON.parse(apidecode(res, data.sn, 'sn,os,model'));
                }
                if (res.status == 100) {
                    var reg = new RegExp('login');
                    if (!reg.test(window.location.href)) {
                        // window.location.href = '/web2/login.html';
                        // window.location.href = _this.asHost + "/login?redirect_uri=" + encodeURIComponent(_this.rtHost + "/web2/dist/#/platform/cloudgame");
                    }
                    callback(res);
                } else {
                    callback(res);
                }
            },
            error: function (error_mes) {
                console.log(error_mes);
            }
        });
    });
};

/**
 * 消息接收
 * @param {object} json
 */
var newsmath = 0;
JYSDK.prototype.receive = function (json) {
    console.log('消息接收：', json);
    if (json.key == "msg_chat") {
        this.chat.chatMessage(json);
        this.setHasMessage('chat', json);
    } else if (json.key == 'apply_friend') {
        next_id = 0;
        this.partner.applyList(next_id);
        if ($("#addPartner").hasClass("on") == true) {
            $("#addPartner").click();
        }
        this.setHasMessage();
    } else if (json.key == 'agree_friend') {
        this.partner.friendList();
    } else if (json.key == 'agree_friend_ack') {
        this.partner.friendList();
    } else if (json.key == 'del_friend') {
        $(".partner_list li").each(function () {
            var chatid = $(this).attr("sn_user_id");
            if (chatid == json.friend_user_id) {
                $(this).remove();
            }
        });
        erromsg = "你已经被" + json.nickname + "移除好友";
        this.erro_msg(erromsg);
    } else if (json.key == 'del_friend_ack') {
        $(".partner_list li").each(function () {
            var chatid = $(this).attr("sn_user_id");
            if (chatid == json.friend_user_id) {
                $(this).remove();
            }
        });

        if ($(".ela_messages").is(':visible')) {
            $("li[pn_nr=talk_pn] .mes_mark").show();
        } else {
            $("li[pn_nr=talk_pn] .mes_mark").hide();
        }
    } else if (json.key == 'msg_tips') {
        this.erro_msg(json.info);
    } else if (json.key == 'room_info') {
        this.room.roomInfo();
    } else if (json.key == 'out_room') {
        this.erro_msg(json.info);
        this.room.roomInfo();
    } else if (json.key == 'room_complete_rate') {
        this.room_completes[json.info.id] = json.info.rate;
        this.room.progressCompleteRate(json.info.rate + '%');
    } else if (json.key == 'device_complete_rate') {
        this.device_completes[json.info.id] = json.info.rate;
        this.equip.progressCompleteRate(json.info.id, json.info.device_id, json.info.rate + '%');
    } else if (json.key == 'close_room') {
        this.erro_msg(json.info);
    } else if (json.key == 'admin_device_logout') {
        device_logout();
    } else if (json.key == 'client_lock') {
        window.location.href = '/web2/lock.html';
    } else if (json.key == 'feedback') {
        window.location.href = '/web2/feedback.html';
    } else if (json.key == 'setting') {
        window.location.href = '/web2/site.html';
    } else if (json.key == 'share') {
        if (typeof jy.share() != "undefined") {
            jy.share();
        }
    } else if (json.key == 'help') {
        window.location.href = '/web2/help-login.html';
    } else if (json.key == 'user-setting') {
        window.location.href = '/web2/site.html?show_page=personal_site';
    } else if (json.key == 'location') {
        window.location.href = json.url;
    } else if (json.key == 'game_error') {
        this.room.reSelectGame(json.room_id);
    } else if (json.key == 'alert_feedback') {
        alert_feedback();
    } else if (json.key == 'alert_qr_code') {
        $('#qr_code').show();
    } else if (json.key == 'cloud_game') {
        window.location.href = '/platform/cloudgame';
    } else if (json.key == 'give_times') {
        if (typeof jy.giveTips != "undefined") {
            jy.giveTips(json.data.msg);
        }
    }
};

/**
 * 设置用户token
 * @param {string} user_token
 */
JYSDK.prototype.setUserToken = function (user_token) {
    try {
        var str = JSON.stringify({
            user_token: user_token
        });
        var _this = this;
        var reg = new RegExp('login');
        if (reg.test(document.referrer)) {
            $('#test_print').append(' SetUserToken :' + str);
            _this.interactObj.SetUserToken(str);
        } else {
            this.interactObj.GetMsStatus(function (arg) {
                $('#test_print').append(' GetMsStatus:' + arg + 'status:' + (arg == false ? 'true' : 'false'));
                if (arg == false) {
                    $('#test_print').append(' SetUserToken :' + str);
                    _this.interactObj.SetUserToken(str);
                }
            });
        }
    } catch (err) {
        $('#test_print').append(' setUserToken error:' + err.message);
    }
};
/**
 * 节点是否在窗口中显示
 * @param {object} $p
 */
JYSDK.prototype.curPos = function ($p) {
    var top = $p.offset().top;
    var scrollH = $(window).scrollTop();
    if (scrollH < top && scrollH + this.winH > top) {
        return true;
    } else {
        return false;
    }
};
/**
 * 获取cookie值
 * @param {string} cookie_name
 * @returns {string}
 */
JYSDK.prototype.getCookie = function (cookie_name) {
    var allcookies = document.cookie;
    var cookie_pos = allcookies.indexOf(cookie_name);
    if (cookie_pos != -1) {
        cookie_pos = cookie_pos + cookie_name.length + 1;
        var cookie_end = allcookies.indexOf(";", cookie_pos);
        if (cookie_end == -1) {
            cookie_end = allcookies.length;
        }
        var value = unescape(allcookies.substring(cookie_pos, cookie_end));
    }
    return value;
};

$('.window_btn').click(function () {
    var url = $(this).data('url');
    $('body').append('<iframe src="' + url + '" class="my_window"></iframe>');
});

function closeMyWindow() {
    $('.my_window').remove();
}

// 错误提示弹窗
JYSDK.prototype.erro_msg = function (erromsg, fun) {
    var opt_str = randomString();
    $("body").append(
        "<div class='erro_msg' id='" + opt_str + "'>" +
        "<div class='box_mes'>" + erromsg + "</div>" +
        "<div class='box_btn'>" +
        "<button type='button' class='ok_btn'>确定</button>" +
        "</div>" +
        "</div>"
    );
    if (typeof (fun) != 'undefined') {
        $('#' + opt_str + ' .ok_btn').click(function () {
            fun();
        });
    }
};

JYSDK.prototype.myConfirm = function (title, content, data, ok_fun, cancel_fun, ok_str, cancel_str) {
    var opt_str = randomString();
    $("body").append(
            '<div class="confirm_container" id="' + opt_str + '">\n\
                    <div class="masks"></div>\n\
                    <div class="confirm_title">' + title + '</div>\n\
                    <div class="confirm_content">' + content + '</div>\n\
                    <div class="opt">\n\
                        <button type="button" class="btn cancel_btn">' + (typeof (cancel_str) == 'undefined' ? '取消' : cancel_str) + '</button>\n\
                        <button type="button" class="btn ok_btn">' + (typeof (ok_str) == 'undefined' ? '确定' : ok_str) + '</button>\n\
                    </div>\n\
                </div>'
            );
    $('#' + opt_str + ' .cancel_btn').click(function () {
        if (cancel_fun) {
            cancel_fun(data, $('#' + opt_str));
        }
        $('.confirm_container').remove();
    });
    $('#' + opt_str + ' .ok_btn').click(function () {
        if (ok_fun) {
            ok_fun(data, $('#' + opt_str));
        }
        $('.confirm_container').remove();
    });
    return $('#' + opt_str);
};

/**
 * 传递用户头像
 * @param {string} avatar
 */
JYSDK.prototype.setAvatar = function (avatar) {
    try {
        var str = JSON.stringify({
            avatar: avatar
        });
        $('#test_print').append(' SetAvatar :' + str);
        this.interactObj.SetAvatar(str);
    } catch (err) {
        $('#test_print').append(' SetAvatar error:' + err.message);
    }
};


/**
 * 设置有消息
 */
JYSDK.prototype.setHasMessage = function (type, chat_json) {
    if (!$('.user_menu').parents('li').hasClass('on')) {
        localStoSet('has_message', 1);
        $('.user_menu').addClass('has_message');
    }
    if (typeof (type) != 'undefined') {
        if (type == 'chat') {
            var chat_id = $(".partner_list .on").attr("sn_user_id");
            var num = localStoGet('message:num:' + chat_json.chat_user_id);
            if (chat_id == chat_json.chat_user_id) {
                num = 0;
            } else {
                if (num > 0) {
                    ++num;
                } else {
                    num = 1;
                }
            }
            localStoSet('message:num:' + chat_json.chat_user_id, num);
            var reg = /\[\[invite\]([^<>]*)\[\/invite\]\]/g;
            var list = reg.exec(chat_json.message);
            if (list) {
                chat_json.message = '好友邀请';
            }
            localStoSet('message:last:' + chat_json.chat_user_id, JSON.stringify(chat_json));
        }
    }
}

function apidecode(string, sn, key) {
    string = decodeURIComponent(string);
    var ckey_length = 8;
    key = md5(key);
    var keya = md5(key);
    var keyb = md5(sn);
    var keyc = string.substr(0, ckey_length);
    var cryptkey = keya + md5(keya + keyc);
    var key_length = cryptkey.length;
    string = window.atob(string.slice(ckey_length));
    var string_length = string.length;
    var result = '';
    var box = [];
    for (var i = 0; i <= 255; i++) {
        box.push(i);
    }
    var rndkey = [];
    for (i = 0; i < 256; i++) {
        rndkey.push((cryptkey.substr(i % key_length, 1)).charCodeAt());
    }
    var tmp = '';
    for (var j = i = 0; i < 256; i++) {
        j = (j + box[i] + rndkey[i]) % 256;
        tmp = box[i];
        box[i] = box[j];
        box[j] = tmp;
    }
    for (var a = j = i = 0; i < string_length; i++) {
        a = (a + 1) % 256;
        j = (j + box[a]) % 256;
        tmp = box[a];
        box[a] = box[j];
        box[j] = tmp;
        result += String.fromCharCode(((string.substr(i, 1)).charCodeAt()) ^ (box[(box[a] + box[j]) % 256]));
    }
    if ((result.substr(0, 10) == 0 || result.substr(0, 10) - Math.floor(Date.parse(new Date()) / 1000) > 0) && result.substr(10, 16) == md5(result.slice(26) + keyb).substr(0, 16)) {
        return decodeURIComponent(Base64._utf8_decode(result.slice(26).replace(/\+/g, ' ')));
    } else {
        return '';
    }
}

//关闭错误弹窗
$(document).on("click", ".erro_msg .ok_btn", function () {
    $(".erro_msg").remove();
});
