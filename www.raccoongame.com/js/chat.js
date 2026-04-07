var ChatStorage = function () {
    this.prev = window.localStorage.getItem('prev');
    if (!this.prev) {
        this.prev = 0;
    }
};
ChatStorage.prototype.loadPrev = function () {
    this.prev = window.localStorage.getItem('prev');
    if (!this.prev) {
        this.prev = 0;
    }
};

ChatStorage.prototype.prefixInteger = function (num, m) {
    return (Array(m).join(0) + num).slice(-m);
}

//倒叙排列
ChatStorage.prototype.resort = function (result) {
    var array = [];
    var len = result.length;
    $.each(result, function (k, v) {
        array[len - k - 1] = v;
    })
    return array;
}
var reg = new RegExp("RaccoonGame");
if (0&&reg.test(navigator.userAgent)) {
//聊天保存记录
    ChatStorage.prototype.chatMessage = function (json) {
        var sql = "INSERT INTO tb_chat_message (chat_room_id,chat_user_id,headimgurl,key,message,nickname,send_time,sn_user_id) VALUES"
                + " ('" + json.chat_room_id + "','" + json.chat_user_id + "','" + json.headimgurl + "','" + json.key + "','" + json.message + "','"
                + json.nickname + "','" + json.send_time + "','" + json.sn_user_id + "');";
        jy.interactObj.SqliteExec(JSON.stringify({sql: sql, password: jy.user.db_pw}));
        return true;
    };
//聊天列表获取
    ChatStorage.prototype.getList = function (chat_user_id, next_date, callback) {
        var _this = this;
        if (next_date) {
            //取出最近一条的时间
            var last_send_time = 'SELECT send_time FROM tb_chat_message WHERE chat_user_id = ' + chat_user_id + ' ORDER BY send_time DESC LIMIT 1';
            jy.interactObj.SqliteExec2(JSON.stringify({sql: last_send_time, password: jy.user.db_pw}), function (res) {
                console.log('chat getList【f1】', res);
                res = JSON.parse(res);
                if (res.length > 0) {
                    var time = res[0]['send_time'];
                    var timearr = time.replace(" ", ":").replace(/\:/g, "-").split("-");
                    var tdate = timearr[0] + "-" + timearr[1] + "-" + timearr[2];
                    var start_time = tdate + ' 00:00:00';
                    var end_time = tdate + ' 23:59:59';
                    var select_data = 'SELECT * FROM tb_chat_message where chat_user_id = ' + chat_user_id + ' and send_time >= "'
                            + start_time + '" and send_time <= "' + end_time + '" ORDER BY send_time DESC';
                    jy.interactObj.SqliteExec2(JSON.stringify({sql: select_data, password: jy.user.db_pw}), function (result) {
                        console.log('chat getList【f2】', result);
                        result = JSON.parse(result);
                        return callback({list: _this.resort(result), next_date: tdate});
                    });
                } else {
                    return callback({list: [], next_date: next_date});
                }
            })
        } else {
            var start_time = next_date + ' 00:00:00';
            var end_time = next_date + ' 23:59:59';
            //取出最近一条的时间
            var last_send_time = 'SELECT send_time FROM tb_chat_message WHERE chat_user_id = '
                    + chat_user_id + ' and send_time<="' + end_time + '" ORDER BY send_time DESC LIMIT 1';
            jy.interactObj.SqliteExec2(JSON.stringify({sql: last_send_time, password: jy.user.db_pw}), function (res) {
                console.log('chat getList【f1】', res);
                res = JSON.parse(res);
                if (res.length > 0) {
                    var time = res[0]['send_time'];
                    var timearr = time.replace(" ", ":").replace(/\:/g, "-").split("-");
                    var tdate = timearr[0] + "-" + timearr[1] + "-" + timearr[2];
                    var start_time = tdate + ' 00:00:01';
                    var end_time = tdate + ' 23:59:59';
                    var select_data = 'SELECT * FROM tb_chat_message where chat_user_id = ' + chat_user_id + ' and send_time >= "'
                            + start_time + '" and send_time <= "' + end_time + '" ORDER BY send_time DESC';
                    jy.interactObj.SqliteExec2(JSON.stringify({sql: select_data, password: jy.user.db_pw}), function (result) {
                        console.log('chat getList【f2】', result);
                        result = JSON.parse(result);
                        return callback({list: _this.resort(result), next_date: tdate});
                    });
                } else {
                    return callback({list: [], next_date: next_date});
                }
            })
        }
    };

//聊天查找
    ChatStorage.prototype.search = function (chat_user_id, content, callback) {
        var search = "SELECT * FROM tb_chat_message WHERE chat_user_id = "
                + chat_user_id + " AND message LIKE '%" + content + "%' ORDER BY send_time DESC";
        jy.interactObj.SqliteExec2(JSON.stringify({sql: search, password: jy.user.db_pw}), function (res) {
            console.log('chat search【f5】', res);
            return callback({list: res});
        });
    };

//聊天清空
    ChatStorage.prototype.clear = function (chat_user_id) {
        jy.interactObj.SqliteExec2(JSON.stringify({sql: 'DELETE FROM tb_chat_message WHERE chat_user_id = '
                    + chat_user_id, password: jy.user.db_pw}), function (res) {
            return true;
        });
    };
} else {
//聊天保存记录
    ChatStorage.prototype.chatMessage = function (json) {
        var time = new Date(json.send_time);
        var key_name = '@' + this.prev + '@chat_message:' + json.chat_user_id + ':' + time.getFullYear() + ""
                + (this.prefixInteger(time.getMonth() + 1, 2)) + "" + this.prefixInteger(time.getDate(), 2);
        var data_str = localStorage.getItem(key_name);
        var data = [];
        if (data_str) {
            data = JSON.parse(data_str);
        }
        data.push(json);
        localStorage.setItem(key_name, JSON.stringify(data));
        return true;
    };
//聊天列表获取
    ChatStorage.prototype.getList = function (chat_user_id, next_date, callback) {
        var date_list = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key_str = localStorage.key(i);
            var reg = new RegExp('@' + this.prev + '@chat_message:' + chat_user_id + ':');
            if (reg.test(key_str)) {
                var tdate = key_str.replace('@' + this.prev + '@chat_message:' + chat_user_id + ':', '');
                if (next_date > 0 && tdate >= next_date) {
                    continue;
                } else {
                    date_list.push(tdate);
                }
            }
        }
        if (date_list.length > 0) {
            date_list = date_list.sort();
            var adate = date_list.pop();
            var key_name = '@' + this.prev + '@chat_message:' + chat_user_id + ':' + adate;
            var data_str = localStorage.getItem(key_name);
            var data = [];
            if (data_str) {
                data = JSON.parse(data_str);
            }
            return typeof (callback) == 'function' ? callback({list: data, next_date: adate}) : {list: data, next_date: adate};
        } else {
            return typeof (callback) == 'function' ? callback({list: [], next_date: next_date}) : {list: [], next_date: next_date};
        }
    };
//聊天查找
    ChatStorage.prototype.search = function (chat_user_id, content, callback) {
        var date_list = [];
        var list = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key_str = localStorage.key(i);
            var reg = new RegExp('@' + this.prev + '@chat_message:' + chat_user_id + ':');
            if (reg.test(key_str)) {
                var tdate = key_str.replace('@' + this.prev + '@chat_message:' + chat_user_id + ':', '');
                date_list.push(tdate);
            }
        }
        if (date_list.length > 0) {
            date_list = date_list.sort();
            var reg_content = new RegExp(content);
            for (var l = 0; l < date_list.length; l++) {
                var adate = date_list[l];
                var key_name = '@' + this.prev + '@chat_message:' + chat_user_id + ':' + adate;
                var data_str = localStorage.getItem(key_name);
                var data = [];
                if (data_str) {
                    data = JSON.parse(data_str);
                }
                $.each(data, function (k, v) {
                    if (reg_content.test(v.message)) {
                        list.push(v);
                    }
                })
            }
        }
        return typeof (callback) == 'function' ? callback({list: list}) : {list: list};
    };
    //聊天清空
    ChatStorage.prototype.clear = function (chat_user_id) {
        for (var i = 0; i < localStorage.length; i++) {
            var key_str = localStorage.key(i);
            var reg = new RegExp('@' + this.prev + '@chat_message:' + chat_user_id + ':');
            if (reg.test(key_str)) {
                localStorage.removeItem(key_str);
            }
        }
        return true;
    };
}
