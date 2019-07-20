declare let Vue, SSPA, Aurora,require, Vuex,Promise
import {callAjax} from '../../../scripts/_util'
import * as dataJs from '../../../scripts/_data'
import {dateFormat} from '../../../scripts/_util'
const heartbeatUrl = '/api/v1/me/heart'
const callUrl = '/api/v1/me/calls/'


let socketUrl = 'ws://10.101.3.126:8090/websocket/softphone/'
if (location.protocol === 'https:') {
    socketUrl = 'wss://10.101.4.162:11443/websocket/softphone/'
}
// let ENV = '@{FEPACK.ENV}';
// if('ONLINE' !== ENV) {
//     socketUrl = 'ws://172.28.3.140:8089/websocket/softphone/'
//     if (location.protocol === 'https:') {
//         socketUrl = 'wss://172.28.3.140:11443/websocket/softphone/'
//     }
// }

export default {
    data: () => ({
        userName: localStorage.getItem('userName'),
        isShowCheckin: false,//是否显示签入窗口
        callTimer: null, //计时器
        timeStr: '00:00:00',//通话时间
        callNo: '', //拨打号码
        isHold: false,//静音
        loginCode: localStorage.getItem('genesysLoginCode') || localStorage.getItem('jobNo'), //工号
        place: localStorage.getItem('genesysPlace'), //坐席
        sessionId: '',
        //心跳model
        heartModel: {
            socket: null,
            heartbeatTimer: null,
            timeout: 1000*30,//30秒
            lastDate: '',//上一次心跳时间
        },
        connId: '', //
        callOutType: '',//1进电，2外呼
        loginDisabled: false,
        isHangupDisabled: false,
        callTime:'',//呼叫时间
        currentStatus: 'loggedOut',
        phonePrefix: localStorage.getItem('phonePrefix') || '99',//电话前缀
        callMode: 1,//1:点号码拨打，0：手动输入号码拨打
        inboundPhone: '',//进线号码
        callEventDisabled: false,
        hangupDes: '客户挂机',//挂机方
        timingText: 0,
        logInTip: '',
        isShowConfirm: false,//登录错误提示
        isShowConfirm2: false,//登录错误提示
        hotLineDic: {}
    }),
    computed: {
        //通话状态文本
        onCallStatusTxt() {
            if(this.currentStatus == 'ringing') {
                return '响铃'
            }else if(this.currentStatus == 'answer') {
                return '通话中'
            }else if (this.currentStatus == 'hangup') {
                return '通话结束';
            }else if (this.currentStatus == 'dialing') {
                return '拨打中..';
            }
            else {
                return '等待连接'
            }
        },
        isBlue() {
            //置灰通话 数组里加状态 表示置灰
            return !(['loggedOut','loggedIn','notReady','hangup','ready'].indexOf(this.currentStatus) > -1);
        },
        /**
         * dialing:打电话中,ringing:振铃中 ,answer:应答 ,consult: 咨询第三方,
         * consultAnswering: ,meetingAnwsering:会议应答中 ,meetingAnswer:会议应答 ,transferAnswer: ,
         * loggedIn:签入,LoggedOut:签出,hold:静音 ,retrieve:恢复通话 ,Ready:就绪 ,notReady:未就绪 ,hangup:挂断 ,
         */
        //通话中，应答中
        isDial() {
            return ['hold','retrieve','dialing','ringing','answer','consult','consultAnswering','meetingAnwsering','meetingAnswer','transferAnswer'].indexOf(this.currentStatus) > -1;
        },
        //签入按钮
        onlineDisabled() {
            //状态!=登出 就不能用
            return this.isDial || this.currentStatus != 'loggedOut';
        },
        //签出按钮
        offlineDisabled() {
            return this.isDial || !this.onlineDisabled;
        },
        //示闲按钮
        readyDisabled() {
            //数据里有值表示示闲按钮不能用
            return this.isDial || ['loggedOut','ready'].indexOf(this.currentStatus) > -1;
        },
        //示忙
        notReadyDisabled() {
            //数据里有值表示示闲按钮不能用
            return this.isDial || ['loggedIn','loggedOut','notReady','hangup'].indexOf(this.currentStatus) > -1;
        },
        //应答
        answerDisabled() {
            return this.currentStatus != 'ringing';
        },
        //挂断
        hangupDisabled() {
            return !this.isDial;
        },
        //拨打
        callDisabled() {
            //数组里加状态表示可以拨打的情况
            return this.isDial || !(['hangup','ready'].indexOf(this.currentStatus) > -1);
        },
        //静音
        muteDisabled() {
            return !(['answer','hold','retrieve'].indexOf(this.currentStatus) > -1);
        },
        //满意度评价
        evaluateDisabled() {
            return this.onCallStatusTxt != '通话中';
        },
        ...Vuex.mapGetters([
            'genesysCallData',//外呼数据
            'incomingPhone',
            'incomingIdCardNo',
            'customerName',
            'vxContactModel',
            'phoneBlacklist',//外呼黑名单
            'ncolInfo',//催收弹屏数据
        ]),
    },
    watch: {
        //1：签入，2：签出，3：主动示闲，4：主动示忙，5自动示闲，6：自动示忙，7：进线，8：进线结束
        currentStatus(newState) {
            if (newState == 'ready') {
                this.resetTimer();
            }
            else if(newState == 'loggedIn') {
                this.setGenesysCallData('')
            }
            else if(newState == 'loggedOut') {
                this.resetTimer();
                this.setGenesysCallData('')
                if (this.heartModel.heartbeatTimer) {
                    clearInterval(this.heartModel.heartbeatTimer);
                }
            }
            else if(newState == 'answer') {
                document.getElementById('audioDing')['play']()
                this.callTimerFunc();
            }
            else if(newState == 'hangup') {
                this.stopTimer();
                this.setGenesysCallData('')
            }
            else if(newState == 'hold') {
                this.isHold = true;
            }
            else if (newState == 'ringing') {
                this.callTime = dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss')
                this.callOutType = 1;//1进电
            }
            //拨打
            else if (newState == 'dialing') {
                this.callTime = dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss')
                this.callOutType = 2;//2 外呼
                this.callTimerFunc();
            }
            if(newState == 'retrieve' || newState == 'notReady' || newState == 'loggedOut') {
                this.isHold = false;
            }
        },
        genesysCallData:function (val) {
            if (val){
                this.callNo = val;
                if ( this.onlineDisabled) {
                    this.dialCall(1);
                } else {
                    this.setGenesysCallData('')
                    //没有登录
                    this.login();
                }
            }
        },
        /**
         * 催收弹屏
         */
        ncolInfo:  {
            handler(item, oldItem) {
                if (item.clientIdno) {
                    location.href = `#incol-collectionDetail?clientIdno=${item.clientIdno}&refId=${item.refId}&routeId=${item.routeId}&callSource=genesys`
                }
            },
            immediate: true
        }
    },
    methods: {
        //清除心跳，关闭socket
        clearHeart(){
            clearInterval(this.heartModel.heartbeatTimer);
            this.heartModel.socket && this.heartModel.socket.close();
            this.heartModel.socket = null;
        },
        sendHertCheck(type){
            if(this.heartModel.socket){
                try {
                    this.heartModel.socket.send("heartCheck");
                    this.printLog(type+'socket心跳发送完成，上一次：'+ (this.heartModel.lastDate?dateFormat(new Date(this.heartModel.lastDate),'yyyy-MM-dd hh:mm:ss'):''));
                    this.heartModel.lastDate = new Date().getTime();//本次心跳时间
                } catch(ex) {
                    this.printLog(type+'socket心跳发送异常');
                }
            } else {
                this.printLog(type+'socket为空');
                this.socketInit();
                return;
            }
            if (heartbeatUrl && this.place && this.loginCode) {
                callAjax(heartbeatUrl + '/' + this.place + '/' + this.loginCode,{}).then( _ => {
                    this.printLog(type+'http进行心跳检测');
                });
            }
            if (this.heartModel.lastDate){
                //心跳检测超过两分钟
                let t = new Date().getTime()-this.heartModel.lastDate;
                if (t > (2*60*1000)){
                    this.sendHertCheck('timeOut-');
                    this.printLog(type+'心跳检测超过两分钟'+t);
                }
            }

            console.log("心跳监测定时器" + dateFormat(new Date(this.heartModel.lastDate),'yyyy-MM-dd hh:mm:ss'));
        },
        heartStart(){
            this.printLog('初始化心跳检测');
            if (this.heartModel.heartbeatTimer) {
                clearInterval(this.heartModel.heartbeatTimer);
            }
            this.heartModel.heartbeatTimer = setInterval(_=> {
                if (this.currentStatus !== 'loggedOut') {
                    this.sendHertCheck('interval-');
                }
            }, this.heartModel.timeout)
        },
        callLoadinInit: function() {
            console.log('genesys init ......');
            if (this.place && this.loginCode) {
                //根据分机号判断是否登录
                callAjax('/api/v1/stats/agents/'+this.loginCode+'/CurrentAgentState',{},{type:'get'},true).then(_ => {
                    var agent = (_.agent || {}).statisticList;
                    var isFlag = false;
                    if (agent && agent.length) {
                        for (let i = 0;i<agent.length;i++){
                            if (agent[i].statistic == 'CurrentAgentState') {
                                if (agent[i].stateValue == 23 || agent[i].stateValue === 0) {
                                    isFlag = true;
                                }
                                break
                            }
                        }

                    } else {
                        isFlag = true;
                    }
                    if (isFlag) {
                        this.printLog('坐席自动签入');
                        this.login(true);//自动登录
                    }
                })
            }
        },
        /**
         * 根据分机号获取登录状态,显示签入失败原因
         */
         getLoginInfo(place) {
             return new Promise(function (resolve, reject) {
                 callAjax('/api/v1/stats/place/agent/' + place,{},{type:'get'},true).then(_ => {
                    resolve(_)
                 },_=>{
                    resolve(_)
                 })
             })
        },
        /**
         * 外呼系统登录
         * @param isAuto 是否是自动签入
         */
        login(isAuto=false) {
            if(!('WebSocket' in window)){
                alert("您的浏览器版本太低，请升级浏览器版本！");
                this.loginDisabled = false;
                return;
            }
            if (!this.place) {
                this.isShowCheckin = true;
                Aurora.danger('请输入分机号');
                return;
            }
            if (!this.loginCode) {
                this.isShowCheckin = true;
                Aurora.danger('请输入工号');
                return;
            }

            //不是自动登录，判断签入工号与登录系统工号是否一致
            if (!isAuto && this.loginCode != localStorage.getItem('jobNo')) {
                this.isShowConfirm2 = true;
                return
            }
            //先判断分机号有没有登录
            this.isPlaceLogin(isAuto)
        },
        //判断分机号有没有登录
        isPlaceLogin(isAuto) {
            this.isShowConfirm2 = false;
            this.getLoginInfo(this.place).then(_=>{
                if (_.place &&  _.place.loginVoice) {
                    if (!isAuto) {
                        //分机号被占用
                        this.logInTip = '当前分机号正被人使用，使用工号' + _.place.agentId + '。确认是否继续登录？';
                        this.isShowConfirm = true;
                    }
                    return;
                }
                this.callInit(isAuto);

            })
        },
        /**
         * 外呼系统初始化
         * @param isAuto 是否是自动签入
         */
        callInit(isAuto) {
            this.printLog('坐席签入-crm');
            this.loginDisabled = true;
            //外呼系统初始化
            callAjax('/api/v1/me',
                JSON.stringify({
                    operationName: 'StartContactCenterSession',
                    place: this.place,
                    loginCode: this.loginCode,
                    queue: '',
                    channels: ['voice']
                })
            ).then( _ => {
                this.loginDisabled = false;
                if (!_.sessionId) {
                    Aurora.danger('签入失败,sessionId为空');
                    return;
                }
                this.isShowCheckin = false;
                this.isShowConfirm = false;
                this.sessionId =  _.sessionId;
                this.currentStatus = 'loggedIn';
                this.socketInit();
                this.onLine(isAuto);
            },_=>{
                this.loginDisabled = false;
            })
            //保存登录信息到本地
            localStorage.setItem('phonePrefix',this.phonePrefix)
            localStorage.setItem('genesysLoginCode',this.loginCode)
            localStorage.setItem('genesysPlace',this.place)
            //获取400热线配置数据
            dataJs.getCallConfigList({pageNum: 1,pageSize: 100}).then( _ => {
                if (!_.result || !_.result.list) {
                    return
                }
                this.hotLineDic = _.result.list.reduce((o,it)=>({...o,[it.telephoneNum.substr(-7,7)]:`${it.hotlineNum||''}${(it.channelName&&'('+it.channelName+')')||''}`}),{});
            })

        },
        socketInit() {
            this.printLog('socket开始初始化')
            this.heartModel.socket = new WebSocket(socketUrl + this.sessionId);
            //监听socket的关闭
            this.heartModel.socket.onclose = (e) => {
                if (this.currentStatus === 'loggedOut') {
                    this.printLog('签出socket关闭')
                    return;
                }
                console.log("socket关闭"+this.sessionId);
                if (this.sessionId) {
                    this.socketInit();
                    this.printLog('socket关闭,重新连接')
                } else {
                    this.printLog('socket关闭,sessionId为空')
                }
                this.printLog('socket关闭详情'+JSON.stringify(e).substr(0,350))
            }
            //打开socket
            this.heartModel.socket.onopen = (e) => {
                try{
                    callAjax(heartbeatUrl + '/' + this.place + '/' + this.loginCode,{});
                    this.printLog('socket打开时间:'+new Date());
                    this.heartStart();
                }catch (e) {
                    console.log("-----heartCheck error:",e);
                    this.printLog('socket打开异常:'+new Date());
                }
            };
            //监听消息
            this.heartModel.socket.onmessage = (e) => {
                console.log("websocket数据：%c"+ e.data+'-时间：'+ new Date()+'-当前状态：'+this.currentStatus,"color:#da7a60");
                this.echoRpcReturn(e.data);
            };
            //监听错误
            this.heartModel.socket.onerror = (e) =>{
                console.log('socket收到异常'+JSON.stringify(e));
                this.printLog('socket收到异常'+JSON.stringify(e).substr(0,350))
                setTimeout(_=>{
                    this.socketInit();//重新初始化
                },10000)
            };
            this.heartModel.socket.onbeforeunload = ()=>{
                this.printLog('socket-onbeforeunload');
                this.heartModel.socket.close();
            }
        },
        echoRpcReturn(msg) {

            if (!msg) {
                console.log('-----无msg------');
                return;
            }
            if(msg == 'heartCheck') {
                //心跳检查
                return;
            }
            this.printLog('socket收到消息:');
            msg = eval('(' + msg + ')');

            if (msg.data && msg.data.messageType == 'DeviceStateChangeMessage') {
                this.handleAgentStatusChanged(msg.data.devices);
            }
            else if (msg.data && msg.data.messageType == 'CallStateChangeMessage') {
                this.CallStateChangeMessage(msg.data);
            }
            else if (msg.messageType && msg.messageType == "ErrorMessage") {
                this.showErrorMsg(msg);
            }
        },
        handleAgentStatusChanged(result) {
            let voiceState = result[0].userState.state;

            if (voiceState == 'LoggedIn') {
                this.currentStatus = 'loggedIn';
            }
            else if (voiceState == 'LoggedOut') {
                this.currentStatus = 'loggedOut';
                this.printLog('收到改变状态请求状态为:loggedOut');
            }
            else if (voiceState == 'Ready') {
                this.currentStatus = 'ready';
            }
            else if (voiceState == 'NotReady') {
                this.currentStatus = 'notReady';
            }
        },
        CallStateChangeMessage(result) {
            let currentStatus = result.call.state;
            console.log('收到CallStateChangeMessage数据状态为:'+currentStatus+'时间'+new Date());
            //打电话中
            if(currentStatus == 'Dialing') {
                if (result.call.callType == "Outbound") {// 打电话中
                    this.currentStatus ='dialing';
                    this.connId = result.call.connId;
                    this.printLog('打电话中:' + this.callNo+'connId:'+result.call.connId);
                }
            }
            else if(currentStatus == 'Held') {
                this.currentStatus='hold';
            }
            else if(currentStatus == 'Retrieve') {
                this.currentStatus ='retrieve';
            }
            else if(currentStatus == 'Established') {
                if (result.messageName == "EventEstablished") {
                    //客户接听
                    this.currentStatus = 'answer';
                    this.printLog('接听'+result.call.callType);
                }
            }
            else if(currentStatus == 'Released'){
                // if (result.messageName == "EventReleased") {
                    //客户挂断
                    this.currentStatus = 'hangup';
                    this.printLog('电话挂断..'+result.call.callType);
                    this.pushSdkCallInfo(result)
                    //进线15秒自动示闲
                    if (result.call.callType == 'Inbound') {
                        this.autoReadyMachine()
                    } else {
                        this.ready('话后自动示闲')
                    }
                // }
            }
            else if (currentStatus == 'Ringing'){
                console.log('进电话响铃');
                this.currentStatus = 'ringing';
                this.connId = result.call.connId;
                if(result.call.dnis) {
                    //设置进电号码
                    let phone = result.call.dnis;
                    if (phone.substring(0,this.phonePrefix.length) == this.phonePrefix) {
                        phone = phone.substring(this.phonePrefix.length);
                    }
                    let logtext = '响铃来电,电话号码为:' + result.call.dnis+'connId:'+result.call.connId;
                    //记录身份证
                    let userData = result.call.userData;
                    if (userData) {
                        // 自动外呼场景下
                        //催收进线
                        if (userData.sys_no == '1') { //1, "催收",2, "客服" 3, "电销" 2 活动中心
                            if (userData.client_idno) {
                                let clientIdno = userData.client_idno,//身份证
                                    refId = userData.client_id,//合同号
                                    list_no = userData.list_no;//routedId

                                let routeId = (list_no == '1' || list_no == '2') ? 1 : 2 //1:有用2:ccjj:车金融
                                this.setNcolInfo({
                                    refId: refId,
                                    routeId: routeId,
                                    clientIdno: clientIdno,
                                })
                                logtext = logtext + '催收进线,idno:'+ clientIdno+',refId'+refId+',routeId'+routeId;
                            }
                        }
                        else if (userData.sys_no == '2') {
                            //活动中心进线
                            let clientId = userData.client_id, //活动id
                                contractNo = userData.contract_no || userData.contact_no//合同号
                            setTimeout(_=>{
                                location.href = `#iactmodule-popupPage?phoneNumber=${phone}&actId=${clientId}&contractNo=${contractNo}`
                            },500)
                            logtext = logtext + '活动中心进线,clientId:'+ clientId+',contractNo'+contractNo;
                        } else {
                            // 纯呼入场景下，并且有客服的权限才弹屏
                            if (this.$parent.$parent.$parent.menuJurisdiction.isIcsm) {
                                //保存进电身份证
                                this.setIdCardNo(userData.UD_IDCard);
                                //保存电话号码（这儿是打电话的手机号码）
                                this.setPhone(userData.UD_ANI);//保存电话号码
                                //保存进电id
                                this.setConnectId(this.connId);
                                //转化热线对应的400电话取400后四位，例如：4008001889  取1889
                                let hotline = phone
                                if (this.hotLineDic[phone]) {
                                    hotline = this.hotLineDic[phone].substr(6,4)
                                }
                                this.setSourceType(hotline);
                                if (hotline != '1889'){
                                    location.href="#icsm-customerSearch?isCall=1";//系统跳转到搜索页面
                                }
                            }
                        }
                    }
                    this.printLog(logtext);
                    this.inboundPhone = phone;
                }else {
                    this.inboundPhone = '未知号码'
                }
                this.setPhone(this.inboundPhone);
            }
            else {
                //无效
                let stringData = JSON.stringify(result);
                if (stringData.length > 350) {
                    var len = Math.ceil(stringData.length/350);
                    for (var i = 0;i<len; i++){
                        this.printLog('无效状态'+(i+1)+':'+stringData.substr(i*350,350));
                    }
                } else {
                    this.printLog('无效状态'+stringData);
                }
            }
            console.log('CallStateChangeMessage-Data %c'+JSON.stringify(result),"color:#da7a60");
        },
        showErrorMsg(result) {
            var message = "";
            if (result.errorCode == 40) {
                message = "没有更多可用的Licenses";
            } else if (result.errorCode == 41) {
                message = "客户端未注册DN";
            } else if (result.errorCode == 42) {
                message = "资源已回收";
            } else if (result.errorCode == 43) {
                message = "errorCode:43";
            } else if (result.errorCode == 50) {
                message = "未知的错误代码, 请求不能处理";
            } else if (result.errorCode == 51) {
                message = "该座席未上线";
            } else if (result.errorCode == 52) {
                message = "内部错误";
            } else if (result.errorCode == 53) {
                message = "请求参数是无效的";
            } else if (result.errorCode == 54) {
                message = "没有连接到交换机";
            } else if (result.errorCode == 55) {
                message = "协议版本错误";
            } else if (result.errorCode == 56) {
                message = "errorCode:56";
            } else if (result.errorCode == 57) {
                message = "Switch 或 T-Server 无响应";
            } else if (result.errorCode == 58) {
                message = "Switch or T-Server 已停止运行";
            } else if (result.errorCode == 59) {
                message = "未在配置库中配置该分机";
            } else if (result.errorCode == 61) {
                message = "请求中的分机无效";
            } else if (result.errorCode == 71) {
                message = "无效的号码";
            } else if (result.errorCode == 93) {
                message = "目标状态无效";
            } else if (result.errorCode == 96) {
                message = "不能添加一个新的呼叫到会议中";
            } else if (result.errorCode == 185) {
                message = "坐席状态异常";
            } else if (result.errorCode == 415) {
                message = "目标号码无效";
            } else if (result.errorCode == 527) {
                message = "该工号已登录";
            } else if (result.errorCode == 565) {
                message = "无效的状态";
            } else if (result.errorCode == 1008) {
                message = "拒绝邀请";
            } else if (result.errorCode == 1019) {
                message = "会话无应答";
            } else if (result.errorCode == 1141) {
                message = "请求的对象不兼容";
            } else if (result.errorCode == 1161) {
                message = "errorCode:1161";
            } else if (result.errorCode == 10101) {
                message = "与Genesys Server连接失败";
            } else if (result.errorCode == 10102) {
                message = "目标号码为空或无效";
            } else if (result.errorCode == 10103) {
                message = "通话未开始或已结束";
            } else if (result.errorCode == 10104) {
                message = "座席签入失败";
            } else if (result.errorCode == 10105) {
                message = "座席签出失败";
            } else if (result.errorCode == 10106) {
                message = "座席状态改变失败";
            } else if (result.errorCode == 10107) {
                message = "电话呼叫失败";
            } else if (result.errorCode == 10108) {
                message = "电话接听失败";
            } else if (result.errorCode == 10109) {
                message = "电话挂断失败";
            } else if (result.errorCode == 10110) {
                message = "通话保持失败";
            } else if (result.errorCode == 10111) {
                message = "通话取回失败";
            } else if (result.errorCode == 10112) {
                message = "两步转接发起失败";
            } else if (result.errorCode == 10113) {
                message = "两步转接完成失败";
            } else if (result.errorCode == 10114) {
                message = "两步会议发起失败";
            } else if (result.errorCode == 10115) {
                message = "两步会议完成失败";
            } else if (result.errorCode == 10116) {
                message = "单步转接失败";
            } else if (result.errorCode == 10117) {
                message = "电话盲转失败";
            } else if (result.errorCode == 10118) {
                message = "单步会议失败";
            } else if (result.errorCode == 10119) {
                message = "将会议一方置为耳聋模式失败";
            } else if (result.errorCode == 10120) {
                message = "将会议一方取消耳聋模式失败";
            } else if (result.errorCode == 10121) {
                message = "添加随路数据失败";
            } else if (result.errorCode == 10122) {
                message = "删除随路数据失败";
            } else if (result.errorCode == 10123) {
                message = "更新随路数据失败";
            } else if (result.errorCode == 10124) {
                message = "打开静音失败";
            } else if (result.errorCode == 10125) {
                message = "关闭静音失败";
            } else if (result.errorCode == 10126) {
                message = "发送DTMF失败";
            } else if (result.errorCode == 10127) {
                message = "发送用户事件失败";
            } else if (result.errorCode == 10128) {
                message = "监听电话失败";
            } else if (result.errorCode == 10129) {
                message = "取消监听电话失败";
            } else if (result.errorCode == 10130) {
                message = "将会议一方踢出会议失败";
            } else if (result.errorCode == 8199) {// No such session exists
                // stop();
            } else if (result.errorCode == 8200) {// User already in the session
                // stop();
            } else {
                if(result.errorCode!=''&&result.errorMessage){
                    message=result.errorMessage;
                }else{
                    message = "";
                }
            }
            if (message != "") {// 会话已经结束
                Aurora.danger('Fe-'+message);
            }

            this.printLog('socket收到错误信息'+message,result);
        },

        //签出
        offLine() {
            if (this.currentStatus == 'loggedOut' || !this.sessionId) {
                return;
            }
            this.printLog('坐席手动签出');
            callAjax('/api/v1/me/channel/voice/' + this.sessionId,
                JSON.stringify({
                    operationName: 'Offline'
                })
            ).then( _ => {
                this.currentStatus = 'loggedOut';
                this.clearHeart();//断开心跳
            })
        },
        //示闲
        ready(describe) {
            this.printLog('调用示闲'+describe);
            callAjax('/api/v1/me/channel/voice/' + this.sessionId,
                JSON.stringify({
                    channel: 'voice',
                    operationName: 'Ready'
                })
            ).then( _ => {
                this.currentStatus = 'ready';
            })
        },
        //示忙
        notReady(code) {
            this.reasonCode = code;
            this.printLog('调用示忙-'+this.reasonCode);
            callAjax('/api/v1/me/channel/voice/' + this.sessionId,
                JSON.stringify({
                    operationName: 'NotReady',
                    reasonCode: code
                })
            ).then(_ => {
            })
        },
        //应答
        answerCall() {
            this.printLog('坐席点击接听');
            callAjax(callUrl + this.sessionId,
                JSON.stringify({
                    operationName: 'Answer',
                    connId: this.connId
                })
            ).then(_ => {
            })
        },
        //挂断
        hangupCall() {
            this.isHangupDisabled = true;
            this.printLog('坐席手动挂断');
            this.hangupDes = '坐席挂机'
            callAjax(callUrl + this.sessionId,
                JSON.stringify({
                    operationName: 'Hangup',
                    connId: this.connId
                })
            ).then(_ => {
                setTimeout(_=>{
                    this.isHangupDisabled = false;
                },1000)
            },_=>{
                this.isHangupDisabled = false;
            })
        },
        //静音开启
        holdCall() {
            this.printLog('坐席手动开启静音');
            callAjax(callUrl + this.sessionId,
                JSON.stringify({
                    operationName: 'Hold',
                    connId: this.connId
                })
            ).then(_ => {
                this.isHold = true
            },() => {
                this.isHold = false
            })
        },
        //静音关闭
        retrieveCall() {
            this.printLog('坐席手动关闭静音');
            callAjax(callUrl + this.sessionId,
                JSON.stringify({
                    operationName: 'Retrieve',
                    connId: this.connId
                })
            ).then(_ => {
                this.isHold = false
            },() => {
                this.isHold = true
            })
        },
        /**
         * 就绪
         * @param isAuto 是否是自动签入
         */
        onLine(isAuto){
            callAjax('/api/v1/me/channel/voice/'+this.sessionId,
                JSON.stringify({
                    operationName: 'Online',
                    sessionId: this.sessionId
                }),{},false,!isAuto
            ).then( _ => {

            },_=>{
                if (_.statusCode == 2) {
                    this.currentStatus = 'loggedOut';
                }
            })
        },
        //签入就绪
        // onReady(){
        //     callAjax('/api/v1/me/channels/'+this.sessionId,
        //         JSON.stringify({
        //             operationName: 'Ready',
        //             channels: ['voice']
        //         })
        //     ).then( _ => {
        //
        //     })
        // },
        //静音
        muteChange() {
            this.isHold ? this.holdCall() : this.retrieveCall();
        },
        /**
         * 拨打号码
         * @param type 1：点号码拨打，0：输入号码拨打
         */
        dialCall(type) {
            this.callMode = type;
            if (this.callEventDisabled) {
                return;
            }
            if(!this.callNo) {
                Aurora.info('请输入拨打号码!')
                return
            }
            if (!!this.phoneBlacklist && this.phoneBlacklist.indexOf(this.callNo) > -1) {
                Aurora.info('该号码是黑名单')
                return
            }
            this.callEventDisabled = true;
            var callPhone = this.callNo
            if (callPhone.substring(0,this.phonePrefix.length)!=this.phonePrefix) {
                callPhone = this.phonePrefix + callPhone;
            }
            this.printLog('坐席拨打电话:电话号码'+callPhone);
            this.resetTimer();
            callAjax('/api/v1/me/devices/' + this.sessionId + '/calls',
                JSON.stringify({
                    operationName: 'Dial',
                    destination: {
                        phoneNumber: callPhone
                    },
                    userData: {
                        v_calltype: '3'
                    }
                })
            ).then(_ => {
                this.sendHertCheck('call-');//拨打做一次心跳检测
                setTimeout(_=>{
                    this.callEventDisabled = false;
                },2000)
            },() => {
                this.callEventDisabled = false;
            })
        },

        //满意度评价
        evaluate() {
            this.printLog('坐席手动推满意度');
            let phone = this.inboundPhone;
            //外呼取输入的号码
            if (this.callOutType == 2) {
                phone = this.callNo;
            }
            callAjax(callUrl + this.sessionId,
                JSON.stringify({
                    operationName: 'SingleStepTransfer',
                    connId: this.connId,
                    destination: {
                        phoneNumber: phone
                    },
                    userData: {
                        es_satisfaction: '1'
                    }
                })
            ).then(_ => {
            })
        },
        //停止计时
        stopTimer(){
            let tempTime = this.timeStr;
            clearInterval(this.callTimer);
            this.timeStr = tempTime;
        },
        //重置通话计时
        resetTimer() {
            this.inboundPhone = '';
            clearInterval(this.callTimer);
            this.timeStr = '00:00:00';
        },
        //催收和客服电话挂断15秒自动示闲
        autoReadyMachine() {
            if (this.getHash() == 'incol' || this.getHash() == 'icsm') {
                this.timingText = 15
                let  timer = setInterval( _ => {

                    -- this.timingText

                    //可以示闲
                    if (!this.readyDisabled) {
                        if (this.timingText <= 0) {
                            clearInterval(timer)
                            //调用示闲
                            this.ready('挂断后15秒')
                        }
                    } else {
                        clearInterval(timer)
                        this.timingText = 0
                    }

                },1000)

            }
        },
        //通话计时
        callTimerFunc() {
            clearInterval(this.callTimer);
            this.timeStr = '00:00:00';
            let tempTime = 946656000000
            this.callTimer = setInterval(() => {
                tempTime = tempTime + 1000;
                this.timeStr = dateFormat(new Date(tempTime),'hh:mm:ss')
            },1000);
        },

        printLog(msg,item) {
            let ENV = '@{FEPACK.ENV}';
            if (ENV === 'LOCAL') {
                return;
            }
            console.log(msg+'--时间'+new Date());
            if(item) {
                console.log(item);
            }
            dataJs.softPhoneLog({
                title: msg + ' ' + dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss:S'),
                callId: this.connId,
                phoneNo: this.place,
                jobNo: this.loginCode
            }).then(_ => {})
        },
        /**
         * 保存通话记录
         */
        pushSdkCallInfo(result){

            if (this.hangupDes === '客户挂机'){
                //播放挂机
                document.getElementById('audioGJ')['play']()
            }

            let curDate = new Date(),
                timeLength = 0;
            let t = this.timeStr.split(':');
            if (t.length > 2) {
                timeLength = (t[0] * 360) + (t[1] * 60) + parseInt(t[2]);
            }
            let startTime = dateFormat(new Date(curDate.getTime() - (1000*timeLength)),'yyyy-MM-dd hh:mm:ss')
            if (!result) {
                result = {};
            }
            if (!result.call){
                result.call = {}
            }
            //去掉外显前缀
            if (this.phonePrefix == result.phoneNumber.substring(0,this.phonePrefix.length)) {
                result.phoneNumber = result.phoneNumber.substring(this.phonePrefix.length,result.phoneNumber.length)
            }
            let idCardNo = this.incomingIdCardNo;

            var sdkCallInfoParam = {
                agentDn: this.place,//坐席分机号
                agentName:  localStorage.getItem('userName'),//坐席姓名 ,
                agentNo: this.loginCode,//坐席工号 ,
                agentSkill: '',//坐席技能组 ,
                answerTime: startTime,//应答时间(客户接起时间,call_time+ring_time) ,
                businessType: 'col',//业务类型(必输，col,crm,tsms,fi,approve,other) ,
                callId: result.call.callUuid,//通话id(必输，外呼系统中的通话记录唯一标识,callid,sessionId等) ,
                callResult: '',//通话结果 ,
                callSystem: 'Genesys',//外呼系统编码(必输，RongLian,TianRun,QingNiu) ,
                callTime: this.callTime,//呼叫时间(开始呼叫时间) ,
                callType: result.call.callType == 'Inbound' ? 0 : 1,//呼叫类型(0-呼入/1-呼出) ,
                calledPhone: result.phoneNumber,//被叫号码(ani) ,
                callerPhone: result.call.dnis,//主叫号码(ani) ,
                clientName: this.customerName[idCardNo],//客户姓名 ,
                connected: result.call.duration ? 1 : 0,//是否接通(0-未接通,1-接通,计算得到,answer为null则为0) ,
                employeeName: localStorage.getItem('userName'),//坐席员工姓名 ,
                employeeNo: localStorage.getItem('jobNo'),//坐席员工编号 ,
                endReason: this.hangupDes,//通话结束原因(坐席挂机/客户挂机) ,
                endTime : dateFormat(curDate,'yyyy-MM-dd hh:mm:ss'),//结束时间(挂机时间) ,
                idNo: idCardNo,//客户证件号码 ,
                talkTime: result.call.duration,//通话时长(接通后时长,计算得到,秒s,end_time-answer_time) ,
                timeStmp: result.timestamp,//数据时间(时间戳)
            }
            this.hangupDes = '客户挂机'//初始化成客户挂机
            dataJs.pushSdkCallInfo(JSON.stringify(sdkCallInfoParam)).then(_ => {})
            if (!idCardNo) {
                this.printLog('Genesys无身份证'+location.href+result.phoneNumber+'-'+result.call.dnis)
            }
            this.saveCallRecord(sdkCallInfoParam,result.call.callUuid);
            this.addCallInInfo(sdkCallInfoParam,result.call.callUuid);
            let ringASR = this.getRingASR(result.call)
            this.addHangUpReason(sdkCallInfoParam,result.call.callUuid,ringASR);

        },
        getRingASR(result){
            let ringASR = '未知',
                asrModel = {
                    'power off': '关机',
                    'does not exist': '空号',
                    'out of service': '停机',
                    'hold on': '正在通话中',
                    'not convenient': '用户拒接',
                    'is not reachable': '无法接通',
                    'not in service': '暂停服务',
                    'busy now': '用户正忙',
                    'not a local number': '拨号方式不正确',
                    'barring of incoming': '呼入限制',
                    'call reminder': '来电提醒',
                    'forwarded': '呼叫转移失败',
                    'line is busy': '网络忙',
                    'not answer': '无人接听',
                    'defaulting': '欠费',
                    'cannot be connected': '无法接听',
                    'number change': '改号',
                    'line fault': '线路故障',
                    'redial later': '稍后再拨',
                }
            if(result.userData && result.userData.RingASR) {
                ringASR = asrModel[result.userData.RingASR] || ringASR;
            }
            return ringASR;
        },
        //fi保存通话数据
        saveCallRecord(sdkCallInfoParam,callUuid){
            if (this.getHash() != 'ifi') {
                return;
            }
            let param = SSPA.util.getParams();
            let contactModel = {
                contactName:this.vxContactModel.contactName,//联系人姓名(电话仓库中)
                contactType:this.vxContactModel.contactType, //联系人类型(电话仓库中)
                phoneType:this.vxContactModel.phoneType
            }

            if (this.callMode === 0) {
                contactModel.contactName = '-'
                contactModel.contactType = '-'
                contactModel.phoneType = '50'
            }
            let query = {
                caseId: param.caseId,
                contractId: param.refId,
                phoneNum: sdkCallInfoParam.calledPhone,
                callCompany:13, //外呼平台公司：10-天润；11-容联
                callType:'1', //呼叫类型：0--呼入 1--呼出
                contactName: contactModel.contactName,//联系人姓名(电话仓库中)
                contactType: contactModel.contactType, //联系人类型(电话仓库中)
                phoneType: contactModel.phoneType,//电话类型 10:客户本人电话 20:单位电话 30:紧急联系人 40:第二联系人 50:其他 ,
                dialId:localStorage.getItem('jobNo'), //电话拨打人工号
                dialName:localStorage.getItem('userName'), //电话拨打人
                numCity:'',//电话号码归属城市
                numProvince:'',//电话号码归属省
                ucid: callUuid,//电话记录唯一标识编号
                usePlatform:1,//使用平台：1-车金 融交叉贷电话回访
                callResult: sdkCallInfoParam.connected, //是否接通：0否，1是
                callId: sdkCallInfoParam.callId, //通话ID
                answerTime: sdkCallInfoParam.answerTime, //接通时间
                duration: sdkCallInfoParam.talkTime, //通话时长
                rlCallType: 'after', //容联通话类型(开始呼出:makecall, 外呼响铃:outringing,正在呼出:outcall, 已响铃:calledringing,已应答:answer,话后:after)
            }
            dataJs.saveCallRecord(query).then(_ => {})
            //清空
            this.setVxContactModel({
                contactName: '',//联系人姓名(电话仓库中)
                contactType: '', //联系人类型(电话仓库中)
                phoneType:'',//电话类型 10:客户本人电话
            })
        },
        // 进线时，需要将这几个字段传给亿讯，已方便开发坐席工作量统计报表
        addCallInInfo(sdkCallInfoParam,callUuid){
            if (sdkCallInfoParam.callType == 0) {
                let param = {
                    callUuid: callUuid,//callid
                    agentId: sdkCallInfoParam.agentNo,//工号
                    callHangUp: sdkCallInfoParam.endReason === '客户挂机' ? 1 : 2,//挂机方
                }
                dataJs.addCallInInfo(param).then(_ => {})
            }
        },
        //保存挂机信息
        addHangUpReason(sdkCallInfoParam,callUuid,status){
            //进线不保存
            if (sdkCallInfoParam.callType  == 0) {
                return;
            }
            let param = {
                callUuid: callUuid,//callid
                agentId: sdkCallInfoParam.agentNo,//工号
                phoneSource: sdkCallInfoParam.callerPhone,//主叫号码
                phoneTarget: sdkCallInfoParam.calledPhone,//被叫号码
                phoneStartTime: sdkCallInfoParam.callTime,//拨打时间
                phoneEndTime: sdkCallInfoParam.endTime,//挂机时间
                phoneResult: !!sdkCallInfoParam.connected ? '接通':'未接通',//呼叫结果
                phoneEndParty: sdkCallInfoParam.endReason,//挂机方
                status: !!sdkCallInfoParam.connected ? '接通' : status,//呼叫状态

            }
            dataJs.addHangUpReason(param).then(_ => {})
        },
        getHash() {
            let hash = location.hash;
            if (hash && hash.length) {
                hash = hash.substring(1,hash.indexOf('-'))
            }
            return hash;
        },
        ...Vuex.mapMutations({
            setPhone: 'SET_INCOMING_PHONE',
            setGenesysCallData: 'SET_GENESYS_CALLDATA',
            setVxContactModel: 'SET_VX_CONTACTMODEL',
            setNcolInfo: 'SET_NCOLINFO',
            setSourceType: 'SET_CALL_SOURCETYPE',
            setConnectId: 'SET_CONNECTID',
            setIdCardNo: 'SET_INCOMING_IDCARDNO'
        })
    }
}