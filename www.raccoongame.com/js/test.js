var reg = new RegExp("RaccoonGame");
if (!reg.test(navigator.userAgent)) {
    $(function () {
        $('header').css('display', 'flex');
        $('.content').css('height', '90vh');
        $('.partner_list').css('height', '75vh');
    });
    var rt_host = "";
    var qt = {
        webChannelTransport: 'test'
    };
    var Wss = function () {
        this.request = new MyRequest();
        this.wsClient = null;
        this.timerPing = null;
        this.reconnectTimer = null;
    };
    Wss.prototype.play = function (url) {
        if (this.timerPing) {
            window.clearInterval(this.timerPing);
            this.timerPing = null;
        }
        if (this.wsClient) {
            this.wsClient.close();
        }
        var _this = this;
        console.log('开始连接websocket：', url);
        this.wsClient = new WebSocket(url);
        this.wsClient.onopen = function () {
            console.log('websocket连接成功');
            if (_this.reconnectTimer) {
                window.clearInterval(_this.reconnectTimer);
            }
            var user_token = window.localStorage.getItem('user_token');
            _this.wsClient.send(JSON.stringify({
                user_token: user_token,
                type: 'sign_in',
                from_tag: 'UA',
                data: {}
            }));
        }
        this.wsClient.onmessage = function (e) {
            var json = JSON.parse(e.data)
            if (json.type == 'sign_in_ack') {
                _this.timerPing = setInterval(function () {
                    _this.wsClient.send(JSON.stringify({
                        type: 'ping',
                        from_tag: 'UA',
                        // 修改 jy.room.roomId
                        data: {room_id: jy.roomId}
                    }));
                }, 30000);
            } else if (json.type == 'msg_to_h5') {
                SendH5MsgCallBack(JSON.stringify(json.data));
            }
            // console.log('websocket消息：', json);
        };
        this.wsClient.onclose = function () {
            console.log('连接已经断开');
            if (_this.timerPing) {
                window.clearInterval(_this.timerPing);
                _this.timerPing = null;
            }
            if (_this.reconnectTimer) {
                window.clearInterval(_this.reconnectTimer);
            }
            _this.reconnectTimer = setInterval(function () {
                _this.play(url);
            }, 5000);
            _this.wsClient = null;
        }
    };
    Wss.prototype.sendMessage = function (str) {
        if (this.wsClient) {
            this.wsClient.send(str);
        }
    };
    Wss.prototype.getMs = function () {
        var user_token = window.localStorage.getItem('user_token');
        var _this = this;
        jy.interactObj.GetMultiConfigFormTool(JSON.stringify({
            key: 'sn,model,version_code,version_name,device_name',
            is_server: 0,
            sn_user_id: 0
        }), function (str) {
            var obj = JSON.parse(str);
            var json = {
                user_token: user_token
            }
            json.sn = obj.sn;
            json.model = obj.model;
            json.version_code = obj.version_code;
            json.version_name = obj.version_name;
            json.device_name = obj.device_name;
            _this.request.post(rt_host + '/api/device/getMsLimit', json, function (json) {
                if (json.status == 200) {
                    _this.play(json.data.ms.url);
                } else {
                    console.log('/device/getMsLimit错误回执：', json);
                }
            });
        });
    };

    var MyRequest = function () {

    };
    MyRequest.prototype.post = function (url, obj, callback) {
        $.ajax({
            url: url,
            data: obj,
            type: "POST",
            dataType: "json",
            success: function (res) {
                callback(res);
            },
            error: function (error_mes) {
                console.log(error_mes);
            }
        });
//    var httpRequest = new XMLHttpRequest();
//    httpRequest.open('POST', url, true);
//    httpRequest.setRequestHeader("Content-type", "application/json");
//    httpRequest.send(JSON.stringify(obj));
//    httpRequest.onreadystatechange = function () {
//        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
//            var json = httpRequest.responseText;
//            callback(JSON.parse(json));
//        }
//    };
    };
    var ConManualVerifyCallBack = null;
    var ConPasswdVerifyCallBack = null;
    var SendH5MsgCallBack = null;
    var ClosedDeviceGameRoom = null;
    var wss = new Wss();
    var Channel = function () {
//    myTestInit();
    };
    function myTestInit() {
        var user_token = window.localStorage.getItem('user_token');
        if (user_token) {
            wss.getMs();
        }
    }
    Channel.prototype.objects = {
        interactObj: {
            ConManualVerify: {
                connect: function (callback) {
                    ConManualVerifyCallBack = callback;
                }
            },
            ConPasswdVerify: {
                connect: function (callback) {
                    ConPasswdVerifyCallBack = callback;
                }
            },
            SendH5Msg: {
                connect: function (callback) {
                    SendH5MsgCallBack = callback;
                }
            },
            ClosedDeviceGameRoom: {
                connect: function (callback) {
                    ClosedDeviceGameRoom = callback;
                }
            },
            H5MsgToMs: function (str, callback) {
                wss.sendMessage(str);
                callback(true);
            },
            GetProcessInfo: function (callback) {
                console.log('GetProcessInfo');
                return callback(JSON.stringify([{"exe_name": "NBA2K20.exe", "pid": "1936", "title_name": 'NBA'}, {"exe_name": "chrome.exe", "pid": "15868", "title_name": "ShowDoc - Google Chrome"}, {"exe_name": "devenv.exe", "pid": "19952", "title_name": "ToolServer (正在运行) - Microsoft Visual Studio "}]));
            },
            CreateRoom: function (str, callback) {
                console.log('CreateRoom:', str);
                var create_data = JSON.parse(str);
                wss.sendMessage(JSON.stringify({
                    type: 'ping',
                    from_tag: 'UA',
                    data: {
                        room_id: create_data.room_id,
                        room_user_ids: ''
                    }
                }));
                return callback(true);
            },
            JoinGameRoom: function (str, callback) {
                console.log('JoinGameRoom:', str);
                return callback(true);
            },
            QuitGameRoom: function (str, callback) {
                console.log('QuitGameRoom', str);
                return callback(true);
            },
            OutGameRoom: function (str, callback) {
                console.log('OutGameRoom', str);
                return callback(true);
            },
            CloseGameRoom: function (str, callback) {
                console.log('CloseGameRoom', str);
                return callback(true);
            },
            SetUserToken: function (str) {
                var json = JSON.parse(str);
                window.localStorage.setItem('user_token', json['user_token']);
                myTestInit();
            },
            GetMsStatus: function (callback) {
                callback(0);
            },
            SetConfigToTool: function (str, callback) {
                var json = JSON.parse(str);
                if (json['is_server'] == undefined) {
                    console.log('setconfig缺少is_server', str);
                    return false;
                }
                json['sn_user_id'] = 0;
                if (json['sn_user_id'] == undefined) {
                    console.log('setconfig缺少sn_user_id', str);
                    return false;
                }
                if (json['key'] == undefined) {
                    console.log('setconfig缺少key', str);
                    return false;
                }
                if (json['content'] == undefined) {
                    console.log('setconfig缺少content', str);
                    return false;
                }
                var set_config_str = window.localStorage.getItem('set_config');
                var set_config = set_config_str ? JSON.parse(set_config_str) : {};
                if (set_config[json['is_server']] == undefined) {
                    set_config[json['is_server']] = {};
                }
                if (set_config[json['is_server']][json['sn_user_id']] == undefined) {
                    set_config[json['is_server']][json['sn_user_id']] = {};
                }
                set_config[json['is_server']][json['sn_user_id']][json['key']] = json['content'];
                window.localStorage.setItem('set_config', JSON.stringify(set_config));
                callback(true);
            },
            GetConfigFormTool: function (str, callback) {
                var set_config_str = window.localStorage.getItem('set_config');
                var set_config = set_config_str ? JSON.parse(set_config_str) : {};
                var json = JSON.parse(str);
                if (json['is_server'] == undefined) {
                    console.log('getconfig缺少is_server', str);
                    return false;
                }
                if (json['sn_user_id'] == undefined) {
                    console.log('getconfig缺少sn_user_id', str);
                    return false;
                }
                json['sn_user_id'] = 0;
                if (json['key'] == undefined) {
                    console.log('getconfig缺少key', str);
                    return false;
                }
                if (json['key'] == 'sn') {
                    callback(getHash());
                } else if (json['key'] == 'model') {
                    callback(getBrowser());
                } else if (json['key'] == 'version_code') {
                    callback('1');
                } else if (json['key'] == 'version_name') {
                    callback('1.0.0');
                } else if (json['key'] == 'device_name') {
                    var device_name = set_config[json['is_server']] == undefined || set_config[json['is_server']][json['sn_user_id']] == undefined || set_config[json['is_server']][json['sn_user_id']][json['key']] == undefined ? '我的设备' : set_config[json['is_server']][json['sn_user_id']][json['key']];
                    callback(device_name);
                } else if (json['key'] == 'os') {
                    callback('web');
                } else {
                    var config_data = set_config[json['is_server']] == undefined || set_config[json['is_server']][json['sn_user_id']] == undefined || set_config[json['is_server']][json['sn_user_id']][json['key']] == undefined ? '' : set_config[json['is_server']][json['sn_user_id']][json['key']];
                    callback(config_data);
                }
            },
            GetMultiConfigFormTool: function (str, callback) {
                var set_config_str = window.localStorage.getItem('set_config');
                var set_config = set_config_str ? JSON.parse(set_config_str) : {};
                var json = JSON.parse(str);
                json['sn_user_id'] = 0;
                if (json['is_server'] == undefined) {
                    console.log('getMultiConfig缺少is_server', str);
                    return false;
                }
                if (json['sn_user_id'] == undefined) {
                    console.log('getMultiConfig缺少sn_user_id', str);
                    return false;
                }
                if (json['key'] == undefined) {
                    console.log('getMultiConfig缺少key', str);
                    return false;
                }
                var keys = json['key'].split(',');
                var result = {};
                keys.forEach(function (item) {
                    if (item == 'sn') {
                        result[item] = getHash();
                    } else if (item == 'model') {
                        result[item] = getBrowser();
                    } else if (item == 'version_code') {
                        result[item] = '1';
                    } else if (item == 'version_name') {
                        result[item] = '1.0.0';
                    } else if (item == 'device_name') {
                        result[item] = set_config[json['is_server']] == undefined || set_config[json['is_server']][json['sn_user_id']] == undefined || set_config[json['is_server']][json['sn_user_id']][item] == undefined ? '我的设备' : set_config[json['is_server']][json['sn_user_id']][item];
                    } else if (item == 'os') {
                        result[item] = 'web';
                    } else {
                        result[item] = set_config[json['is_server']] == undefined || set_config[json['is_server']][json['sn_user_id']] == undefined || set_config[json['is_server']][json['sn_user_id']][item] == undefined ? '' : set_config[json['is_server']][json['sn_user_id']][item];
                    }
                });
                callback(JSON.stringify(result));
            },
            ApplyForConnect: function (str, callback) {
                var json = JSON.parse(str);
                console.log(json, '发送连接申请');
                callback(true);
            },
            AgreeApplyConnect: function (str, callback) {
                var json = JSON.parse(str);
                console.log(json, '同意连接');
                callback(true);
            },
            RefuseApplyConnect: function (str, callback) {
                var json = JSON.parse(str);
                console.log(json, '拒绝连接');
                callback(true);
            },
            CloseConnect: function (str, callback) {
                var json = JSON.parse(str);
                console.log(json, '断开连接');
                callback(true);
            },
            UserLogout: function () {
                console.log('用户退出');
            },
            GetControlInfo: function (str, callback) {
                var result = [];
                $('#roombox .player_box li').each(function () {
                    if ($(this).find('.control_btn').length) {
                        result.push({
                            device_id: $(this).data('did'),
                            km_enable: $(this).find('.control_btn.keyboard').hasClass('disabled') ? 0 : 1,
                            gp_enable: $(this).find('.control_btn.handle').hasClass('disabled') ? 0 : 1
                        });
                    } else {
                        if (jy.room.isMaster == 1) {
                            if (jy.user.userInfo.device_id != $(this).data('did')) {
                                result.push({
                                    device_id: $(this).data('did'),
                                    km_enable: 1,
                                    gp_enable: 1
                                });
                            }
                        } else {
                            if (jy.user.userInfo.device_id == $(this).data('did')) {
                                result.push({
                                    device_id: $(this).data('did'),
                                    km_enable: 1,
                                    gp_enable: 1
                                });
                            }
                        }

                    }
                });
                callback(JSON.stringify(result));
            },
            SetControlInfo: function (str, callback) {
                var json = JSON.parse(str);
                callback(JSON.stringify(json));
            },
            PlayGame: function (str, callback) {
                return window.interactObj.PlayGame(str);
            },
            ReconGame: function (str, callback) {
                console.log('ReconGame', str);
                return window.interactObj.ReconGame(str);
            },
            TakeGame: function (str, callback) {
                console.log('TakeGame', str);
                return window.interactObj.TakeGame(str);
            },
            RefreshQueue: function (str, callback) {
                console.log('RefreshQueue', str);
                return window.interactObj.RefreshQueue(str);
            },
        }
    };
    var QWebChannel = function (qt_webChannelTransport, callback) {
        if (qt_webChannelTransport != 'test') {
            alert('加载qt.webChannelTransport');
        }
        this.channel = new Channel();
        callback(this.channel);
    };
}
