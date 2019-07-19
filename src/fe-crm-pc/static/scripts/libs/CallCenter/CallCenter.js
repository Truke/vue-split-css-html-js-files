(function () {
    if ($ && jQuery && $ !== jQuery) {
        jQuery.noConflict();
    }
    window.CallCenter = window.CallCenter || {
            version: "2.1.0.23",

            _debug: false,          //是否调试
            _thisPath: sourcePath+'/fe-crm-pc/static/scripts/libs/CallCenter/',        //当前文件路径
            _wsurl: null,           //WebSocket地址
            _companyid: null,       //企业编号
            _abbreviate: null,      //企业简写
            _operatorid: null,      //工号
            _password: null,        //密码
            _media_ip: null,        //媒体服务器IP
            _media_port: null,      //媒体服务器port
            _sip_id: null,          //SIP账号
            _sip_pwd: null,         //SIP密码
            _logintype: null,       //登录方式,0手机,1SIP话机,2软话机
            _auto: 0,                //是否预测外呼，0否1是
            _logingroups: "",       //登录到的技能组（自动外呼用）

            _url_3cs: null,         //3cs的地址
            _url_3cs_ssl: false,    //3cs前缀，是否为ssl
            _sendlog: false,        //是否启用远端写日志
            _websocket_3cs: null,   //3cs连接

            _defaultBusyText: "忙碌",//默认忙碌显示文字
            _defaultIdleText: "空闲",//默认空闲显示文字
            _islogin: false,        //是否已经登录
            _calling: false,        //是否在通话中
            _isCallout: false,      //通话中是否为外呼触发
            _preview: null,         //预测外呼用
            _nowStatus: null,       //当前座席状态
            _busyType: 0,           //当前坐席忙碌类型
            _hidePhone: false,      //是否隐藏号码不显示到界面
            _transmission_number: "",//透传的号码

            _callId: "",            //callid
            _timestamp: "",         //callid匹配的timestamp
            _called: "",            //被叫号码
            _caller: "",            //主叫号码
            _calling_from: "",      //通话中的状态来源
            _be_operator: "",           //被操作人

            _status: "",                    //当前CCS返回状态
            _statusText: "等待连接",         //当前状态文字
            _isAllowReConnection: true,     //是否可以重连
            _isReLogin: false,              //是否为重连方式的登录
            _callingtimer: 0,           //通话时长
            _timerspan: 0,              //状态栏计时秒数
            _timerId: 0,                //状态栏时间控件编号
            _eventAlertTimeoutId: 0,    //时间提醒计时器编号

            _websocket: null,           //ws对象
            _lastmsg: null,             //最后一次发送的消息
            _drawType: 0,               //使用的全图标布局还是简版，1简版2全图标
            _useOcx: false,             //是否使用了OCX
            _calloutHideTCButton: false,//外呼是否隐藏转接咨询按钮
            _openOnlyMuteCustomer: false, //保持时是否静音两端
            _getIdleAgentFromTC: 0,     //获取空闲来源，0无，1转接，2咨询
            _events: [],                //事件列表
            _availablegroup: false,     //是否登录时先获取可用技能组
            _websocket_ocx: null,       //ocx的ws对象

            _busyTypeMap: null,         //忙碌类型map
            _serverType: 1,             //服务类型
            _serverType_ccs: 1,         //服务类型,CCS
            _serverType_cti: 2,         //服务类型,CTI
            _clientType: 1,             //客户端类型
            _clientType_sipphone: 1,    //客户端类型SIPPHONE
            _clientType_ocx: 2,         //客户端类型OCX
            _isMeeting: false,           //是否会议模式，会议模式没有咨询转接转IVR
            _isInnercall: false,        //是否内呼

            _sendcmd: {
                cmd: null,
                operatorid: null,
                password: null,
                abbreviate: null,
                worktype: null,
                companyid: null,
                auto: null,
                logingroups: null,
                sequence: null,
                caller: null,
                called: null,
                num: null
            },

            //下面为功能性函数----------------------------------------------------------------------------------------------
            set3CS_url: function (url) {
                if (typeof(url) != "undefined"
                    && url != null
                    && url != ""
                    && url.length > 8
                    && CallCenter._url_3cs != url) {
                    CallCenter._url_3cs = url;
                    if (CallCenter._url_3cs.indexOf("http://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(7, CallCenter._url_3cs.length);
                    } else if (CallCenter._url_3cs.indexOf("https://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(8, CallCenter._url_3cs.length);
                        CallCenter._url_3cs_ssl = true;
                    }
                    if (CallCenter._url_3cs.indexOf("ws://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(5, CallCenter._url_3cs.length);
                    } else if (CallCenter._url_3cs.indexOf("wss://") == 0) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(6, CallCenter._url_3cs.length);
                        CallCenter._url_3cs_ssl = true;
                    }
                    if (CallCenter._url_3cs != null && CallCenter._url_3cs != ""
                        && CallCenter._url_3cs.lastIndexOf("/") == (CallCenter._url_3cs.length - 1)) {
                        CallCenter._url_3cs = CallCenter._url_3cs.substr(0, CallCenter._url_3cs.length - 1);
                    }
                    CallCenter.log("设置3CS_url为：" + CallCenter._url_3cs);
                    if (CallCenter._websocket_3cs != null) {
                        try {
                            CallCenter._websocket_3cs.close();
                        } catch (ex) {
                            CallCenter.log("关闭ws_3cs异常", false);
                        }
                    }
                }
                if (CallCenter._websocket_3cs == null
                    && typeof(CallCenter._url_3cs) != "undefined"
                    && CallCenter._url_3cs != null
                    && CallCenter._url_3cs != "") {
                    var url = CallCenter._url_3cs + "/ws";
                    if (CallCenter._url_3cs_ssl) {
                        url = "wss://" + url;
                    } else {
                        url = "ws://" + url;
                    }
                    if ('WebSocket' in window) {//支持原生WebSocket
                        /*
                         CallCenter._websocket_3cs = new WebSocket(url);
                         CallCenter._websocket_3cs.onopen = CallCenter.onopen_3cs;
                         CallCenter._websocket_3cs.onmessage = CallCenter.onmessage_3cs;
                         CallCenter._websocket_3cs.onclose = CallCenter.onclose_3cs;
                         CallCenter._websocket_3cs.onerror = CallCenter.onerror_3cs;
                         */
                        CallCenter._useOcx = false;
                    } else {//不支持原生WebSocket
                        if (window.ActiveXObject || "ActiveXObject" in window) {
                            /*
                             CallCenter._websocket_3cs = CallCenter.newWebSocket(url);
                             CallCenter._websocket_3cs.onopen = CallCenter.onopen_3cs;
                             CallCenter._websocket_3cs.onmessage = CallCenter.onmessage_3cs;
                             CallCenter._websocket_3cs.onclose = CallCenter.onclose_3cs;
                             CallCenter._websocket_3cs.onexception = CallCenter.onerror_3cs;
                             */
                            CallCenter._useOcx = true;
                        } else {
                            alert('您的浏览器不支持WebSocket!');
                        }
                    }
                }
            },
            /**
             * 更改忙碌显示文字
             * @param showText
             */
            setBusyText: function (showText) {
                CallCenter._defaultBusyText = showText;
                jQuery(".CallCenter_defaultBusyText").html(showText);
                CallCenter._busyTypeMap.put(0, showText);
            },
            /**
             * 更改空闲显示文字
             * @param showText
             */
            setIdleText: function (showText) {
                CallCenter._defaultIdleText = showText;
                jQuery(".CallCenter_defaultIdleText").html(showText);
            },
            /**
             * 启用日志发送到服务器
             */
            openClientLog: function () {
                CallCenter._sendlog = true;
                CallCenter.log("开启发送日志到服务端", true);
            },
            /**
             * 关闭日志发送到服务器
             */
            closeClientLog: function () {
                CallCenter._sendlog = false;
                CallCenter.log("关闭发送日志到服务端", false);
            },
            /**
             * 添加忙碌按钮
             * @param typeId
             * @param showText
             * @returns {CallCenter}
             */
            addBusyButton: function (typeId, showText) {
                var exist = CallCenter._busyTypeMap.get(typeId);
                CallCenter._busyTypeMap.put(typeId, showText);
                if (CallCenter._drawType == 1) {
                    var li = jQuery('<li class="CallCenter_busy" id="CallCenter_busy' + typeId + '"></li>');
                    var li_a = jQuery('<span>' + showText + '</span>');
                    li_a.bind("click", {type: typeId}, function (e) {
                        CallCenter.busy(e.data.type);
                        jQuery("#CallCenter_status_buts").hide();
                        e.stopPropagation();
                        return false;
                    });
                    li.append(li_a);
                    if (exist) {
                        jQuery("#CallCenter_busy" + typeId).replaceWith(li);
                    } else {
                        jQuery("#CallCenter_status_buts").append(li);
                    }
                } else if (CallCenter._drawType == 2) {
                    var e_a = jQuery('<span class="CallCenter_button"></span>');
                    var e_icon = jQuery('<div class="CallCenter_icon"></div>');
                    var e_text = jQuery('<div class="CallCenter_text"></div>');
                    var e_1_3_a = e_a.clone();
                    var e_1_3_icon = e_icon.clone();
                    var e_1_3_text = e_text.clone();
                    e_1_3_icon.attr("id", "CallCenter_busy_icon" + typeId).append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-3.png"/>');
                    e_1_3_text.attr("id", "CallCenter_busy_text" + typeId).html(showText);
                    e_1_3_a.attr("id", "CallCenter_busy" + typeId).addClass("CallCenter_busy").append(e_1_3_icon).append(e_1_3_text);
                    e_1_3_a.bind("click", {type: typeId}, function (e) {
                        if (jQuery(this).find("img").data("status") == "active")
                            CallCenter.busy(e.data.type);
                    })
                    if (exist) {
                        jQuery("#CallCenter_busy" + typeId).replaceWith(e_1_3_a);
                    } else {
                        jQuery("#CallCenter_busy").after(e_1_3_a);
                    }

                }

                return this;
            },
            /**
             * 移除忙碌按钮
             * @param typeId
             * @returns {CallCenter}
             */
            removeBusyButton: function (typeId) {
                jQuery("#CallCenter_busy" + typeId).remove();
                CallCenter._busyTypeMap.remove(typeId);
                return this;
            },
            /**
             * 添加登录的技能组
             * @param showText
             * @param groupId
             */
            addLoginGroup: function (showText, groupId, status) {
                if (CallCenter._drawType == 1) {
                    var li = jQuery('<li class="CallCenter_login_group" id="CallCenter_group_' + groupId + '"></li>');
                    var li_span = jQuery('<span></span>');
                    if (status == 2) {
                        li_span.html(showText + '(暂停中)');
                        li_span.css('color', '#ccc');
                    } else {
                        li_span.html(showText + '(运行中)');
                        li_span.bind("click", {groupId: groupId}, function (e) {
                            CallCenter.setLoginGroups(e.data.groupId);
                            CallCenter.login();
                            jQuery("#CallCenter_status_buts").hide();
                        });
                    }
                    li.append(li_span);
                    jQuery("#CallCenter_status_buts").append(li);
                } else {
                    var pannel;
                    if (jQuery('#CallCenter_login_group_pannel').length == 0) {
                        pannel = jQuery('<div id="CallCenter_login_group_pannel"></div>');
                        var offset = jQuery('#CallCenter_login').offset();
                        var left = offset.left || 0;
                        var top = offset.top || 0;
                        pannel.css({
                            'postion': 'absolute',
                            'left': left,
                            'top': top + jQuery('#CallCenter_login').height()
                        })
                        jQuery('#CallCenter_main').prepend(pannel);
                    }
                    pannel = jQuery('#CallCenter_login_group_pannel');
                    var div = jQuery('<div class="CallCenter_login_group" id="CallCenter_group_' + groupId + '"></div>');

                    if (status == 2) {
                        div.html(showText + '(暂停中)');
                        div.css('color', '#ccc');
                    } else {
                        div.html(showText + '(运行中)');
                        div.bind("click", {groupId: groupId}, function (e) {
                            CallCenter.setLoginGroups(e.data.groupId);
                            CallCenter.login();
                            pannel.hide();
                        });
                    }
                    pannel.append(div);
                }
            },
            /**
             * 开启外呼后显示咨询转接
             */
            openCalloutTC: function () {
                CallCenter._calloutHideTCButton = false;
            },
            /**
             * 关闭外呼后显示咨询转接
             */
            closeCalloutTC: function () {
                CallCenter._calloutHideTCButton = true;
            },
            /**
             * 隐藏号码段
             */
            hidePhone: function () {
                CallCenter._hidePhone = true;
            },
            /**
             * 显示完整号码
             */
            showPhone: function () {
                CallCenter._hidePhone = false;
            },
            /**
             * 设置透传号码
             * @param number
             */
            setTransmissionNumber: function (number) {
                CallCenter._transmission_number = number;
            },
            /**
             * 添加事件到监听
             * @param event
             * @param fun
             * @returns {*}
             */
            addEventListener: function (event, fun) {
                if (typeof(fun) != "function") {
                    return '';
                }
                if (typeof(CallCenter._events[event]) == 'undefined') {
                    CallCenter._events[event] = [];
                }
                var uuid = CallCenter.getUUID();
                CallCenter._events[event][uuid] = fun;
                return uuid;
            },
            /**
             * 根据事件id移除事件
             * @param event
             * @param uuid
             * @returns {number}
             */
            removeEventListener: function (event, uuid) {
                if (typeof(CallCenter._events[event]) == 'undefined') {
                    return 0;
                } else {
                    delete CallCenter._events[event][uuid];
                    return 1;
                }
            },
            /**
             * 获取事件函数当前个数
             * @param event
             * @returns {number}
             */
            getEventListenerCount: function (event) {
                if (typeof(CallCenter._events[event]) == 'undefined') {
                    return 0;
                } else {
                    return CallCenter._events[event].length;
                }
            },
            /**
             * 开启登录后获取技能组
             */
            openAvailablegroup: function () {
                CallCenter._availablegroup = true;
            },
            /**
             * 关闭登录后获取技能组
             */
            closeAvailablegroup: function () {
                CallCenter._availablegroup = false;
            },
            /**
             * 开启只静音客户
             */
            openOnlyMuteCustomer: function () {
                CallCenter._openOnlyMuteCustomer = true;
            },
            /**
             * 关闭只静音客户
             */
            closeOnlyMuteCustomer: function () {
                CallCenter._openOnlyMuteCustomer = false;
            },
            /**
             * 设置登录的技能组
             * @param ids
             */
            setLoginGroups: function (ids) {
                CallCenter._logingroups = ids;
                CallCenter._sendcmd.logingroups = ids;
            },
            /**
             * 销毁布局
             */
            destory: function () {
                jQuery("#CallCenter_main").remove();
            },
            //上面为功能性函数----------------------------------------------------------------------------------------------

            //下面为获取部分参数------------------------------------------------------------------------------------------
            /**
             * 获取版本信息
             * @returns {string}
             */
            getVersion: function () {
                return this.version;
            },
            /**
             * 获取Callid
             * @returns {string}
             */
            getCallid: function () {
                return CallCenter._callId;
            },
            /**
             * 获取Callid匹配的timestamp
             * @returns {string}
             */
            getTimestamp: function () {
                return CallCenter._timestamp;
            },
            /**
             * 获取主叫号码
             * @returns {string}
             */
            getCaller: function () {
                return CallCenter._caller;
            },
            /**
             * 获取被叫号码
             * @returns {string}
             */
            getCalled: function () {
                return CallCenter._called;
            },
            /**
             * 是否智能外呼
             * @returns {boolean}
             */
            isAuto: function () {
                if (CallCenter._auto == 0) {
                    return false;
                } else {
                    return true;
                }
            },
            /**
             * 获取WebSocket的连接地址
             * @returns {null}
             */
            getWsurl: function () {
                return CallCenter._wsurl;
            },
            /**
             * 获取企业ID
             * @returns {null}
             */
            getCompanyid: function () {
                return CallCenter._companyid;
            },
            /**
             * 获取企业简拼
             * @returns {null}
             */
            getAbbreviate: function () {
                return CallCenter._abbreviate;
            },
            /**
             * 获取工号
             * @returns {null}
             */
            getOperatorid: function () {
                return CallCenter._operatorid;
            },
            /**
             * 获取密码
             * @returns {null}
             */
            getPassword: function () {
                return CallCenter._password;
            },
            /**
             * 获取媒体IP
             * @returns {null}
             */
            getMediaip: function () {
                return CallCenter._media_ip;
            },
            /**
             * 获取媒体端口
             * @returns {null}
             */
            getMediaport: function () {
                return CallCenter._media_port;
            },
            /**
             * 获取SIP编号
             * @returns {null}
             */
            getSipid: function () {
                return CallCenter._sip_id;
            },
            /**
             * 获取SIP密码
             * @returns {null}
             */
            getSippwd: function () {
                return CallCenter._sip_pwd;
            },
            /**
             * 获取登录方式0手机,1SIP话机,2软话机
             * @returns {null}
             */
            getLoginType: function () {
                return CallCenter._logintype;
            },
            /**
             * 是否已经登录
             * @returns {boolean}
             */
            isLogin: function () {
                return CallCenter._islogin;
            },
            /**
             * 是否通话中
             * @returns {boolean}
             */
            isCalling: function () {
                return CallCenter._calling;
            },
            /**
             * 是否外呼
             * @returns {boolean}
             */
            isOutbound: function () {
                return CallCenter._isCallout;
            },
            /**
             * 获取当前状态,判断是否通话中使用，仅返回 logon/offwork/agentidle/agentbusy/after 其中一种
             * @returns {null}
             */
            getNowStatus: function () {
                return CallCenter._nowStatus;
            },
            /**
             * 获取当前状态
             * @returns {string}
             */
            getStatus: function () {
                return CallCenter._status;
            },
            /**
             * 获取当前状态文本
             * @returns {null}
             */
            getNowStatusText: function () {
                return CallCenter._statusText;
            },
            /**
             * 获取忙碌类型
             * @returns {number}
             */
            getBusyType: function () {
                return CallCenter._busyType;
            },
            /**
             * 获取忙碌类型Map
             * @returns {null}
             */
            getBusyTypeMap: function () {
                return CallCenter._busyTypeMap;
            },
            /**
             * 获取当前呼叫时长
             * @returns {number}
             */
            getCallDuration: function () {
                return CallCenter._callingtimer;
            },
            /**
             * 获取当前状态持续时长
             * @returns {number}
             */
            getStatusDuration: function () {
                return CallCenter._timerspan;
            },
            /**
             * 获取使用的软话机类型
             * @returns {number}
             */
            getClientType: function () {
                return CallCenter._clientType;
            },
            /**
             * 获取透传号码
             * @returns {string}
             */
            getTransmissionNumber: function () {
                return CallCenter._transmission_number;
            },
            /**
             * 获取是否会议模式
             * @returns {boolean}
             */
            isMeeting: function () {
                return CallCenter._isMeeting;
            },
            /**
             * 获取通话来源,inringing/makecall/monitor/interceptcall/agentinsert
             */
            getCallFrom: function () {
                return CallCenter._calling_from;
            },
            /**
             * 获取是否登录后获取技能组
             * @returns {boolean}
             */
            getavailablegroup: function () {
                return CallCenter._availablegroup;
            },
            /**
             * 获取被操作的座席
             * @returns {string}
             */
            getBeOperator: function () {
                return CallCenter._be_operator;
            },
            //上面为获取部分参数------------------------------------------------------------------------------------------

            //下面为初始化调用------------------------------------------------------------------------------------------
            /**
             * 生成布局
             * @returns {*|jQuery|HTMLElement}
             */
            draw: function () {
                CallCenter._drawType = 1;
                CallCenter.createCss(CallCenter._thisPath + "CallCenter.css");
                jQuery('#CallCenter_main').remove();
                var e1 = jQuery('<div id="CallCenter_main" class="navleft"></div>');
                var e1_1 = jQuery('<div id="CallCenter_status_bar" class="agent"></div>');
                e1_1.bind("click", function (e) {
                    if (CallCenter.getNowStatus() != null && CallCenter.getNowStatus() != 'offwork') {
                        if (jQuery('#CallCenter_status_buts').children(':visible').length > 0) {
                            CallCenter.showControl('#CallCenter_status_buts');
                        }
                    }
                    if (CallCenter.getStatus() == 'availablegroup') {
                        CallCenter.showControl('#CallCenter_status_buts');
                    }
                })
                var e1_1_1 = jQuery('<span id="CallCenter_status_tiao" class="telbtn green"></span>');
                var e1_1_1_1 = jQuery('<div class="con"></div>');
                var e1_1_1_1_1 = jQuery('<div class="time">00:00:00</div>');
                var e1_1_1_1_2 = jQuery('<img src="' + CallCenter._thisPath + 'images/line.png" class="line"/>');
                var e1_1_1_1_3 = jQuery('<div id="CallCenter_status" class="status">等待连接</div>');
                var e1_1_1_1_4 = jQuery('<div id="CallCenter_phonenum" class="num"></div>');
                e1_1_1_1.append(e1_1_1_1_1);
                e1_1_1_1.append(e1_1_1_1_2);
                e1_1_1_1.append(e1_1_1_1_3);
                e1_1_1_1.append(e1_1_1_1_4);
                e1_1_1.append(e1_1_1_1);
                var e1_1_1_2 = jQuery('<span class="trig"></span>');
                e1_1_1.append(e1_1_1_2);
                var e1_1_1_3 = jQuery('<div class="dialog">提醒</div>');
                e1_1_1.append(e1_1_1_3);
                e1_1.append(e1_1_1);

                var e1_1_2 = jQuery('<ul id="CallCenter_status_buts" class="softphone" style="display:none;"></ul>');
                var e1_1_2_1 = jQuery('<li id="CallCenter_free" style="display:none;"></li>');
                var e1_1_2_1_1 = jQuery('<span class="CallCenter_defaultIdleText" style="color:#468847;">' + CallCenter._defaultIdleText + '</span>');
                e1_1_2_1_1.bind("click", function (e) {
                    CallCenter.free();
                    jQuery("#CallCenter_status_buts").hide();
                    e.stopPropagation();
                    return false;
                })
                e1_1_2_1.append(e1_1_2_1_1);
                e1_1_2.append(e1_1_2_1);

                var e1_1_2_2 = jQuery('<li class="CallCenter_busy" id="CallCenter_busy" style="display:none;"></li>');
                var e1_1_2_2_1 = jQuery('<span class="CallCenter_defaultBusyText">' + CallCenter._defaultBusyText + '</span>');
                e1_1_2_2_1.bind("click", function (e) {
                    CallCenter.busy();
                    jQuery("#CallCenter_status_buts").hide();
                    e.stopPropagation();
                    return false;
                })
                e1_1_2_2.append(e1_1_2_2_1);
                e1_1_2.append(e1_1_2_2);
                e1_1.append(e1_1_2);
                e1.append(e1_1);
                jQuery(document).bind("click", function (e) {
                    if (jQuery(e.target).closest("#CallCenter_main").length == 0) {
                        jQuery("#CallCenter_status_buts").hide();
                        jQuery("#CallCenter_main .enternum").hide();
                    }
                });

                var e1_2 = jQuery('<div class="telbtns"></div>');
                var e1_2_1 = jQuery('<span id="CallCenter_calloutbut" class="outphone" style="display:none;"></span>');
                e1_2_1.bind("click", function () {
                    jQuery('#CallCenter_main .enternum').fadeIn();
                    jQuery('#CallCenter_main .enternum').find('#CallCenter_main .numtxt').focus();
                })
                var e1_2_1_1 = jQuery('<img src="' + CallCenter._thisPath + 'images/phone.png"/>');
                var e1_2_1_2 = jQuery('<div class="dialog">外呼<i class="pointer"></i></div>');
                var e1_2_1_3 = jQuery('<div class="enternum"></div>');
                var e1_2_1_3_1 = jQuery('<div class="arrow"></div>');
                var e1_2_1_3_2 = jQuery('<div class="popover_content"></div>');
                var e1_2_1_3_2_1 = jQuery('<input type="text" placeholder="输入号码点击回车键发起呼叫" class="numtxt"/>');
                e1_2_1_3_2_1.bind({
                    keypress: function (e) {
                        e = (e) ? e : ((window.event) ? window.event : "");
                        var key = e.keyCode ? e.keyCode : e.which;//兼容IE和Firefox获得keyBoardEvent对象的键值
                        if (key < 48 && key != 8 && key != 13 && key != 46) {
                            if (e && e.stopPropagation) {
                                e.stopPropagation();
                            } else {
                                window.event.cancelBubble = true;
                            }
                            return false;
                        }
                        if ((key > 57 && key < 64) || (key > 90 && key < 97) || (key > 122)) {
                            if (e && e.stopPropagation) {
                                e.stopPropagation();
                            } else {
                                window.event.cancelBubble = true;
                            }
                            return false;
                        }
                        if (key == 13) {
                            CallCenter.callout(this, e);
                        }
                    }
                });
                e1_2_1_3_2.append(e1_2_1_3_2_1);
                e1_2_1_3.append(e1_2_1_3_1);
                e1_2_1_3.append(e1_2_1_3_2);
                e1_2_1.append(e1_2_1_1);
                e1_2_1.append(e1_2_1_2);
                e1_2_1.append(e1_2_1_3);
                e1_2.append(e1_2_1);

                //挂机
                var e1_2_2 = jQuery('<span id="CallCenter_hangupbut" class="hang_up" style="display:none;"><img src="' + CallCenter._thisPath + 'images/hangup.png"/><div class="dialog">挂机<i class="pointer"></i></div></span>');
                e1_2_2.bind("click", function () {
                    CallCenter.cancelmakecall();
                });
                //保持
                var e1_2_3 = jQuery('<span id="CallCenter_mutebut" class="holding" style="display:none;"><img src="' + CallCenter._thisPath + 'images/bc.png"/><div class="dialog">保持<i class="pointer"></i></div></span>');
                e1_2_3.bind("click", function () {
                    CallCenter.mute();
                });
                //恢复
                var e1_2_4 = jQuery('<span id="CallCenter_unmutebut" class="recovery" style="display:none;"><img src="' + CallCenter._thisPath + 'images/hf.png"/><div class="dialog">恢复<i class="pointer"></i></div></span>');
                e1_2_4.bind("click", function () {
                    CallCenter.unmute();
                });
                //下班
                var e1_2_5 = jQuery('<span id="CallCenter_logoutbut" class="recovery" style="display:none;"><img src="' + CallCenter._thisPath + 'images/hf.png"/><div class="dialog">下班<i class="pointer"></i></div></span>');
                e1_2_5.bind("click", function () {
                    CallCenter.logout();
                });
                //转接
                var e1_2_6 = jQuery('<span id="CallCenter_transfercallbut" class="switch" style="display:none;"><img src="' + CallCenter._thisPath + 'images/zj.png"/><div class="dialog">转接<i class="pointer"></i></div></span>');
                e1_2_6.bind("click", function () {
                    CallCenter._getIdleAgentFromTC = 1;
                    CallCenter.idleagents();
                });
                //结束转接
                var e1_2_61 = jQuery('<span id="CallCenter_canceltransfercallbut" class="canceltransfercall" style="display:none;"><img src="' + CallCenter._thisPath + 'images/jszx.png"/><div class="dialog">结束转接<i class="pointer"></i></div></span>');
                e1_2_61.bind("click", function () {
                    CallCenter.canceltransfercall();
                });
                //咨询
                var e1_2_7 = jQuery('<span id="CallCenter_consultbut" class="consult" style="display:none;"><img src="' + CallCenter._thisPath + 'images/zx.png"/><div class="dialog">咨询<i class="pointer"></i></div></span>');
                e1_2_7.bind("click", function () {
                    CallCenter._getIdleAgentFromTC = 2;
                    CallCenter.idleagents();
                });
                //结束咨询
                var e1_2_8 = jQuery('<span id="CallCenter_consultbackbut" class="over_consult" style="display:none;"><img src="' + CallCenter._thisPath + 'images/jszx.png"/><div class="dialog">结束咨询<i class="pointer"></i></div></span>');
                e1_2_8.bind("click", function () {
                    CallCenter.agentconsultback();
                });
                //转IVR菜单
                var e1_2_9 = jQuery('<span id="CallCenter_ivrbut" class="ivr" style="display:none"><img src="' + CallCenter._thisPath + 'images/zcd.png"/><div class="dialog">IVR菜单<i class="pointer"></i></div></span>');
                e1_2_9.bind("click", function () {

                });
                //满意度
                var e1_2_10 = jQuery('<span id="CallCenter_serviceevaluatebut" class="degree" style="display:none"><img src="' + CallCenter._thisPath + 'images/zmyd.png"/><div class="dialog">转满意度调查<i class="pointer"></i></div></span>');
                e1_2_10.bind("click", function () {
                    CallCenter.serviceevaluate();
                });
                //三方通话
                var e1_2_11 = jQuery('<span id="CallCenter_tripartitetalkbut" class="sf" style="display:none;"><img src="' + CallCenter._thisPath + 'images/threeCall.png"/><div class="dialog">转三方通话<i class="pointer"></i></div></span>');
                e1_2_11.bind("click", function () {
                    CallCenter.tripartitetalk();
                });
                //咨询转接
                var e1_2_12 = jQuery('<span id="CallCenter_shiftbut" class="zxzj" style="display:none;"><img src="' + CallCenter._thisPath + 'images/zj.png"/><div class="dialog">咨询转接<i class="pointer"></i></div></span>');
                e1_2_12.bind("click", function () {
                    CallCenter.agentshift();
                });
                //摘机
                var e1_2_19 = jQuery('<span id="CallCenter_answer" class="zxzj" style="display:none;"><img src="' + CallCenter._thisPath + 'images/phone.png"/><div class="dialog">摘机<i class="pointer"></i></div></span>');
                e1_2_19.bind("click", function () {
                    SoftPhone.AcceptCall();
                });
                //拨号
                var e1_2_20 = jQuery('<span id="CallCenter_bohao" class="hang_up" style="display:none;"><img src="' + CallCenter._thisPath + 'images/bohao.png"/><div class="dialog">拨号<i class="pointer"></i></div></span>');
                e1_2_20.find("img").bind("click", function () {
                    if (jQuery('#CallCenter_jianpan').is(':hidden')) {
                        jQuery('#CallCenter_jianpan').show();
                    } else {
                        jQuery('#CallCenter_jianpan').hide();
                    }
                });
                e1_2_20.append(CallCenter.dialPlate());
                //刷新
                var e1_2_21 = jQuery('<span id="CallCenter_refresh" style="display:none;"><img src="' + CallCenter._thisPath + 'images/threeCall.png"/><div class="dialog">刷新<i class="pointer"></i></div></span>');
                e1_2_21.bind("click", function () {
                    CallCenter.availablegroup();
                });

                e1_2.append(e1_2_2);
                e1_2.append(e1_2_3);
                e1_2.append(e1_2_4);
                //e1_2.append(e1_2_5);
                e1_2.append(e1_2_6);
                e1_2.append(e1_2_61);
                e1_2.append(e1_2_7);
                e1_2.append(e1_2_8);
                e1_2.append(e1_2_9);
                e1_2.append(e1_2_10);
                e1_2.append(e1_2_11);
                e1_2.append(e1_2_12);
                e1_2.append(e1_2_19);
                e1_2.append(e1_2_20);
                e1_2.append(e1_2_21);

                e1_2.find('span').hover(function () {
                    var obj = jQuery(this);
                    obj.find('.dialog').filter(':not(:animated)').fadeIn('fast');
                    CallCenter._eventAlertTimeoutId = setTimeout(function () {
                        obj.find('.dialog').fadeOut('fast');
                    }, 1000);
                }, function () {
                    jQuery(this).find('.dialog').fadeOut('fast');
                });

                e1.append(e1_2);
                return e1;
            },
            /**
             * 生成全按钮的布局
             */
            drawAllIcon: function () {
                CallCenter._drawType = 2;
                CallCenter.createCss(CallCenter._thisPath + "CallCenterAllIcon.css");
                var e_1 = jQuery('<div id="CallCenter_main"></div>');
                var e_a = jQuery('<span class="CallCenter_button"></span>');
                var e_icon = jQuery('<div class="CallCenter_icon"></div>');
                var e_text = jQuery('<div class="CallCenter_text"></div>');

                var e_1_1_a = e_a.clone();
                var e_1_1_icon = e_icon.clone();
                var e_1_1_text = e_text.clone();
                e_1_1_icon.attr("id", "CallCenter_login_icon").append('<img src="'+CallCenter._thisPath+'/images//all/active/changtai-1.png"/>');
                e_1_1_text.attr("id", "CallCenter_login_text").html("登录");
                e_1_1_a.attr("id", "CallCenter_login").append(e_1_1_icon).append(e_1_1_text);
                e_1_1_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.init();
                })
                e_1.append(e_1_1_a);

                var e_1_2_a = e_a.clone();
                var e_1_2_icon = e_icon.clone();
                var e_1_2_text = e_text.clone();
                e_1_2_icon.attr("id", "CallCenter_free_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-2.png"/>');
                e_1_2_text.attr("id", "CallCenter_free_text").addClass("CallCenter_defaultIdleText").html(CallCenter._defaultIdleText);
                e_1_2_a.attr("id", "CallCenter_free").append(e_1_2_icon).append(e_1_2_text);
                e_1_2_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.free();
                })
                e_1.append(e_1_2_a);

                var e_1_3_a = e_a.clone();
                var e_1_3_icon = e_icon.clone();
                var e_1_3_text = e_text.clone();
                e_1_3_icon.attr("id", "CallCenter_busy_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-3.png"/>');
                e_1_3_text.attr("id", "CallCenter_busy_text").addClass("CallCenter_defaultBusyText").html(CallCenter._defaultBusyText);
                e_1_3_a.attr("id", "CallCenter_busy").addClass("CallCenter_busy").append(e_1_3_icon).append(e_1_3_text);
                e_1_3_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.busy();
                })
                e_1.append(e_1_3_a);

                var e_1_4_a = e_a.clone();
                var e_1_4_icon = e_icon.clone();
                var e_1_4_text = e_text.clone();
                e_1_4_icon.attr("id", "CallCenter_mutebut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-20.png"/>');
                e_1_4_text.attr("id", "CallCenter_mutebut_text").html("保持");
                e_1_4_a.attr("id", "CallCenter_mutebut").append(e_1_4_icon).append(e_1_4_text);
                e_1_4_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.mute();
                })
                e_1.append(e_1_4_a);

                var e_1_4i_a = e_a.clone();
                var e_1_4i_icon = e_icon.clone();
                var e_1_4i_text = e_text.clone();
                e_1_4i_icon.attr("id", "CallCenter_unmutebut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-4.png"/>');
                e_1_4i_text.attr("id", "CallCenter_unmutebut_text").html("取消保持");
                e_1_4i_a.attr("id", "CallCenter_unmutebut").append(e_1_4i_icon).append(e_1_4i_text);
                e_1_4i_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.unmute();
                })
                e_1.append(e_1_4i_a);

                var e_1_5_a = e_a.clone();
                var e_1_5_icon = e_icon.clone();
                var e_1_5_text = e_text.clone();
                e_1_5_icon.attr("id", "CallCenter_consultbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-5.png"/>');
                e_1_5_text.attr("id", "CallCenter_consultbut_text").html("咨询");
                e_1_5_a.attr("id", "CallCenter_consultbut").append(e_1_5_icon).append(e_1_5_text);
                e_1_5_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        CallCenter._getIdleAgentFromTC = 2;
                        CallCenter.idleagents();
                    }
                })
                e_1.append(e_1_5_a);

                var e_1_6_a = e_a.clone();
                var e_1_6_icon = e_icon.clone();
                var e_1_6_text = e_text.clone();
                e_1_6_icon.attr("id", "CallCenter_consultbackbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-6.png"/>');
                e_1_6_text.attr("id", "CallCenter_consultbackbut_text").html("咨询接回");
                e_1_6_a.attr("id", "CallCenter_consultbackbut").append(e_1_6_icon).append(e_1_6_text);
                e_1.append(e_1_6_a);

                var e_1_7_a = e_a.clone();
                var e_1_7_icon = e_icon.clone();
                var e_1_7_text = e_text.clone();
                e_1_7_icon.attr("id", "CallCenter_transfercallbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-7.png"/>');
                e_1_7_text.attr("id", "CallCenter_transfercallbut_text").html("转移");
                e_1_7_a.attr("id", "CallCenter_transfercallbut").append(e_1_7_icon).append(e_1_7_text);
                e_1_7_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        CallCenter._getIdleAgentFromTC = 1;
                        CallCenter.idleagents();
                    }
                })
                e_1.append(e_1_7_a);

                var e_1_8_a = e_a.clone();
                var e_1_8_icon = e_icon.clone();
                var e_1_8_text = e_text.clone();
                e_1_8_icon.attr("id", "CallCenter_tripartitetalkbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-8.png"/>');
                e_1_8_text.attr("id", "CallCenter_tripartitetalkbut_text").html("会议");
                e_1_8_a.attr("id", "CallCenter_tripartitetalkbut").append(e_1_8_icon).append(e_1_8_text);
                e_1_8_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.tripartitetalk();
                })
                e_1.append(e_1_8_a);

                var e_1_9_a = e_a.clone();
                var e_1_9_icon = e_icon.clone();
                var e_1_9_text = e_text.clone();
                e_1_9_icon.attr("id", "CallCenter_monitor_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-9.png"/>');
                e_1_9_text.attr("id", "CallCenter_monitor_text").html("监听");
                e_1_9_a.attr("id", "CallCenter_monitor").append(e_1_9_icon).append(e_1_9_text);
                e_1.append(e_1_9_a);

                var e_1_10_a = e_a.clone();
                var e_1_10_icon = e_icon.clone();
                var e_1_10_text = e_text.clone();
                e_1_10_icon.attr("id", "CallCenter_agentinsert_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-10.png"/>');
                e_1_10_text.attr("id", "CallCenter_agentinsert_text").html("强插");
                e_1_10_a.attr("id", "CallCenter_agentinsert").append(e_1_10_icon).append(e_1_10_text);
                e_1.append(e_1_10_a);

                var e_1_11_a = e_a.clone();
                var e_1_11_icon = e_icon.clone();
                var e_1_11_text = e_text.clone();
                e_1_11_icon.attr("id", "CallCenter_agentbreak_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-11.png"/>');
                e_1_11_text.attr("id", "CallCenter_agentbreak_text").html("强拆");
                e_1_11_a.attr("id", "CallCenter_agentbreak").append(e_1_11_icon).append(e_1_11_text);
                e_1.append(e_1_11_a);

                var e_1_12_a = e_a.clone();
                var e_1_12_icon = e_icon.clone();
                var e_1_12_text = e_text.clone();
                e_1_12_icon.attr("id", "CallCenter_calloutbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-12.png"/>');
                e_1_12_text.attr("id", "CallCenter_calloutbut_text").html("外呼");
                e_1_12_a.attr("id", "CallCenter_calloutbut").append(e_1_12_icon).append(e_1_12_text);
                e_1.append(e_1_12_a);

                var e_1_13_a = e_a.clone();
                var e_1_13_icon = e_icon.clone();
                var e_1_13_text = e_text.clone();
                e_1_13_icon.attr("id", "CallCenter_innercall_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-13.png"/>');
                e_1_13_text.attr("id", "CallCenter_innercall_text").html("内呼");
                e_1_13_a.attr("id", "CallCenter_innercall").append(e_1_13_icon).append(e_1_13_text);
                e_1.append(e_1_13_a);

                var e_1_14_a = e_a.clone();
                var e_1_14_icon = e_icon.clone();
                var e_1_14_text = e_text.clone();
                e_1_14_icon.attr("id", "CallCenter_ivrbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-14.png"/>');
                e_1_14_text.attr("id", "CallCenter_ivrbut_text").html("IVR菜单");
                e_1_14_a.attr("id", "CallCenter_ivrbut").append(e_1_14_icon).append(e_1_14_text);
                e_1.append(e_1_14_a);

                var e_1_15_a = e_a.clone();
                var e_1_15_icon = e_icon.clone();
                var e_1_15_text = e_text.clone();
                e_1_15_icon.attr("id", "CallCenter_hangupbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-15.png"/>');
                e_1_15_text.attr("id", "CallCenter_hangupbut_text").html("挂断");
                e_1_15_a.attr("id", "CallCenter_hangupbut").append(e_1_15_icon).append(e_1_15_text);
                e_1_15_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.cancelmakecall();
                })
                e_1.append(e_1_15_a);

                var e_1_15i_a = e_a.clone();
                var e_1_15i_icon = e_icon.clone();
                var e_1_15i_text = e_text.clone();
                e_1_15i_icon.attr("id", "CallCenter_answer_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-19.png"/>');
                e_1_15i_text.attr("id", "CallCenter_answer_text").html("接听");
                e_1_15i_a.attr("id", "CallCenter_answer").append(e_1_15i_icon).append(e_1_15i_text);
                e_1_15i_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        SoftPhone.AcceptCall();
                })
                e_1.append(e_1_15i_a);

                var e_1_16_a = e_a.clone();
                var e_1_16_icon = e_icon.clone();
                var e_1_16_text = e_text.clone();
                e_1_16_icon.attr("id", "CallCenter_bohao_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-16.png"/>');
                e_1_16_text.attr("id", "CallCenter_bohao_text").html("按键");
                e_1_16_a.attr("id", "CallCenter_bohao").append(e_1_16_icon).append(e_1_16_text);
                e_1_16_icon.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active") {
                        if (jQuery('#CallCenter_jianpan').is(':hidden')) {
                            jQuery('#CallCenter_jianpan').show();
                        } else {
                            jQuery('#CallCenter_jianpan').hide();
                        }
                    }
                })
                e_1_16_a.append(CallCenter.dialPlate());
                e_1.append(e_1_16_a);

                var e_1_17_a = e_a.clone();
                var e_1_17_icon = e_icon.clone();
                var e_1_17_text = e_text.clone();
                e_1_17_icon.attr("id", "CallCenter_reset_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-17.png"/>');
                e_1_17_text.attr("id", "CallCenter_reset_text").html("重置");
                e_1_17_a.attr("id", "CallCenter_reset").append(e_1_17_icon).append(e_1_17_text);
                e_1_17_a.bind("click", function () {
                    CallCenter.initControl();
                })
                e_1.append(e_1_17_a);

                var e_1_18_a = e_a.clone();
                var e_1_18_icon = e_icon.clone();
                var e_1_18_text = e_text.clone();
                e_1_18_icon.attr("id", "CallCenter_logoutbut_icon").append('<img src="'+CallCenter._thisPath+'/images//all/static/changtai-18.png"/>');
                e_1_18_text.attr("id", "CallCenter_logoutbut_text").html("退出");
                e_1_18_a.attr("id", "CallCenter_logoutbut").append(e_1_18_icon).append(e_1_18_text);
                e_1_18_a.bind("click", function () {
                    if (jQuery(this).find("img").data("status") == "active")
                        CallCenter.logout();
                })
                e_1.append(e_1_18_a);
                e_1.append('<div style="clear:both;"></div>');

                CallCenter.bindHover(e_1_1_a);
                CallCenter.bindHover(e_1_2_a);
                CallCenter.bindHover(e_1_3_a);
                CallCenter.bindHover(e_1_4_a);
                CallCenter.bindHover(e_1_4i_a);
                CallCenter.bindHover(e_1_5_a);
                CallCenter.bindHover(e_1_6_a);
                CallCenter.bindHover(e_1_7_a);
                CallCenter.bindHover(e_1_8_a);
                CallCenter.bindHover(e_1_9_a);
                CallCenter.bindHover(e_1_10_a);
                CallCenter.bindHover(e_1_11_a);
                CallCenter.bindHover(e_1_12_a);
                CallCenter.bindHover(e_1_13_a);
                CallCenter.bindHover(e_1_14_a);
                CallCenter.bindHover(e_1_15_a);
                CallCenter.bindHover(e_1_15i_a);
                CallCenter.bindHover(e_1_16_a);
                CallCenter.bindHover(e_1_17_a);
                CallCenter.bindHover(e_1_18_a);
                return e_1;
            },
            /**
             * 使控件恢复最后一次样式，重新加载最后一次消息
             */
            applyLastStyle: function () {
                if (CallCenter._lastmsg != null) {
                    CallCenter.onmessage(CallCenter._lastmsg);
                }
            },
            /**
             * 拨号盘
             * @returns {*|jQuery|HTMLElement}
             */
            dialPlate: function () {
                var plate = jQuery('<div id="CallCenter_jianpan" class="jianpan" style="display:none;"></div>');
                plate.append(
                    '<ul class="jianpan_ul">' +
                    '<li class="jianpan_icon jianpan_1"></li>' +
                    '<li class="jianpan_icon jianpan_2"></li>' +
                    '<li class="jianpan_icon jianpan_3"></li>' +
                    '<li class="jianpan_icon jianpan_4"></li>' +
                    '<li class="jianpan_icon jianpan_5"></li>' +
                    '<li class="jianpan_icon jianpan_6"></li>' +
                    '<li class="jianpan_icon jianpan_7"></li>' +
                    '<li class="jianpan_icon jianpan_8"></li>' +
                    '<li class="jianpan_icon jianpan_9"></li>' +
                    '<li class="jianpan_icon jianpan_x"></li>' +
                    '<li class="jianpan_icon jianpan_0"></li>' +
                    '<li class="jianpan_icon jianpan_h"></li>' +
                    '</ul>'
                );

                plate.find('.jianpan_1').bind("click", function () {
                    SoftPhone.SendDTMF('1');
                });
                plate.find('.jianpan_2').bind("click", function () {
                    SoftPhone.SendDTMF('2');
                });
                plate.find('.jianpan_3').bind("click", function () {
                    SoftPhone.SendDTMF('3');
                });
                plate.find('.jianpan_4').bind("click", function () {
                    SoftPhone.SendDTMF('4');
                });
                plate.find('.jianpan_5').bind("click", function () {
                    SoftPhone.SendDTMF('5');
                });
                plate.find('.jianpan_6').bind("click", function () {
                    SoftPhone.SendDTMF('6');
                });
                plate.find('.jianpan_7').bind("click", function () {
                    SoftPhone.SendDTMF('7');
                });
                plate.find('.jianpan_8').bind("click", function () {
                    SoftPhone.SendDTMF('8');
                });
                plate.find('.jianpan_9').bind("click", function () {
                    SoftPhone.SendDTMF('9');
                });
                plate.find('.jianpan_0').bind("click", function () {
                    SoftPhone.SendDTMF('0');
                });
                plate.find('.jianpan_x').bind("click", function () {
                    SoftPhone.SendDTMF('*');
                });
                plate.find('.jianpan_h').bind("click", function () {
                    SoftPhone.SendDTMF('#');
                });
                jQuery(document).bind("click", function (e) {
                    if (jQuery(e.target).closest("#CallCenter_main").length == 0) {
                        jQuery("#CallCenter_jianpan").hide();
                    }
                });
                return plate;
            },
            /**
             * 获取空闲坐席后，返回咨询和转接座席列表
             * @param json
             * @returns {*|jQuery|HTMLElement}
             */
            drawTCBox: function (json) {
                var tcbox = jQuery('<div id="CallCenter_TCBox" class="CallCenter_TCBox"></div>');
                for (var i = 0; i < json.data.length; i++) {
                    var group = json.data[i];
                    var groupDiv = jQuery('<div class="CallCenter_group"></div>');
                    groupDiv.html("[" + group.groupname + "]");
                    var groupid = group.groupid;
                    var groupUL = jQuery('<ul class="CallCenter_ul"></ul>');
                    for (var k = 0; k < group.agents.length; k++) {
                        var agentid = group.agents[k];
                        if (agentid != CallCenter.getOperatorid() + "@" + CallCenter.getAbbreviate()) {
                            var li = jQuery('<li></li>');
                            li.html('<div class="CallCenter_agent">' + agentid + '</div>')
                            var qd = jQuery('<div class="CallCenter_agentSelected">确定</div>');
                            qd.click({agentid: agentid, groupid: groupid}, function (e) {
                                if (CallCenter._getIdleAgentFromTC == 1) {
                                    CallCenter.transfercall(e.data.agentid, groupid);
                                } else if (CallCenter._getIdleAgentFromTC == 2) {
                                    CallCenter.agentconsult(e.data.agentid, groupid);
                                }
                                jQuery("#CallCenter_TCBox").remove();
                                CallCenter._getIdleAgentFromTC = 0;
                            })
                            li.append(qd);
                            li.append('<div style="clear:both;"></div>')
                            groupUL.append(li);
                        }
                    }
                    tcbox.append(groupDiv).append(groupUL);
                }
                return tcbox;
            },
            /**
             * 初始化基本参数，创建连接
             * @param wsurl
             * @param logintype
             * @param operator_id
             * @param password
             * @param abbreviate
             * @param company_id
             * @param logingroups
             * @param auto
             */
            init: function (obj) {
                CallCenter.log("CallCenter消息：初始化");
                if (obj) {//初始化传参数了
                    CallCenter.log(obj);
                    CallCenter._wsurl = obj.wsurl || CallCenter._wsurl;   //CCS的WebSocket连接地址
                    CallCenter._logintype = obj.logintype || CallCenter._logintype;//登录类型,0手机,1sip话机,2软话机
                    CallCenter._operatorid = obj.operator_id || CallCenter._operatorid;
                    CallCenter._password = obj.password || CallCenter._password;
                    CallCenter._abbreviate = obj.abbreviate || CallCenter._abbreviate;
                    CallCenter._companyid = obj.company_id || CallCenter._companyid;
                    CallCenter._logingroups = obj.logingroups || CallCenter._logingroups;
                    CallCenter._auto = obj.auto || CallCenter._auto;
                    CallCenter._media_ip = obj.media_ip || CallCenter._media_ip;
                    CallCenter._media_port = obj.media_port || CallCenter._media_port;
                    CallCenter._sip_id = obj.sip_id || CallCenter._sip_id;
                    CallCenter._sip_pwd = obj.sip_pwd || CallCenter._sip_pwd;
                    if (obj.url_3cs) {
                        CallCenter.set3CS_url(obj.url_3cs);
                    }
                }

                CallCenter._sendcmd = {
                    cmd: "",                                //命令
                    operatorid: CallCenter._operatorid,     //工号
                    password: CallCenter._password,         //密码
                    abbreviate: CallCenter._abbreviate,     //公司简称
                    worktype: CallCenter._logintype,        //登录类型,0手机,1sip话机,2软话机
                    companyid: CallCenter._companyid,       //公司编号
                    auto: CallCenter._auto,                 //登录方式，0普通1预测
                    logingroups: CallCenter._logingroups    //登录到的技能组。登录方式为预测式生效
                };

                if (CallCenter._islogin == false
                    && CallCenter._websocket == null
                    && CallCenter._wsurl != null
                    && CallCenter._wsurl != "") {
                    if ('WebSocket' in window) {//支持原生WebSocket
                        CallCenter._websocket = new WebSocket(CallCenter._wsurl);
                        CallCenter._websocket.onopen = CallCenter.onopen;
                        CallCenter._websocket.onmessage = CallCenter.onmessage;
                        CallCenter._websocket.onclose = CallCenter.onclose;
                        CallCenter._websocket.onerror = CallCenter.onerror;
                        CallCenter._useOcx = false;
                    } else {//不支持原生WebSocket
                        if (window.ActiveXObject || "ActiveXObject" in window) {
                            CallCenter._websocket = CallCenter.newWebSocket(CallCenter._wsurl);
                            CallCenter._websocket.onopen = CallCenter.onopen;
                            CallCenter._websocket.onmessage = CallCenter.onmessage;
                            CallCenter._websocket.onclose = CallCenter.onclose;
                            CallCenter._websocket.onexception = CallCenter.onerror;
                            CallCenter._useOcx = true;
                        } else {
                            alert('您的浏览器不支持WebSocket!');
                        }
                    }
                }

                if (CallCenter._timerId == 0) {//ping线程
                    CallCenter._timerId = window.setInterval(CallCenter.timer, 1000);
                    CallCenter.ping();
                }
                return this;
            },
            /**
             * 工号密码方式登录
             * @param operator 工号
             * @param pwd 密码
             * @param companyid 企业id
             * @param logintype 登录方式，0手机，1硬话机，2软话机
             * @param auto 是否智能外呼,0否1是
             * @param logingroups 智能外呼时，登录到的技能组id
             * @param url_3cs 3CS连接地址
             * @param server_type CCS类型
             */
            opLogin: function (operator, pwd, companyid, logintype, auto, logingroups, url_3cs, client_type, server_type) {
                if (url_3cs) {
                    CallCenter.set3CS_url(url_3cs);
                }
                CallCenter.log("operator:" + operator + ", pwd:" + pwd + ", companyid:" + companyid + ", logintype:" + logintype + ", auto:" + auto + ", logingroups:" + logingroups + ", url_3cs:" + url_3cs + ", client_type:" + client_type + ", server_type:" + server_type);
                if (server_type != 1 && server_type != 2) {
                    server_type = CallCenter._serverType_ccs;
                }
                CallCenter._serverType = server_type;
                if (CallCenter._url_3cs == null || CallCenter._url_3cs == "") {
                    CallCenter.log("没有设置服务器连接地址");
                    alert("请先设置服务器连接地址");
                } else {
                    var url = CallCenter._url_3cs + "/Api/get_login_info4operator";
                    if (CallCenter._url_3cs_ssl) {
                        url = "https://" + url;
                    } else {
                        url = "http://" + url;
                    }
                    url = url + "?operator=" + operator + "&pwd=" + pwd + "&companyid=" + companyid + "&server_type=" + server_type + "&callback=?"
                    CallCenter._getLoginInfo(url, logintype, auto, logingroups, client_type);
                }
            },
            /**
             * sip和密码方式登录
             * @param sip_id SIP 账号
             * @param sip_pwd SIP 密码
             * @param companyid 企业id
             * @param logintype 登录方式，0手机，1硬话机，2软话机
             * @param auto 是否智能外呼,0否1是
             * @param logingroups 智能外呼时，登录到的技能组id
             * @param url_3cs 3CS连接地址
             */
            sipLogin: function (sip_id, sip_pwd, companyid, logintype, auto, logingroups, url_3cs, client_type, server_type) {
                if (url_3cs) {
                    CallCenter.set3CS_url(url_3cs);
                }
                CallCenter.log("sip_id:" + sip_id + ", sip_pwd:" + sip_pwd + ", companyid:" + companyid + ", logintype:" + logintype + ", auto:" + auto + ", logingroups:" + logingroups + ", url_3cs:" + url_3cs + ", client_type:" + client_type + ", server_type:" + server_type);
                if (server_type != 1 && server_type != 2) {
                    server_type = CallCenter._serverType_ccs;
                }
                CallCenter._serverType = server_type;
                if (CallCenter._url_3cs == null || CallCenter._url_3cs == "") {
                    CallCenter.log("没有设置服务器连接地址");
                    alert("请先设置服务器连接地址");
                } else {
                    var url = CallCenter._url_3cs + "/Api/get_login_info4sip";
                    if (CallCenter._url_3cs_ssl) {
                        url = "https://" + url;
                    } else {
                        url = "http://" + url;
                    }
                    url = url + "?sip_id=" + sip_id + "&sip_pwd=" + sip_pwd + "&companyid=" + companyid + "&server_type=" + server_type + "&callback=?";
                    CallCenter._getLoginInfo(url, logintype, auto, logingroups, client_type);
                }
            },
            /**
             * 获取登录信息并且初始化
             * @param url
             * @param logintype
             * @param auto
             * @param logingroups
             * @private
             */
            _getLoginInfo: function (url, logintype, auto, logingroups, client_type) {
                jQuery.getJSON(url, function (json) {
                    if (json.code == "0000") {
                        if (json.info) {
                            if (client_type != CallCenter._clientType_sipphone && client_type != CallCenter._clientType_ocx) {//没有传值
                                CallCenter.log("CallCenter消息：没有设置话机类型");
                                if (typeof(json.info.use_sipphone) == "undefined") {//企业没有设置话机类型
                                    CallCenter.log("CallCenter消息：企业没有设置话机类型，默认使用SIPPHONE");
                                    client_type = CallCenter._clientType_sipphone;
                                } else {//企业设置使用类型
                                    if (json.info.use_sipphone == 1) {//使用sipphone
                                        client_type = CallCenter._clientType_sipphone;
                                        CallCenter.log("CallCenter消息：企业设置话机类型为使用SIPPHONE");
                                    } else {//不使用sipphone
                                        client_type = CallCenter._clientType_ocx;
                                        CallCenter.log("CallCenter消息：企业设置话机类型为不使用SIPPHONE");
                                    }
                                }
                            }
                            CallCenter._clientType = client_type;

                            if (CallCenter._clientType == CallCenter._clientType_sipphone) {
                                CallCenter.log("CallCenter消息：使用SIPPHONE");
                                window.SoftPhone = window.CC_SoftPhone;
                            } else {
                                CallCenter.log("CallCenter消息：使用OCX");
                                window.SoftPhone = window.EC_SoftPhone;
                            }

                            CallCenter._wsurl = json.info.ws_url;           //ccs地址
                            CallCenter._logintype = logintype;              //登录类型,0 手机,1 sip话机,2 软话机
                            CallCenter._operatorid = json.info.operatorid;  //工号
                            CallCenter._password = json.info.password;      //密码
                            CallCenter._abbreviate = json.info.abbreviate;  //公司简称
                            CallCenter._companyid = json.info.companyid;    //公司编号
                            CallCenter._logingroups = logingroups;          //登录到的技能组
                            CallCenter._auto = auto;                        //是否预测外呼
                            CallCenter._media_ip = json.info.media_ip;      //媒体地址
                            CallCenter._media_port = json.info.media_port;  //媒体端口
                            CallCenter._sip_id = json.info.sip_id;          //SIP账号
                            CallCenter._sip_pwd = json.info.sip_pwd;        //SIP密码

                            if (CallCenter.getLoginType() == 2) {//软话机方式登录
                                SoftPhone.init(CallCenter._media_ip, CallCenter._media_port, CallCenter._sip_id, CallCenter._sip_pwd);
                            } else {//手机或SIP话机方式登录
                                CallCenter.init();
                            }

                            CallCenter._busyTypeMap.put(0, CallCenter._defaultBusyText);
                            if (json.info.busyList) {
                                jQuery(".CallCenter_busy").not("#CallCenter_busy").each(function (e) {
                                    jQuery(this).remove();
                                });
                                CallCenter._busyTypeMap.clear();
                                CallCenter._busyTypeMap.put(0, CallCenter._defaultBusyText);
                                for (var i = 0; i < json.info.busyList.length; i++) {
                                    CallCenter.addBusyButton(json.info.busyList[i]['typeId'], json.info.busyList[i]['showText']);
                                }
                            }
                        } else {
                            if (typeof(CallCenter.opLogin_callback) == "function") {
                                CallCenter.opLogin_callback(json);
                            }
                            if (typeof(CallCenter.sipLogin_callback) == "function") {
                                CallCenter.sipLogin_callback(json);
                            }
                        }
                    } else {
                        if (typeof(CallCenter.opLogin_callback) == "function") {
                            CallCenter.opLogin_callback(json);
                        }
                        if (typeof(CallCenter.sipLogin_callback) == "function") {
                            CallCenter.sipLogin_callback(json);
                        }
                        alert("登录失败，错误代码：" + json.code);
                    }
                })
            },
            //上面为初始化调用------------------------------------------------------------------------------------------

            //下面为CCS通讯调用的功能性函数-----------------------------------------------------------------------------------
            /**
             * 登录
             */
            login: function () {
                CallCenter.log("CallCenter消息：发送登录");
                if (CallCenter._islogin == false) {
                    var sendobj = CallCenter._sendcmd;
                    sendobj.auto = CallCenter._auto;
                    sendobj.worktype = CallCenter._logintype;
                    sendobj.cmd = "logon";
                    CallCenter.send(sendobj);

                    CallCenter.setStatusAndPhoneText("登录验证");
                }
                if (typeof(CallCenter.login_callback) == "function") {
                    CallCenter.login_callback();
                }
                return this;
            },
            /**
             * 发送重新登录
             * @returns {CallCenter}
             */
            relogin: function () {
                CallCenter.log("CallCenter消息：重新连接方式登录");
                var sendobj = CallCenter._sendcmd;
                sendobj.companyid = CallCenter._companyid;
                sendobj.agentkey = CallCenter._operatorid + "@" + CallCenter._abbreviate;
                sendobj.cmd = "reconnection";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.relogin_callback) == "function") {
                    CallCenter.relogin_callback();
                }
                return this;
            },
            /**
             * 登出
             */
            logout: function (callback) {
                CallCenter.log("CallCenter消息：登出");
                CallCenter._wsurl = null;
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "logout";
                CallCenter.send(sendobj);
                if (CallCenter._websocket != null) {
                    CallCenter._websocket.close();
                    CallCenter._websocket = null;
                }
                CallCenter._url_3cs = null;
                if (CallCenter._websocket_3cs != null) {
                    CallCenter._websocket_3cs.close();
                    CallCenter._websocket_3cs = null;
                }
                if (CallCenter._logintype == 2) {//软话机方式登录
                    SoftPhone.Logout();
                    SoftPhone.UnInitialize();
                }
                if (CallCenter._websocket_ocx) {
                    try {
                        CallCenter._websocket_ocx.UnInitialize();
                    } catch (e) {
                    }
                }
                CallCenter._busyTypeMap.clear();
                if (typeof(callback) == "function") {
                    callback();
                }
                if (typeof(CallCenter.logout_callback) == "function") {
                    CallCenter.logout_callback();
                }
                return this;
            },
            /**
             * 静音
             */
            mute: function () {
                if (CallCenter._openOnlyMuteCustomer && CallCenter._logintype == 2) {//如果是软话机方式并且开启了只静音客户
                    SoftPhone.Mute();
                } else {
                    var sendobj = CallCenter._sendcmd;
                    sendobj.cmd = "mute";
                    CallCenter.send(sendobj);
                }


                if (typeof(CallCenter.mute_callback) == "function") {
                    CallCenter.mute_callback();
                }
                return this;
            },
            /**
             * 取消静音
             */
            unmute: function () {
                if (CallCenter._openOnlyMuteCustomer && CallCenter._logintype) {//如果是软话机方式并且开启了只静音客户
                    SoftPhone.UnMute();
                } else {
                    var sendobj = CallCenter._sendcmd;
                    sendobj.cmd = "unmute";
                    CallCenter.send(sendobj);
                }
                if (typeof(CallCenter.login_callback) == "function") {
                    CallCenter.unmute_callback();
                }
                return this;
            },
            /**
             * 转接
             */
            transfercall: function (number, groupid, userdata) {
                var sendobj = CallCenter._sendcmd;
                sendobj.num = number;
                sendobj.cmd = "transfercall";
                sendobj.userdata = userdata;
                sendobj.groupid = groupid;
                CallCenter.send(sendobj);

                if (typeof(CallCenter.transfercall_callback) == "function") {
                    CallCenter.transfercall_callback();
                }
                return this;
            },
            /**
             * 取消转接
             * @returns {CallCenter}
             */
            canceltransfercall: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "canceltransfercall";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.canceltransfercall_callback) == "function") {
                    CallCenter.canceltransfercall_callback();
                }
                return this;
            },
            /**
             * 咨询
             */
            agentconsult: function (number, userdata) {
                var sendobj = CallCenter._sendcmd;
                sendobj.num = number;
                sendobj.cmd = "agentconsult";
                sendobj.userdata = userdata;
                CallCenter.send(sendobj);

                if (typeof(CallCenter.agentconsult_callback) == "function") {
                    CallCenter.agentconsult_callback();
                }
                return this;
            },
            /**
             * 取消咨询
             */
            agentconsultback: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "agentconsultback";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.agentconsultback_callback) == "function") {
                    CallCenter.agentconsultback_callback();
                }
                return this;
            },
            /**
             * 咨询转接
             */
            agentshift: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "agentshift";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.agentshift_callback) == "function") {
                    CallCenter.agentshift_callback();
                }
                return this;
            },
            /**
             * 咨询服务
             */
            consulationservice: function (filename, groupid, userdata) {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "consulationservice";
                sendobj.filename = filename;
                sendobj.userdata = userdata;
                sendobj.groupid = groupid;
                CallCenter.send(sendobj);

                if (typeof(CallCenter.consulationservice_callback) == "function") {
                    CallCenter.consulationservice_callback();
                }
                return this;
            },
            /**
             * 三方
             */
            tripartitetalk: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "tripartitetalk";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.tripartitetalk_callback) == "function") {
                    CallCenter.tripartitetalk_callback();
                }
                return this;
            },
            /**
             * 示忙
             */
            busy: function (busydescr) {
                if (!busydescr) {
                    busydescr = 0;
                }
                CallCenter._busyType = busydescr;
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "agentbusy";
                sendobj.busydescr = busydescr;
                CallCenter.send(sendobj);

                if (typeof(CallCenter.busy_callback) == "function") {
                    CallCenter.busy_callback();
                }
                return this;
            },
            /**
             * 示闲
             */
            free: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "agentidle";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.free_callback) == "function") {
                    CallCenter.free_callback();
                }
                return this;
            },
            /**
             * 外呼
             */
            callout: function (obj, e, preview, transmission_number) {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "makecall";
                var phone = "";
                if ("string" == typeof(obj)) {
                    phone = obj;
                    sendobj.preview = preview;
                    CallCenter._preview = preview;
                    CallCenter.log("CallCenter消息：外呼原始号码[" + phone + "]");
                    phone = phone.replace(/[^0-9a-zA-Z@]/ig, "");
                    if (phone.length > 32) {
                        phone = phone.substr(0, 32);
                    }
                } else if (e.keyCode == 13) {
                    phone = obj.value;
                    CallCenter.log("CallCenter消息：外呼原始号码[" + phone + "]");
                    phone = phone.replace(/[^0-9a-zA-Z@]/ig, "");
                    if (phone.length > 32) {
                        phone = phone.substr(0, 32);
                    }

                }
                if (phone == "") {
                    CallCenter.eventAlert('外呼的号码不能为空');
                } else {
                    if (!!window.phoneBlacklist && window.phoneBlacklist.indexOf(phone) > -1) {
                        CallCenter.eventAlert('该号码是黑名单');
                    }
                    else {
                        if (typeof(transmission_number) != "undefined") {
                            sendobj.caller = transmission_number;
                        } else {
                            sendobj.caller = CallCenter._transmission_number;
                        }
                        if (phone.indexOf('@') != -1) {
                            CallCenter._isInnercall = true;
                        }
                        sendobj.called = phone;
                        sendobj.preview = preview;
                        CallCenter._preview = preview;
                        CallCenter.send(sendobj);
                    }
                }
                CallCenter._isCallout = true;
                CallCenter._callingtimer = 0;
                if (typeof(CallCenter.callout_callback) == "function") {
                    CallCenter.callout_callback();
                }
                return this;
            },
            /**
             * 取消外呼
             */
            cancelmakecall: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "cancelmakecall";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.cancelmakecall_callback) == "function") {
                    CallCenter.cancelmakecall_callback();
                }
                return this;
            },
            /**
             * 监控座席
             */
            monitoragent: function () {
                CallCenter.log("启动监控座席");
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "monitoragent";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.monitoragent_callback) == "function") {
                    CallCenter.monitoragent_callback();
                }
                return this;
            },
            /**
             * 查询空闲座席
             */
            idleagents: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "idleagents";
                CallCenter.send(sendobj);

                if (typeof(CallCenter.idleagents_callback) == "function") {
                    CallCenter.idleagents_callback();
                }
                return this;
            },
            /**
             * 转接服务
             */
            transferservice: function (filename) {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "transferservice";
                sendobj.filename = filename;
                CallCenter.send(sendobj);

                if (typeof(CallCenter.transferservice_callback) == "function") {
                    CallCenter.transferservice_callback();
                }
                return this;
            },
            /**
             * 强拆
             */
            agentbreak: function (agentid) {
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "agentbreak";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.agentbreak_callback) == "function") {
                    CallCenter.agentbreak_callback();
                }
                return this;
            },
            /**
             * 强插
             */
            agentinsert: function (agentid) {
                CallCenter._be_operator = agentid;
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "agentinsert";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.agentinsert_callback) == "function") {
                    CallCenter.agentinsert_callback();
                }
                return this;
            },
            /**
             * 强制示忙
             */
            forcebusy: function (agentid) {
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "forcebusy";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.forcebusy_callback) == "function") {
                    CallCenter.forcebusy_callback();
                }
                return this;
            },
            /**
             * 强制示闲
             */
            forceidle: function (agentid) {
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "forceidle";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.forceidle_callback) == "function") {
                    CallCenter.forceidle_callback();
                }
                return this;
            },
            /**
             * 强制签出
             */
            forcelogout: function (agentid) {
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "forcelogout";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.forcelogout_callback) == "function") {
                    CallCenter.forcelogout_callback();
                }
                return this;
            },
            /**
             * 监听
             */
            monitor: function (agentid) {
                CallCenter._be_operator = agentid;
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "monitor";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.monitor_callback) == "function") {
                    CallCenter.monitor_callback();
                }
                return this;
            },
            /**
             * 拦截
             */
            agentinterceptcall: function (agentid) {
                CallCenter._be_operator = agentid;
                var sendobj = CallCenter._sendcmd;
                sendobj.agentoperatorid = agentid;
                sendobj.cmd = "agentinterceptcall";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.agentinterceptcall_callback) == "function") {
                    CallCenter.agentinterceptcall_callback();
                }
                return this;
            },
            /**
             * 获取座席所在技能组
             */
            agentgroups: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "agentgroups";
                CallCenter.send(sendobj);
                if (typeof(CallCenter.agentgroups_callback) == "function") {
                    CallCenter.agentgroups_callback();
                }
                return this;
            },
            /**
             * 获取指定座席状态
             */
            getagentstate: function (agentid) {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "getagentstate";
                sendobj.agentid = agentid;

                CallCenter.send(sendobj);
                if (typeof(CallCenter.getagentstate_callback) == "function") {
                    CallCenter.getagentstate_callback();
                }
                return this;
            },
            /**
             * 获取可用技能组
             */
            availablegroup: function () {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "availablegroup";

                CallCenter.send(sendobj);
                if (typeof(CallCenter.availablegroup_callback) == "function") {
                    CallCenter.availablegroup_callback();
                }
                return this;
            },
            /**
             * PING-ACK
             * @returns {CallCenter}
             */
            pingack: function (sequence) {
                var sendobj = CallCenter._sendcmd;
                sendobj.cmd = "pingack";
                sendobj.sequence = sequence;

                CallCenter.send(sendobj);
                return this;
            },
            //以上为CCS通讯调用的功能性函数--------------------------------------------------------------------------------------------

            //以下为WebSocket功能----------------------------------------------------------------------------------------
            /**
             * 重连
             */
            reconnection: function () {
                if (CallCenter._wsurl != null && CallCenter._wsurl != "") {
                    CallCenter._websocket = null;
                    if (CallCenter._isAllowReConnection) {//重连
                        CallCenter.log("CallCenter消息：准备重连");
                        CallCenter.setStatusAndPhoneText("连接关闭，重连");
                        setTimeout(function () {
                            CallCenter._isReLogin = true;
                            CallCenter.init();
                        }, 1000);//断线重连
                    } else {
                        CallCenter.log("CallCenter消息：禁止重连");
                        CallCenter.setStatusAndPhoneText("连接关闭");
                    }
                } else {
                    CallCenter.setStatusAndPhoneText("连接关闭");
                }
                if (typeof(CallCenter.relogin_callback) == "function") {
                    CallCenter.relogin_callback();
                }
            },
            /**
             * 连接建立
             */
            onopen: function () {
                CallCenter.log("CallCenter消息：建立连接");
                if (CallCenter._isReLogin) {//如果是重新连接的登录
                    setTimeout(CallCenter.relogin, 1000);//建立成功后自动登录
                } else {
                    if (CallCenter.isAuto() && CallCenter.getavailablegroup()) {//是预测外呼并且启用了登录后获取技能组
                        CallCenter.setStatusAndPhoneText('正在获取可用技能组').availablegroup();
                    } else {
                        CallCenter.login();//建立成功后自动登录
                    }
                }
                if (typeof(CallCenter.onopen_callback) == "function") {
                    CallCenter.onopen_callback();
                }
                return this;
            },
            /**
             * 连接关闭
             */
            onclose: function () {
                CallCenter.log("CallCenter消息：连接关闭");
                CallCenter._islogin = false;
                CallCenter.initControl();
                CallCenter.reconnection();
                if (typeof(CallCenter.onclose_callback) == "function") {
                    CallCenter.onclose_callback();
                }
                return this;
            },
            /**
             * 连接错误
             */
            onerror: function () {
                CallCenter.log("CallCenter消息：连接错误");
                CallCenter._islogin = false;
                if (typeof(CallCenter.onerror_callback) == "function") {
                    CallCenter.onerror_callback();
                }
                return this;
            },
            /**
             * 发送消息到ws服务器
             */
            send: function (sendObj) {
                try {
                    if (CallCenter._websocket != null) {
                        var readyState = ("m_readyState" in CallCenter._websocket ? CallCenter._websocket.m_readyState : CallCenter._websocket.readyState);
                        if (readyState == 1) {
                            if (!sendObj) {
                                sendObj = CallCenter._sendcmd;
                            }
                            sendObj.sequence = new Date().getTime();
                            if (sendObj.cmd != "ping" && sendObj.cmd != "pingack") {
                                CallCenter.log("CallCenter发送消息:" + JSON.stringify(sendObj));
                            }
                            if (typeof(onmessage_event) == "function") {
                                onmessage_event(sendObj, "send");
                            }
                            CallCenter._websocket.send(JSON.stringify(sendObj));
                        } else {
                            switch (readyState) {
                                case 0:
                                    CallCenter.log("CallCenter:连接状态[连接尚未建立]");
                                    break;
                                case 1:
                                    CallCenter.log("CallCenter:连接状态[WebSocket的链接已经建立]");
                                    break;
                                case 2:
                                    CallCenter.log("CallCenter:连接状态[连接正在关闭]");
                                    break;
                                case 3:
                                    CallCenter.log("CallCenter:连接状态[连接已经关闭或不可用]");
                                    break;
                                default:
                                    CallCenter.log("CallCenter:连接状态[" + readyState + "]");
                            }
                        }
                    } else {
                        CallCenter.log("CallCenter:连接为null");
                    }
                } catch (ex) {
                    CallCenter.log("CallCenter:发送消息异常");
                    for (x in ex) {
                        CallCenter.log(x + ":" + ex[x]);
                    }
                    CallCenter.log(ex);
                }
            },
            /**
             * 收到的消息
             */
            onmessage: function (data) {
                var json = eval("(" + data.data + ")");
                if (typeof(onmessage_event) == "function") {
                    try {
                        onmessage_event(json, "recive");
                    } catch (e) {
                        console.log('触发onmessage_event异常');
                    }
                }
                var type = json.type;// 命令
                var status = parseInt(json.status);//状态 0成功 1失败
                var reason = "";
                if (typeof(json.reason) != "undefined" && json.reason != null && json.reason != "") {
                    reason = json.reason;//信息
                }
                if (type != "ping") {//不是ping消息打印消息内容
                    if (type != 'monitorqueue'
                        && type != 'monitoragent'
                        && type != 'queuenum'
                        && type != 'callinfo') {
                        CallCenter._status = type;
                        CallCenter._lastmsg = data;
                    }
                    CallCenter.log("CallCenter接收消息：" + type);
                    CallCenter.log(json);
                }
                switch (type) {
                    case "logon"://登录
                        switch (status) {
                            case 0:
                                CallCenter._islogin = true;
                                CallCenter._nowStatus = type;
                                CallCenter.initControl().setGreenClass().setStatusAndPhoneText("登录成功");
                                if (CallCenter._auto == 0) {//不是预测外呼
                                    jQuery("#CallCenter_status_tiao").unbind("click").bind("click", function () {
                                        /*空闲，忙碌，切换*/
                                        if (jQuery("#CallCenter_status_buts").css("display") == "none") {
                                            if (jQuery("#CallCenter_free").css("display") == "list-item" || jQuery("#CallCenter_busy").css("display") == "list-item") {
                                                CallCenter.showControl("#CallCenter_status_buts");
                                            }
                                        } else {
                                            CallCenter.hideControl("#CallCenter_status_buts");
                                        }
                                    })
                                    CallCenter.showControl("#CallCenter_status_buts,#CallCenter_free,.CallCenter_busy");
                                } else {
                                    CallCenter.setStatusAndPhoneText("等待话机接通");
                                }
                                break;
                            case 1:
                                CallCenter.setOrgClass().setStatusAndPhoneText("登录失败").eventAlert(reason);
                                CallCenter._islogin = false;
                                CallCenter._wsurl = null;
                                CallCenter._websocket.close();
                                CallCenter._websocket = null;
                                CallCenter._isAllowReConnection = false;
                                if (CallCenter._logintype == 2) {//软话机方式登录
                                    SoftPhone.Logout();
                                    SoftPhone.UnInitialize();
                                }
                                break;
                            case 2:
                                CallCenter.setOrgClass().setStatusAndPhoneText("另一设备登录");
                                CallCenter._islogin = false;
                                CallCenter._wsurl = null;
                                CallCenter._websocket.close();
                                CallCenter._websocket = null;
                                CallCenter._isAllowReConnection = false;
                                if (CallCenter._logintype == 2) {//软话机方式登录
                                    SoftPhone.Logout();
                                    SoftPhone.UnInitialize();
                                }
                                break;
                            case 3:
                                CallCenter.setOrgClass().setStatusAndPhoneText("被强制签出");
                                CallCenter._islogin = false;
                                CallCenter._wsurl = null;
                                CallCenter._websocket.close();
                                CallCenter._websocket = null;
                                CallCenter._isAllowReConnection = false;
                                if (CallCenter._logintype == 2) {//软话机方式登录
                                    SoftPhone.Logout();
                                    SoftPhone.UnInitialize();
                                }
                                break;
                            default :
                                CallCenter.setOrgClass().setStatusAndPhoneText("登录代码:" + status);
                        }
                        break;
                    case "reconnection":
                        switch (status) {
                            case 0:
                                CallCenter.setOrgClass().setStatusAndPhoneText("重连成功");
                                break;
                            default:
                                CallCenter.setOrgClass().setStatusAndPhoneText("重连失败");
                                CallCenter._islogin = false;
                                CallCenter._wsurl = null;
                                CallCenter._websocket.close();
                                CallCenter._websocket = null;
                                CallCenter._isAllowReConnection = false;
                                CallCenter._isReLogin = false;//初始化重新连接
                                if (CallCenter._logintype == 2) {//软话机方式登录
                                    SoftPhone.Logout();
                                    SoftPhone.UnInitialize();
                                }
                                break;
                        }
                        break;
                    case "kick"://踢出
                        CallCenter._islogin = false;
                        CallCenter._wsurl = null;
                        CallCenter._websocket.close();
                        CallCenter._websocket = null;
                        CallCenter._isAllowReConnection = false;
                        if (CallCenter._logintype == 2) {//软话机方式登录
                            SoftPhone.Logout();
                            SoftPhone.UnInitialize();
                        }
                        break;
                    case "offwork"://下班
                        CallCenter._nowStatus = type;
                        CallCenter._islogin = false;
                        CallCenter._wsurl = null;
                        CallCenter._websocket.close();
                        CallCenter._websocket = null;
                        CallCenter._isAllowReConnection = false;
                        if (CallCenter._logintype == 2) {//软话机方式登录
                            SoftPhone.Logout();
                            SoftPhone.UnInitialize();
                        }
                        break;
                    case "agentidle"://示闲
                        switch (status) {
                            case 0:
                                CallCenter.initControl().setGreenClass().setStatusAndPhoneText(CallCenter._defaultIdleText);
                                if (CallCenter._auto == 1) {//智能外呼
                                    CallCenter.showControl(".CallCenter_busy");
                                } else {
                                    CallCenter.showControl(".CallCenter_busy,#CallCenter_calloutbut");
                                }
                                CallCenter.hideControl('#CallCenter_status_buts');
                                CallCenter._nowStatus = type;
                                break;
                            default:
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "agentbusy"://示忙
                        switch (status) {
                            case 0:
                                var showText = CallCenter._busyTypeMap.get(CallCenter._busyType);
                                if (!showText) {
                                    showText = CallCenter._defaultBusyText;
                                }
                                CallCenter.initControl().showControl("#CallCenter_free").setStatusAndPhoneText(showText).setOrgClass().hideControl('#CallCenter_status_buts');
                                CallCenter._nowStatus = type;
                                break;
                            default:
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "locked":
                        CallCenter.initControl().setStatusAndPhoneText("来电锁定").setOrgClass();
                        CallCenter._callingtimer = 0;
                        break;
                    case "consultlocked":
                        CallCenter.initControl().setStatusAndPhoneText("咨询锁定").setOrgClass();
                        CallCenter._callingtimer = 0;
                        break;
                    case "transferlocked":
                        CallCenter.initControl().setStatusAndPhoneText("转接锁定").setOrgClass();
                        CallCenter._callingtimer = 0;
                        break;
                    case "innerlocked":
                        CallCenter.initControl().setStatusAndPhoneText("内呼锁定").setOrgClass();
                        CallCenter._callingtimer = 0;
                        break;
                    case "playtts"://播放tts
                        CallCenter.initControl().setStatusAndPhoneText("正在播放工号").setOrgClass();
                        break;
                    case "after"://话后
                        CallCenter.initControl().setStatusAndPhoneText("话后").setOrgClass()
                            .showControl("#CallCenter_free,.CallCenter_busy");
                        CallCenter._calling = false;
                        CallCenter._isCallout = false;
                        CallCenter._nowStatus = type;
                        CallCenter._callId = "";
                        CallCenter._caller = "";
                        CallCenter._called = "";
                        CallCenter._timestamp = "";
                        CallCenter._calling_from = "";
                        CallCenter._be_operator = "";
                        CallCenter._isMeeting = false;
                        CallCenter._isInnercall = false;
                        break;
                    case "inringing"://呼入振铃
                        CallCenter._callingtimer = 0;
                        if (CallCenter._auto == 1) {//预测外呼
                            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("话机振铃");
                        } else {
                            CallCenter._callId = json.callid;
                            CallCenter._caller = json.caller;
                            CallCenter._called = json.called;
                            CallCenter._timestamp = json.timestamp;
                            CallCenter._calling = true;
                            CallCenter._calling_from = "inringing";
                            CallCenter.initControl().setOrgClass().setStatusAndPhoneText("来电振铃")
                                .showControl("#CallCenter_hangupbut,#CallCenter_phonenum");
                            if (CallCenter._logintype == 2) {
                                CallCenter.showControl("#CallCenter_answer");
                            }
                        }
                        break;
                    case "innerringing"://内呼来电振铃
                        CallCenter._callId = json.callid;
                        CallCenter._caller = json.caller;
                        CallCenter._called = json.called;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("内呼来电振铃")
                            .showControl("#CallCenter_hangupbut,#CallCenter_phonenum");
                        if (CallCenter._logintype == 2) {
                            CallCenter.showControl("#CallCenter_answer");
                        }
                        break;
                    case "incall"://呼入座席接听
                        CallCenter._callingtimer = 0;
                        if (CallCenter._auto == 1) {//预测外呼
                            CallCenter.initControl().setGreenClass().setStatusAndPhoneText("话机接通");
                            jQuery("#CallCenter_status_tiao").unbind("click").bind("click", function () {
                                /*空闲，忙碌，切换*/
                                if (jQuery("#CallCenter_status_buts").css("display") == "none") {
                                    if (jQuery("#CallCenter_free").css("display") == "list-item" || jQuery("#CallCenter_busy").css("display") == "list-item") {
                                        CallCenter.showControl("#CallCenter_status_buts");
                                    }
                                } else {
                                    CallCenter.hideControl("#CallCenter_status_buts");
                                }
                            })
                            if (CallCenter._nowStatus == "agentbusy") {
                                CallCenter.initControl().showControl("#CallCenter_free").setStatusAndPhoneText(CallCenter._defaultBusyText).setOrgClass();
                            } else {
                                CallCenter.showControl("#CallCenter_status_buts,#CallCenter_free,.CallCenter_busy");
                            }
                        } else {
                            CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().showCallingControl();
                        }
                        break;
                    case "outringing"://外呼时座席端振铃
                        CallCenter._caller = json.caller || CallCenter._caller;
                        CallCenter._called = json.called || CallCenter._called;
                        CallCenter._isCallout = true;
                        CallCenter._timestamp = json.timestamp;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("座席振铃")
                            .showControl("#CallCenter_hangupbut");
                        break;
                    case "outcall"://外呼座席摘机
                        CallCenter._called = json.number || CallCenter._called;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("接通座席")
                            .showControl("#CallCenter_hangupbut");
                        break;
                    case "calledringing"://被叫振铃
                        CallCenter._callId = json.callid || CallCenter._callId;
                        CallCenter._called = json.called || CallCenter._called;
                        CallCenter._caller = json.caller || CallCenter._caller;
                        CallCenter._timestamp = json.timestamp;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setStatusAndPhoneText("被叫振铃").setOrgClass()
                            .showControl("#CallCenter_hangupbut,#CallCenter_phonenum");
                        break;
                    case "outboundcall"://预测外呼接通被叫
                        CallCenter._isCallout = true;
                        CallCenter._callId = json.callid;
                        CallCenter._called = json.number || CallCenter._called;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().eventAlert("被叫应答").showCallingControl();
                        break;
                    case "answer"://外呼接通被叫
                        CallCenter._callId = json.callid;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().eventAlert("被叫应答").showCallingControl();
                        if (CallCenter._isInnercall) {
                            CallCenter.hideControl("#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
                        }
                        break;
                    case "consultationcalls"://咨询通话中
                        CallCenter.initControl().setStatusAndPhoneText("咨询通话中").setGreenClass()
                            .showControl("#CallCenter_consultbackbut,#CallCenter_tripartitetalkbut,#CallCenter_shiftbut");
                        break;
                    case "transfering"://转接中
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接中").showControl("#CallCenter_canceltransfercallbut");
                        break;
                    case "consultinringing"://咨询来电振铃
                        CallCenter._callId = json.callid;
                        CallCenter._caller = json.caller;
                        CallCenter._called = json.called;
                        CallCenter._timestamp = json.timestamp;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("咨询来电振铃")
                            .showControl("#CallCenter_hangupbut");
                        if (CallCenter._logintype == 2) {
                            CallCenter.showControl("#CallCenter_answer");
                        }
                        break;
                    case "consultincall"://咨询来电通话中
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setGreenClass().setStatusAndPhoneText("咨询来电通话中")
                            .showControl("#CallCenter_hangupbut");
                        break;
                    case "transferinringing"://转接来电振铃
                        CallCenter._callId = json.callid;
                        CallCenter._caller = json.caller;
                        CallCenter._called = json.called;
                        CallCenter._timestamp = json.timestamp;
                        if (json.dir) {
                            CallCenter._isCallout = true;
                        } else {
                            CallCenter._isCallout = false;
                        }
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("转接来电振铃")
                            .showControl("#CallCenter_hangupbut");
                        if (CallCenter._logintype == 2) {
                            CallCenter.showControl("#CallCenter_answer");
                        }
                        break;
                    case "transferincall"://转接来电通话中
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setStatusAndPhoneText("转接来电通话中").setGreenClass().showCallingControl();
                        break;
                    case "innercall"://内呼来电通话中
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setStatusAndPhoneText("内呼来电通话中").setGreenClass().showCallingControl()
                            .hideControl("#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
                        break;
                    case "innercallout"://内呼失败
                        CallCenter.eventAlert(reason);
                        break;
                    case "sanfangcall"://三方通话中
                        CallCenter.initControl().setGreenClass().setStatusAndPhoneText("三方通话中")
                            .showControl("#CallCenter_hangupbut");
                        CallCenter._isMeeting = true;
                        break;
                    case "mute"://保持
                        switch (status) {
                            case 0://成功
                                CallCenter.initControl().setStatusAndPhoneText("保持").setGreenClass()
                                    .showControl("#CallCenter_unmutebut,#CallCenter_phonenum");
                                break;
                            default ://失败
                                CallCenter.showCallingControl().eventAlert(reason);
                        }
                        break;
                    case "unmute"://取消保持
                        switch (status) {
                            case 0://成功
                                CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().showCallingControl();
                                break;
                            default ://失败
                                CallCenter.initControl().setStatusAndPhoneText("保持").setGreenClass().eventAlert(reason)
                                    .showControl("#CallCenter_unmutebut,#CallCenter_phonenum");
                        }
                        break;
                    case "error"://错误
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("错误");
                        break;
                    case "makecall"://外呼呼叫中
                        switch (status) {
                            case 0:
                                CallCenter._callId = json.callid;
                                CallCenter.initControl().setStatusAndPhoneText("呼叫中").setOrgClass()
                                    .showControl("#CallCenter_phonenum");
                                CallCenter._isCallout = true;
                                CallCenter._calling = true;
                                CallCenter._calling_from = "makecall";
                                break;
                            default :
                                CallCenter.initControl().setStatusAndPhoneText("外呼失败")
                                    .showControl(".CallCenter_busy").eventAlert(reason);
                                if (!CallCenter.isAuto() && CallCenter.getNowStatus() == "agentidle") {
                                    CallCenter.showControl("#CallCenter_calloutbut");
                                }
                        }
                        break;
                    case "cancelmakecall"://取消外呼/挂机
                        switch (status) {
                            case 0:
                                CallCenter.initControl().setStatusAndPhoneText("取消外呼").setOrgClass().eventAlert("取消成功")
                                    .showControl("#CallCenter_free,.CallCenter_busy");
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "agentconsult"://咨询
                        switch (status) {
                            case 0:
                                CallCenter.initControl().setStatusAndPhoneText("咨询中").setGreenClass()
                                    .showControl("#CallCenter_consultbackbut,#CallCenter_phonenum");
                                break;
                            default:
                                if (CallCenter.isCalling()) {
                                    CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().eventAlert(reason).showCallingControl();
                                } else {
                                    CallCenter.eventAlert(reason);
                                }
                        }
                        break;
                    case "agentconsultback"://取消咨询
                        CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().showCallingControl();
                        break;
                    case "agentconsultevent"://被咨询挂机
                        switch (status) {
                            case 0://成功
                                CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().eventAlert("被咨询侧挂机").showCallingControl();
                                break;
                            default :

                        }
                        break;
                    case "agentshift"://咨询转接
                        switch (status) {
                            case 0:
                                CallCenter.initControl().setStatusAndPhoneText("通话结束").setGreenClass().eventAlert("咨询转接成功")
                                    .showControl("#CallCenter_free,.CallCenter_busy");
                                break;
                            default :
                                CallCenter.initControl().eventAlert(reason).setGreenClass().showCallingControl();
                        }
                        break;
                    case "transfercall"://转接
                        switch (status) {
                            case 0:
                                CallCenter.initControl().setStatusAndPhoneText("转接").setOrgClass()
                                    .showControl("#CallCenter_free,.CallCenter_busy");
                                break;
                            default :
                                if (CallCenter.isCalling()) {
                                    CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().eventAlert(reason).showCallingControl();
                                } else {
                                    CallCenter.eventAlert(reason);
                                }
                        }
                        break;
                    case "tripartitetalk"://三方
                        switch (status) {
                            case 0://成功
                                CallCenter.initControl().setStatusAndPhoneText("三方").setOrgClass()
                                    .showControl("#CallCenter_hangupbut");
                                break;
                            default ://失败
                                if (CallCenter.isCalling()) {
                                    CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass().eventAlert(reason).showCallingControl();
                                } else {
                                    CallCenter.eventAlert(reason);
                                }
                        }
                        break;
                    case "monitor"://监听
                        CallCenter._calling_from = "monitor";
                        CallCenter._calling = true;
                        switch (status) {
                            case 0:
                                if (json.monitor == 1) {
                                } else {
                                    //被监听
                                }
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }

                        break;
                    case "monitorringing"://监听来电振铃
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("来电振铃")
                            .showControl("#CallCenter_hangupbut");
                        if (CallCenter._logintype == 2) {
                            CallCenter.showControl("#CallCenter_answer");
                        }
                        break;
                    case "monitorincall"://监听通话中
                        CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass()
                            .showControl("#CallCenter_hangupbut");
                        break;
                    case "agentinterceptcall"://拦截操作
                        switch (status) {
                            case 0:
                                if (json.monitor == 1) {
                                } else {
                                    CallCenter.eventAlert("被拦截");
                                }
                                break;
                            default:
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "intercept"://拦截中
                        CallCenter._calling = true;
                        break;
                    case "interceptaltering"://拦截振铃
                        CallCenter._calling = true;
                        CallCenter._callingtimer = 0;
                        CallCenter.initControl().setOrgClass().setStatusAndPhoneText("拦截振铃")
                            .showControl("#CallCenter_hangupbut");
                        if (CallCenter._logintype == 2) {
                            CallCenter.showControl("#CallCenter_answer");
                        }
                        break;
                    case "interceptcall"://拦截通话中
                        CallCenter._calling = true;
                        CallCenter._callingtimer = 0;
                        CallCenter._calling_from = "interceptcall";
                        CallCenter.initControl().setGreenClass().setStatusAndPhoneText("拦截通话中")
                            .showControl("#CallCenter_hangupbut");
                        break;
                    case "agentinsert"://强插
                        CallCenter._isMeeting = true;
                        CallCenter._calling_from = "agentinsert";
                        CallCenter._calling = true;
                        switch (status) {
                            case 0:
                                if (json.monitor == 1) {
                                } else {
                                    CallCenter.eventAlert("被强插").showCallingControl();
                                }
                                break;
                            default:
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "agentinsertringing"://强插振铃
                        CallCenter.initControl().setStatusAndPhoneText("强插振铃");
                        if (CallCenter._logintype == 2) {
                            CallCenter.showControl("#CallCenter_answer,#CallCenter_hangupbut");
                        }
                        break;
                    case "agentinsertincall"://强插通话中
                        CallCenter.initControl().setStatusAndPhoneText("通话中").setGreenClass()
                            .showControl("#CallCenter_hangupbut");
                        break;
                    case "agentbreak"://强拆
                        switch (status) {
                            case 0:
                                if (json.monitor == 1) {
                                } else {
                                    CallCenter.eventAlert("被强拆");
                                }
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "forceidle"://强制示闲
                        switch (status) {
                            case 0:
                                if (json.monitor == 1) {
                                } else {
                                    if (CallCenter._auto == 1) {
                                        CallCenter.initControl().setStatusAndPhoneText(CallCenter._defaultIdleText).setGreenClass()
                                            .showControl(".CallCenter_busy").eventAlert("被强制示闲");
                                    } else {
                                        CallCenter.initControl().setStatusAndPhoneText(CallCenter._defaultIdleText).setGreenClass()
                                            .showControl(".CallCenter_busy,#CallCenter_calloutbut").eventAlert("被强制示闲");
                                    }
                                }
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "forcebusy"://强制示忙
                        switch (status) {
                            case 0:
                                if (json.monitor == 1) {
                                } else {
                                    CallCenter.initControl().setStatusAndPhoneText(CallCenter._defaultBusyText).setOrgClass()
                                        .showControl("#CallCenter_free").eventAlert("被强制示忙");
                                }
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "forcelogout"://强制签出
                        switch (status) {
                            case 0:
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "consulationservice"://咨询服务
                        switch (status) {
                            case 0:
                                CallCenter.setStatusAndPhoneText("咨询服务");
                                break;
                            default :
                                CallCenter.eventAlert(reason);
                        }
                        break;
                    case "queuenum"://队列等待
                        CallCenter.log("CallCenter：队列等待数：" + json.num);
                        break;
                    case "siperror"://话机异常
                        CallCenter.initControl().setStatusAndPhoneText("话机异常").setOrgClass()
                            .showControl(".CallCenter_busy,#CallCenter_free");
                        if (CallCenter._logintype == 2) {
                            SoftPhone.Login(CallCenter._media_ip, CallCenter._media_port, CallCenter._sip_id, CallCenter._sip_pwd);
                        }
                        break;
                    case "idleagents"://获取空闲座席
                        if (typeof(CallCenter.idleagents_event) != "function") {
                            jQuery("#CallCenter_TCBox").remove();
                            if (CallCenter._getIdleAgentFromTC == 1 || CallCenter._getIdleAgentFromTC == 2) {
                                var tcbox = CallCenter.drawTCBox(json);
                                jQuery("#CallCenter_main").append(tcbox);
                                jQuery(document).bind("click", function (e) {
                                    if (jQuery(e.target).closest("#CallCenter_main").length == 0) {
                                        jQuery("#CallCenter_TCBox").remove();
                                        CallCenter._getIdleAgentFromTC = 0;
                                    }
                                });
                            }
                        }
                        break;
                    case "ping":
                        json.delay = new Date().getTime() - json.sequence;
                        CallCenter.pingack(json.sequence);
                        break;
                    case "sendmsg"://收到的消息
                        break;
                    case "monitoragent"://监控座席
                        break;
                    case "monitorqueue"://监控队列
                        break;
                    case "agentbegingroup"://进入预测外呼技能组
                        break;
                    case "agentstopgroup"://退出预测外呼技能组
                        break;
                    case "getagentstate"://获取指定坐席状态
                        json.agentState; //坐席状态，字符串值，包含 logout:未登陆, idle：空闲,busy：忙碌, after:话后，四个状态
                        break;
                    case "callinfo"://推送座席呼叫信息
                        break;
                    case "availablegroup"://获取可用技能组
                        if (json.data && json.data.length > 0) {
                            jQuery(".CallCenter_login_group,#CallCenter_login_group_pannel").remove();
                            var gids = [];
                            for (var i = 0; i < json.data.length; i++) {
                                var item = json.data[i];
                                gids.push(item.id);
                            }
                            gids = gids.join(",");
                            CallCenter.getTaskName(gids, json.data);
                            CallCenter.initControl().setStatusAndPhoneText('请选择任务')
                                .showControl('#CallCenter_status_buts,.CallCenter_login_group');
                        } else {
                            CallCenter.setStatusAndPhoneText('无可用技能组').eventAlert('无可用技能组');
                        }
                        CallCenter.showControl('#CallCenter_refresh');
                        break;
                    default :
                        CallCenter.log("CallCenter：未知的命令，" + type);
                }
                var eventFun = window.CallCenter[type + "_event"];
                if (typeof(eventFun) == "function") {//是否有外部注册回調函数
                    eventFun(json);
                }
                var events = CallCenter._events[type];//是否有注册事件
                if (typeof(events != "undefined")) {
                    for (var key in events) {
                        var fun = events[key];
                        if (typeof(fun) == "function") {
                            fun(json);
                        }
                    }
                }
            },
            /**
             * 重连
             */
            reconnection_3cs: function () {
                if (CallCenter._url_3cs != null && CallCenter._url_3cs != "") {
                    CallCenter._websocket_3cs = null;
                    CallCenter.log("3CS_WS消息：准备重连", false);
                    setTimeout(function () {
                        CallCenter.set3CS_url();
                    }, 1000);//断线重连
                }
            },
            /**
             * 建立连接
             */
            onopen_3cs: function () {
                CallCenter.log("3CS_WS连接成功", false);
            },
            /**
             * 连接关闭
             */
            onclose_3cs: function () {
                CallCenter.log("3CS_WS连接关闭", false);
                CallCenter.reconnection_3cs();
            },
            /**
             * 连接错误
             */
            onerror_3cs: function () {
                CallCenter.log("3CS_WS连接错误", false);
            },
            /**
             * 发送消息到ws服务器
             */
            send_3cs: function (sendObj) {
                try {
                    if (CallCenter._websocket != null) {
                        var readyState = ("m_readyState" in CallCenter._websocket_3cs ? CallCenter._websocket_3cs.m_readyState : CallCenter._websocket_3cs.readyState);
                        if (readyState == 1) {
                            if (typeof(sendObj) == "string") {
                                CallCenter._websocket_3cs.send(sendObj);
                            } else {
                                CallCenter._websocket_3cs.send(JSON.stringify(sendObj));
                            }
                        } else {
                            switch (readyState) {
                                case 0:
                                    CallCenter.log("3CS:连接状态[连接尚未建立]", false);
                                    break;
                                case 1:
                                    CallCenter.log("3CS:连接状态[WebSocket的链接已经建立]", false);
                                    break;
                                case 2:
                                    CallCenter.log("3CS:连接状态[连接正在关闭]", false);
                                    break;
                                case 3:
                                    CallCenter.log("3CS:连接状态[连接已经关闭或不可用]", false);
                                    break;
                                default:
                                    CallCenter.log("3CS:连接状态[" + readyState + "]", false);
                            }
                        }
                    } else {
                        CallCenter.log("3CS:连接为null", false);
                    }
                } catch (ex) {
                    CallCenter.log("3CS:发送消息异常", false);
                    for (x in ex) {
                        CallCenter.log(x + ":" + ex[x]);
                    }
                    CallCenter.log(ex);
                }
            },
            /**
             * 收到的消息
             * @param data
             */
            onmessage_3cs: function (data) {
                CallCenter.log("收到消息");
            },
            //以上为WebSocket功能----------------------------------------------------------------------------------------

            //以下为SDK内部调用功能----------------------------------------------------------------------------------------
            getTaskName: function (groupids, data) {
                var url = CallCenter._url_3cs + "/Api/grouptasklist";
                if (CallCenter._url_3cs_ssl) {
                    url = "https://" + url;
                } else {
                    url = "http://" + url;
                }
                url = url + "?companyid=" + CallCenter._companyid + "&groupids=" + groupids + "&callback=?";
                jQuery.getJSON(url, function (json) {
                    if (json.code == "0000") {
                        if (json.data) {
                            var taskData = json.data;
                            for (var i = 0; i < data.length; i++) {
                                var item = data[i];
                                var taskName = item.name + "(技能组)";
                                for (var k = 0; k < taskData.length; k++) {
                                    if (item.id == taskData[k].groupid) {
                                        taskName = taskData[k].taskname;
                                        break;
                                    }
                                }
                                CallCenter.addLoginGroup(taskName, item.id, item.status);
                            }
                        } else {
                            alert("没有查到任何数据");
                        }
                    } else {
                        alert("获取任务名称失败，错误代码：" + json.code);
                    }
                });
            },
            /**
             * ping
             */
            ping: function () {
                if (CallCenter._websocket != null
                    && ("m_readyState" in CallCenter._websocket ? CallCenter._websocket.m_readyState : CallCenter._websocket.readyState) == 1) {
                    var sendobj = CallCenter._sendcmd;
                    sendobj.cmd = "ping";
                    CallCenter.send(sendobj);
                }
                window.setTimeout(CallCenter.ping, 2000);//2秒发送一次ping包
            },
            /**
             * 界面计时器
             */
            timer: function () {
                if (CallCenter.isCalling()) {
                    jQuery("#CallCenter_status_tiao .time").html(CallCenter.secondsToHours(++CallCenter._callingtimer));
                } else {
                    jQuery("#CallCenter_status_tiao .time").html(CallCenter.secondsToHours(++CallCenter._timerspan));
                }
            },
            /**
             * 秒转时间(HH:mm:ss)
             * @param sec
             * @returns {string}
             */
            secondsToHours: function (sec) {
                var hrs = Math.floor(sec / 3600);
                var min = Math.floor((sec % 3600) / 60);
                sec = sec % 60;
                sec = sec < 10 ? "0" + sec : sec;
                min = min < 10 ? "0" + min : min;
                hrs = hrs < 10 ? "0" + hrs : hrs;
                return hrs + ":" + min + ":" + sec;
            },
            /**
             * 初始化控件(隐藏所有控件)
             * @returns {CallCenter}
             */
            initControl: function () {
                CallCenter.hideControl("#CallCenter_canceltransfercallbut,#CallCenter_refresh,#CallCenter_status_buts,#CallCenter_login,#CallCenter_jianpan,#CallCenter_bohao,#CallCenter_answer,#CallCenter_calloutbut,#CallCenter_hangupbut,#CallCenter_mutebut,#CallCenter_unmutebut,#CallCenter_logoutbut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_consultbackbut,#CallCenter_ivrbut,#CallCenter_tripartitetalkbut,#CallCenter_shiftbut,.CallCenter_login_group,.CallCenter_busy,#CallCenter_free,#CallCenter_phonenum,#CallCenter_monitor,#CallCenter_agentinsert,#CallCenter_agentbreak,#CallCenter_innercall,#CallCenter_reset");
                jQuery("#CallCenter_status").html(CallCenter._defaultBusyText);
                jQuery("#CallCenter_status_tiao").removeClass("green").addClass("org");
                jQuery("#CallCenter_phonenum").html("");
                CallCenter._timerspan = 0;
                return this;
            },
            /**
             * 显示某些控件
             * @param ctrlId 控件id
             * @returns {CallCenter}
             */
            showControl: function (ctrlId) {
                if (CallCenter._drawType == 1) {
                    if (ctrlId.indexOf('CallCenter_busy') != -1 || ctrlId.indexOf('CallCenter_free') != -1) {
                        jQuery("#CallCenter_status_buts").show();
                    }
                    jQuery(ctrlId).show();
                } else {
                    if (CallCenter._islogin) {
                        ctrlId += ",#CallCenter_logoutbut";
                    }
                    var src = jQuery(ctrlId).each(function (i, e) {
                        if (typeof(e) != "undefined") {
                            var src = jQuery(e).find(".CallCenter_icon img").attr("src");
                            if (src) {
                                src = src.replace("static", "active");
                                src = src.replace("hover", "active");
                                jQuery(e).find(".CallCenter_icon img").attr("src", src).data("status", "active");
                            }
                        }
                    });

                }
                return this;
            },
            /**
             * 隐藏某些控件
             * @param ctrlId 控件Id
             * @returns {CallCenter}
             */
            hideControl: function (ctrlId) {
                if (CallCenter._drawType == 1) {
                    jQuery(ctrlId).hide();
                } else {
                    if (CallCenter._islogin) {
                        ctrlId += ",#CallCenter_login";
                    }
                    var src = jQuery(ctrlId).each(function (i, e) {
                        if (typeof(e) != "undefined") {
                            var src = jQuery(e).find(".CallCenter_icon img").attr("src");
                            if (src) {
                                src = src.replace("active", "static");
                                src = src.replace("hover", "static");
                                jQuery(e).find(".CallCenter_icon img").attr("src", src).data("status", "static");
                            }
                        }
                    });
                }
                if (CallCenter._islogin) {
                    CallCenter.showControl("#CallCenter_logoutbut");
                } else {
                    CallCenter.showControl("#CallCenter_login");
                }
                return this;
            },
            /**
             * 显示呼叫过程中的控件
             * @returns {CallCenter}
             */
            showCallingControl: function () {
                CallCenter.showControl("#CallCenter_hangupbut,#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut,#CallCenter_phonenum");
                if (CallCenter._isCallout && CallCenter._logintype == 2) {//软话机方式登录
                    CallCenter.showControl("#CallCenter_bohao");
                }
                if (CallCenter._isCallout && CallCenter._calloutHideTCButton) {//外呼，并且要求隐藏咨询转接
                    CallCenter.hideControl("#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
                }
                if (CallCenter._isMeeting) {//已开启会议模式，隐藏
                    CallCenter.hideControl("#CallCenter_mutebut,#CallCenter_transfercallbut,#CallCenter_consultbut,#CallCenter_ivrbut");
                }
                return this;
            },
            /**
             * 设置状态文字和号码
             * @param text
             * @param phonenum
             * @returns {CallCenter}
             */
            setStatusAndPhoneText: function (text) {
                CallCenter._statusText = text;
                jQuery("#CallCenter_status").html(text);
                var phonenum = "";
                if (CallCenter._isCallout) {
                    phonenum = CallCenter.getCalled();
                } else {
                    phonenum = CallCenter.getCaller();
                }
                jQuery("#CallCenter_phonenum").html(CallCenter.filterPhone(phonenum));
                return this;
            },
            /**
             * 事件提醒内容
             * @param text
             */
            eventAlert: function (text) {
                if (CallCenter._eventAlertTimeoutId != 0) {
                    clearTimeout(CallCenter._eventAlertTimeoutId);
                }
                jQuery("#CallCenter_status_tiao .dialog").html(text + '<i class="pointer"></i>').filter(':not(:animated)').fadeIn('fast');
                CallCenter._eventAlertTimeoutId = setTimeout(function () {
                    jQuery("#CallCenter_status_tiao .dialog").fadeOut('fast');
                }, 2000);
                return this;
            },
            /**
             * 设置状态条为绿色
             * @returns {CallCenter}
             */
            setGreenClass: function () {
                jQuery("#CallCenter_status_tiao").removeClass("org").addClass("green");
                return this;
            },
            /**
             * 设置状态条为橙色
             * @returns {CallCenter}
             */
            setOrgClass: function () {
                jQuery("#CallCenter_status_tiao").removeClass("green").addClass("org");
                return this;
            },
            /**
             * 返回当前日期+时间
             * @returns {string}
             */
            dateNow: function () {
                var date = new Date();
                var y = date.getFullYear();
                var m = date.getMonth() + 1;
                var d = date.getDate();
                var h = date.getHours();
                var mm = date.getMinutes();
                var s = date.getSeconds();
                var sss = date.getMilliseconds();
                if (m < 10) {
                    m = "0" + m
                }
                if (d < 10) {
                    d = "0" + d
                }
                if (h < 10) {
                    h = "0" + h
                }
                if (mm < 10) {
                    mm = "0" + mm
                }
                if (s < 10) {
                    s = "0" + s
                }
                return y + "-" + m + "-" + d + " " + h + ":" + mm + ":" + s + "." + sss;
            },
            /**
             * 生成uuid
             * @returns {*}
             */
            getUUID: function () {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            /**
             * 过滤号码
             * @param phone
             * @returns {*}
             */
            filterPhone: function (phone) {
                if (!CallCenter._hidePhone) {
                    return phone;
                }
                if (phone.length > 7) {
                    var s = (phone.indexOf("0") == 0) ? phone.substr(1) : phone;//如果首位为0，去掉0
                    var s2 = parseInt(s.substr(0, 2));//截取前两位
                    if (s2 > 10 && s2 < 20) {//如果在10和20区间，判断为手机号
                        return s.substr(0, 3) + "****" + s.substr(7)
                    } else {//判断为固话，如果号段在30以下，判断为3位号段，010-029，否则为4位号段
                        if (s2 < 30) {
                            if (phone.length > 8) {
                                return phone.substr(0, 3) + "****" + phone.substr(7);
                            } else {
                                return "****" + phone.substr(4);
                            }
                        } else {
                            if (phone.length > 10) {
                                return phone.substr(0, 4) + "****" + phone.substr(8);
                            } else {
                                return "****" + phone.substr(4);
                            }
                        }
                    }
                } else {
                    return phone;
                }
            },
            /**
             * 打印日志
             * @param c 日志内容
             * @param send3cs 是否发送到服务器
             * @returns {CallCenter}
             */
            log: function (c, send3cs) {
                if (typeof(send3cs) == "undefined") {
                    send3cs = true;
                }
                if (window.console && window.console.log) {
                    if (typeof(c) == "string") {
                        c = "[" + CallCenter.dateNow() + "] " + c;
                        window.console.log(c);
                    } else {
                        if (CallCenter._useOcx) {
                            c = "[" + CallCenter.dateNow() + "] " + JSON.stringify(c);
                            window.console.log(c);
                        } else {
                            if (CallCenter._debug) {
                                window.console.log(c);
                            } else {
                                c = "[" + CallCenter.dateNow() + "] " + JSON.stringify(c);
                                window.console.log(c);
                            }
                        }
                    }
                }
                if (CallCenter._websocket_3cs != null && CallCenter._sendlog && send3cs) {
                    if (typeof(c) == "string") {
                        CallCenter.send_3cs(c);
                    } else {
                        try {
                            CallCenter.send_3cs(JSON.stringify(c));
                        } catch (e) {
                            alert("发送异常:" + e);
                        }
                    }
                }
                return this;
            },
            /**
             * IE9以下创建WS连接
             * @param url
             * @returns {Element}
             */
            newWebSocket: function (url) {
                CallCenter._websocket_ocx = document.createElement("object");
                if (window.ActiveXObject || "ActiveXObject" in window) {
                    CallCenter._websocket_ocx.classid = "CLSID:4B99B6A3-777E-4DB9-87A9-A0AE3E13F6BC";
                    CallCenter._websocket_ocx.width = 1;
                    CallCenter._websocket_ocx.height = 1;
                    CallCenter._websocket_ocx.style.position = "fixed";
                    CallCenter._websocket_ocx.style.bottom = "0px";
                    CallCenter._websocket_ocx.style.left = "0px";
                    document.body.appendChild(CallCenter._websocket_ocx);
                    CallCenter._websocket_ocx.setwsurl(url);
                }
                return CallCenter._websocket_ocx;
            },
            /**
             * 全按钮布局绑定事件
             * @param el
             */
            bindHover: function (el) {
                el.bind("mouseover", function () {
                    var src = jQuery(this).find(".CallCenter_icon img").attr("src");
                    jQuery(this).find(".CallCenter_icon img").attr("src", src.replace("static", "hover"));
                });
                el.bind("mouseout", function () {
                    var src = jQuery(this).find(".CallCenter_icon img").attr("src");
                    jQuery(this).find(".CallCenter_icon img").attr("src", src.replace("hover", "static"));
                });
            },
            /**
             * 获取当前文件路径
             * @returns {null}
             */
            getPath: function () {
                if (!CallCenter._thisPath) {
                    var js = document.scripts;
                    for (var i = 0; i < js.length; i++) {
                        var script = js[i];
                        var jsPath = script.src;
                        if (jsPath.indexOf("CallCenter.js") != -1) {
                            CallCenter._thisPath = jsPath.substring(0, jsPath.lastIndexOf("/") + 1);
                        }
                    }
                }
                return CallCenter._thisPath;
            },
            /**
             * 创建CSS元素
             * @param filePath
             */
            createCss: function (filePath) {
                var styleTag = document.createElement("link");
                styleTag.setAttribute('type', 'text/css');
                styleTag.setAttribute('rel', 'stylesheet');
                styleTag.setAttribute('href', filePath);
                styleTag.setAttribute('id', 'CallCenterCSS');
                jQuery("head")[0].appendChild(styleTag);
            },
            /**
             * 创建script元素
             * @param filePath
             * @returns {CallCenter}
             */
            createScript: function (filePath) {
                var tag = document.createElement("script");
                tag.setAttribute('type', 'text/javascript');
                tag.setAttribute('src', filePath);
                jQuery("head")[0].appendChild(tag);
                return this;
            },
            /**
             * 内部使用Map
             * @constructor
             */
            HashMap: function () {
                var length = 0;
                var obj = new Object();
                this.isEmpty = function () {
                    return length == 0;
                };
                this.containsKey = function (key) {
                    return (key in obj);
                };
                this.containsValue = function (value) {
                    for (var key in obj) {
                        if (obj[key] == value) {
                            return true;
                        }
                    }
                    return false;
                };
                this.put = function (key, value) {
                    if (!this.containsKey(key)) {
                        length++;
                    }
                    obj[key] = value;
                };
                this.get = function (key) {
                    return this.containsKey(key) ? obj[key] : null;
                };
                this.remove = function (key) {
                    if (this.containsKey(key) && (delete obj[key])) {
                        length--;
                    }
                };
                this.values = function () {
                    var _values = new Array();
                    for (var key in obj) {
                        _values.push(obj[key]);
                    }
                    return _values;
                };
                this.keySet = function () {
                    var _keys = new Array();
                    for (var key in obj) {
                        _keys.push(key);
                    }
                    return _keys;
                };
                this.size = function () {
                    return length;
                };
                this.clear = function () {
                    length = 0;
                    obj = new Object();
                };
            },
            /**
             * 绑定快捷键
             * @param evt
             */
            hotkey: function (evt) {
                //兼容IE和Firefox获得keyBoardEvent对象
                evt = (evt) ? evt : ((window.event) ? window.event : "");
                var key = evt.keyCode ? evt.keyCode : evt.which;//兼容IE和Firefox获得keyBoardEvent对象的键值
                if ((key == 79) && evt.ctrlKey && evt.altKey) {
                    if (CallCenter._sendlog) {
                        CallCenter.closeClientLog();
                    } else {
                        CallCenter.openClientLog();
                    }
                    if (CallCenter._sendlog) {
                        alert("发送日志到服务端状态：启用");
                    } else {
                        alert("发送日志到服务端状态：禁用");
                    }
                }
            },
            /**
             * 初始化跨域消息
             */
            initMsg: function () {
                var messenger = new Messenger(null, 'CallCenterMsg', 'CallCenter');
                messenger.listen(function (msg) {
                    eval(msg);
                });
            },
            /**
             * 加载后自动调用
             */
            loading: function () {
                CallCenter.getPath();
                CallCenter.createCss(CallCenter._thisPath + "CallCenterCommon.css");
                CallCenter.createScript(CallCenter._thisPath + "json2.js");
                CallCenter.createScript(CallCenter._thisPath + "SoftPhone.js");
                CallCenter.createScript(CallCenter._thisPath + "SoftPhone1.js");
                CallCenter.createScript(CallCenter._thisPath + "messenger.js");
                CallCenter._busyTypeMap = new CallCenter.HashMap();
                document.onkeydown = CallCenter.hotkey; //当onkeydown 事件发生时调用hotkey函数
                window.SoftPhone = new Object();
            }
            //以上为SDK内部调用功能----------------------------------------------------------------------------------------
        }
    CallCenter.loading();
})();
