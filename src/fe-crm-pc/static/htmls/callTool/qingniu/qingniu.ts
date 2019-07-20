declare let Vue, SSPA, Aurora,require,$,Vuex

import * as dataJs from '../../../scripts/_data'
import {dateFormat} from '../../../scripts/_util'
import phoneList from './phone'

 let WA = window['WA'] || {};

export default {
    data:() =>({
        loginModel: {
            agentId: localStorage.getItem('agentId'),
            agentPassword: "",
            agentNumber: localStorage.getItem('agentNumber'),//sip:12321
            disNumber: '075528852940',//外显号码
            skill: 'M1H',//技能组M1/M2
        },
        isShowCheckin: false,
        callInPhone: '',//响铃电话
        callTimer: null, //计时器
        callTimeText: '00:00:00',//通话时间
        callOutPhone: '', //拨打号码
        callingTime:'',//进电/外呼时间
        startTime:'',//开始接听通话时间
        endTime:'',//结束通话时间
        callOutType: '',//1呼入，2呼出
        currentStatus: 'logout',
        loginDisabled: false,
        connectId: '',
        callMode: 1,//1:点号码拨打，0：手动输入号码拨打
    }),
    computed:{
        //通话状态文本
        onCallStatusTxt() {
            if(['comeRinging','outRinging'].indexOf(this.currentStatus) > -1) {
                return '响铃中'
            }
            else if(['outBoundConnected','inBoundConnected'].indexOf(this.currentStatus) > -1) {
                return '通话中'
            }
            else if (this.currentStatus == 'disconnect') {
                return '通话结束';
            }
            else if (this.currentStatus == 'outRinging') {
                return '拨打中..';
            }
            else {
                return '等待连接'
            }
        },
        isBlue:function(){
            return this.onCallStatusTxt != '等待连接' && this.onCallStatusTxt != '通话结束';
        },
        //登出状态
        offlineDisabled: function(){
            return this.currentStatus == 'logout'
        },
        //挂断
        hangupDisabled:function(){
            return this.onCallStatusTxt != '通话中' && this.onCallStatusTxt != '响铃中' && this.onCallStatusTxt != '拨打中..'
        },
        //接听
        answerDisabled:function(){
            return  this.onCallStatusTxt != '响铃中'
        },
        //拨打
        callDisabled:function () {
            return this.onCallStatusTxt == '通话中' || this.onCallStatusTxt == '拨打中..' || this.onCallStatusTxt == '响铃中' || this.currentStatus == 'logout' ||  this.currentStatus == 'ready'
        },
        //示闲
        readyDisabled:function(){
            return ['login','logout','ready','disconnect'].indexOf(this.currentStatus) > -1 || this.onCallStatusTxt !='等待连接'
        },
        //示忙
        notReadyDisabled:function () {
            return ['login','logout','notReady','away'].indexOf(this.currentStatus) > -1 || this.onCallStatusTxt !='等待连接'
        },
        //签入
        onlineDisabled() {
           return this.currentStatus != 'login'
        },
        ...Vuex.mapGetters([
            'qingniuCallData',//外呼数据
            'qingniuCallIsLogin',//外呼登录状态
            'incomingIdCardNo',
            'customerName',
            'vxContactModel',
            'phoneBlacklist'
        ]),
    },
    watch:{
        currentStatus:function (val) {
            if (['disconnect','logout','login'].indexOf(val)>-1){
                this.setQingNiuCallData('')
            }
        },
        //监听外呼
        qingniuCallData:function (val) {
            if (val) {
                this.callOutPhone = val;
                //已登录
                if (this.qingniuCallIsLogin) {
                    this.dialCallEvent(1)
                } else {
                    this.setQingNiuCallData('')
                    //无登录
                    this.loginEvent();
                }
            }
        },
        isShowCheckin:function (val) {
            if (!val) {
                this.loginDisabled = false;
            }
        }
    },
    methods:{
        //登录
        loginEvent() {
            if (!this.loginModel.agentId) {
                Aurora.danger('请填写坐席工号');
                this.isShowCheckin = true;
                return;
            }
            if (!this.loginModel.agentPassword) {
                Aurora.danger('请填写密码');
                this.isShowCheckin = true;
                return;
            }
            if (!this.loginModel.agentNumber) {
                Aurora.danger('请填写坐席分机号');
                this.isShowCheckin = true;
                return;
            }


            this.loginDisabled = true
            var result = WA.extend.login({
                entId: "0101490451",//企业编号
                agentId:this.loginModel.agentId,
                agentPassword:this.loginModel.agentPassword,
                agentNumber:this.loginModel.agentNumber,
                isForce:true
            });
            localStorage.setItem('agentId',this.loginModel.agentId);
            localStorage.setItem('agentNumber',this.loginModel.agentNumber);
            this.printLog('坐席登录');
        },
        //随机取外显号码
        setdisNumber(){
            let disNumberArr = phoneList[this.loginModel.skill]
            let n = 0,m = disNumberArr.length - 1;
            var random = Math.floor(Math.random()*(m-n+1)+n);
            this.loginModel.disNumber = disNumberArr[random]
        },
        //登出
        callLogout(){
          WA.extend.logout();
          this.setIsLogin(false);
          this.printLog('坐席登出');
        },
        /**
         * 拨打号码
         * @param type 1：点号码拨打，0：输入号码拨打
         */
        dialCallEvent(type){
          this.callMode = type;
          if(!this.callOutPhone)  {
              Aurora.danger('请输入外呼号码');
              return;
          }
          if (!!this.phoneBlacklist && this.phoneBlacklist.indexOf(this.callOutPhone) > -1) {
                Aurora.info('该号码是黑名单')
                return
          }
          this.setdisNumber();
          WA.extend.makeCall({
              outCallNumber: this.callOutPhone,
              disNumber: this.loginModel.disNumber
          });
          this.callingTime = dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss');
          this.printLog('坐席打电话' + this.callOutPhone+'外显号码：' + this.loginModel.disNumber);
        },
        //挂断电话
        hangupCallEvent(){
            WA.extend.hangup();
            this.printLog('坐席挂断电话');
        },
        //置忙-电话接通中，状态自动变更为"置忙"
        busyCall(){
            WA.extend.setBusy();
            this.printLog('坐席置忙');
        },
        //置闲-电话挂断后，1分钟之内，状态自动由"置忙"变为"置闲"，1分钟为话后处理时间，时间待评估
        readyEvent(){
            WA.extend.setReady();
            this.printLog('坐席置闲');
        },
        resetEvent(){
            WA.extend.reset();
            this.printLog('坐席重置');
        },
        //小休-需要坐席手动变更，后续可添加小休原因。
        notReadyEvent(reason){
            // WA.extend.setAway('小休');
            // this.printLog('坐席小休');
        },
        callLoadinInit(){
            if (window['WA']) {
                return;
            }
            $.getScript('http://open.ccod.com:20000/WATEXT/WA.js',_=>{
                setTimeout(_=>{
                    this.callCenterInit()
                },1000)
            });
        },
        callCenterInit(){
            let that = this;
            WA = window['WA'];
            WA.init({
                ui: false,
                callback:function () {
                    WA.registerResultHandler((data) =>{
                        // handle data when command results received
                        console.log('registerResultHandler');
                        console.dir(data);
                        if(data.type == 'forceLogin' || data.type == 'login'){
                            if(data.code == '000'){
                                that.setIsLogin(true)
                                that.currentStatus = 'login';
                                that.printLog('Result登录成功');
                                that.isShowCheckin = false;
                            }else {
                                that.setIsLogin(false)
                                that.$message('danger','Result登录失败',data.msg);
                                that.currentStatus = 'logout';
                                that.printLog('Result登录失败'+data.msg);
                            }
                            that.loginDisabled = false
                        }
                        else if (data.type=='autoLogin'){
                            if(data.code == '000'){
                                that.setIsLogin(true)
                                that.currentStatus = 'login';
                                that.currentStatus = 'notReady';
                                that.printLog('Result登录autoLogin成功');
                                Aurora.success('自动登录成功');
                                that.isShowCheckin = false;

                            } else {
                                that.currentStatus = 'logout';
                                that.printLog('Result登录autoLogin失败');
                            }
                            that.loginDisabled = false

                        }
                        //示闲
                        else if(data.type=='setReady'){
                            if(data.code == '000'){
                                that.printLog('Result示闲成功');
                                that.currentStatus = 'ready';
                            }else {
                                that.$message('danger','置闲失败',data.msg);
                                that.printLog('Result置闲失败'+data.msg);
                            }
                        }
                        //示忙
                        else if(data.type=='setBusy'){
                            if(data.code == '000'){
                                that.currentStatus='notReady';
                                that.printLog('Result示忙成功');
                            }else {
                                that.$message('danger','置忙失败',data.msg);
                                that.printLog('Result置忙失败'+data.msg);
                            }
                        }
                        //外呼
                        else if(data.type == 'makeCall'){
                            if(data.code == '000'){
                                that.resetTimer();
                                that.startTime = new Date().getTime();
                                that.printLog('Result外呼成功');
                                console.log("外呼-startTime--"+that.startTime);
                            }else {
                                that.$message('danger', '失败', data.ext.errorMessage);
                                that.printLog('Result外呼失败'+data.ext.errorMessage);
                            }
                        }
                    });

                    WA.registerEventHandler((data)=> {
                        console.log('registerEventHandler');
                        console.dir(data);
                        //登录成功
                        if(data.type == 'EVENT_AGENT_LOGIN'){
                            that.isShowCheckin = false;
                            that.currentStatus = 'login';
                            that.currentStatus = 'notReady';
                            that.setIsLogin(true)
                            //有电话自动拨号
                            if (that.qingniuCallData) {
                                that.dialCallEvent();
                            }
                            that.loginDisabled = false
                            that.printLog('Event登录成功');
                        }
                        //登录失败
                        else if(data.type == 'EVENT_AGENT_LOGIN_FAIL' || data.type == 'EVENT_WEBAGENT_LOGIN_FAIL'){
                            that.setIsLogin(false)
                            that.currentStatus = 'logout';
                            that.$message('danger','登录失败',data.ext.errorMessage);
                            that.loginDisabled = false
                            that.printLog('Event登录失败');
                        }
                        //签出成功
                        else if(data.type=='EVENT_AGENT_LOGOUT'){
                            that.setIsLogin(false)
                            that.currentStatus = 'logout';
                            that.printLog('Event签出成功');
                        }
                        //外呼坐席振铃事件
                        else if(data.type=='EVENT_OUTBOUND_ALERTING_OP'){
                            that.currentStatus= 'outRinging'
                            that.printLog('外呼坐席振铃');
                        }
                        else if(data.type == 'EVENT_CALL_CONTROL_FAIL'){
                            that.$message('danger', '失败', data.ext.errorMessage);
                            that.printLog('外呼失败'+data.ext.errorMessage);
                        }
                        //外呼接通
                        else if (data.type == 'EVENT_OUTBOUND_CONNECTED_OP') {
                            that.resetTimer();
                            that.callTimerFunc();
                            that.currentStatus= 'outBoundConnected'
                            that.startTime=new Date().getTime();
                            console.log("开始通话-startTime--"+that.startTime);
                            that.callOutType = 2;
                            that.printLog('外呼接通');
                        }
                        //呼入坐席振铃事 | 单步转移振铃
                        else if(data.type == 'EVENT_INBOUND_ALERTING' || data.type == 'EVENT_SINGLE_STEP_TRANSFER_ALERTING_TP'){
                            that.callInPhone = data.ext.strOrigAni;
                            that.currentStatus='comeRinging';
                            that.callingTime = dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss');
                            console.log("响铃-callingTime--"+that.callingTime);
                            that.setPhone(that.callInPhone);
                            that.callOutType = 1;
                            that.printLog('呼入坐席振铃:'+that.callInPhone);
                        }
                        //呼入坐席接通事件
                        else if(data.type == 'EVENT_INBOUND_CONNECTED'){
                            that.resetTimer();
                            that.callTimerFunc();
                            that.callInPhone = data.ext.strOrigAni;
                            that.currentStatus= 'inBoundConnected'
                            that.startTime = new Date().getTime();
                            console.log("呼入通话-startTime--"+that.startTime);
                            that.printLog('呼入坐席接通:'+that.callInPhone);
                        }
                        //坐席挂断事件 | 客户挂断事件
                        else if(data.type == 'EVENT_TP_DISCONNECT' || data.type == 'EVENT_OP_DISCONNECT'){
                            that.stopTimer()
                            that.currentStatus = 'disconnect'
                            that.endTime=new Date().getTime();
                            console.log("坐席挂断-endTime--"+that.endTime);
                            that.connectId = data.ext.sessionId
                            that.pushSessionId(data.ext.sessionId,that.startTime,that.endTime);
                            if (that.incomingIdCardNo) {
                                that.pushSdkCallInfo(data.ext.sessionId,data.type == 'EVENT_TP_DISCONNECT');
                            } else {
                                that.printLog('青牛无身份证'+location.href+that.callOutPhone)
                            }
                            that.printLog('挂断事件:'+ data.type == 'EVENT_TP_DISCONNECT');
                            that.busyCall();

                        }
                        //置闲成功
                        else if(data.type == 'EVENT_AGENT_READY'){
                            that.currentStatus='ready';
                            that.printLog('Event置闲成功:');
                        }
                        //置忙成功
                        else if(data.type == 'EVENT_AGENT_NOTREADY'){
                            that.currentStatus='notReady';
                            that.printLog('Event置忙成功:');
                        }
                        //小休
                        else if(data.type == 'EVENT_AGENT_AWAY'){
                            that.currentStatus = 'away';
                            that.printLog('Event小休成功:');
                        }

                    });
                }
            });
        },
        //停止计时
        stopTimer(){
            let tempTime = this.callTimeText;
            clearInterval(this.callTimer);
            this.callTimeText = tempTime;
        },
        //重置通话计时
        resetTimer() {
            this.callInPhone = '';
            clearInterval(this.callTimer);
            this.callTimeText = '00:00:00';
        },
        //通话计时
        callTimerFunc() {
            var temp = 946656000000;//2000-01-01 00：00：00作为临时值
            this.callTimer = setInterval(() => {
                temp +=  1000
                this.callTimeText = dateFormat(new Date(temp),'hh:mm:ss');
            },1000);
        },
        pushSessionId(callId,startTime,endTime){
            dataJs.pushSessionInfo(callId,startTime,endTime).then((_)=>{})
        },
        printLog(msg,isShow) {
            // console.log(msg+'--时间'+new Date());
            if(isShow) {
                Aurora.danger(msg);
            }
            dataJs.softPhoneLog({
                title:'青牛-'+ msg+'-状态：'+this.currentStatus,
                callId: this.connectId,
                phoneNo: this.loginModel.agentId,
                jobNo: localStorage.getItem('jobNo')
            }).then(_ => {})
        },
        /**
         * 保存通话记录
         * @param sessionId 唯一的callid
         * @param isAgentHangup 是否是坐席挂断
         */
        pushSdkCallInfo(sessionId,isAgentHangup){
            //通话时长
            let timeLength = (new Date('2000-01-01 '+this.callTimeText).getTime()-946656000000)/1000;

            var sdkCallInfoParam = {
                agentDn: this.loginModel.agentNumber,//坐席分机号
                agentName:  localStorage.getItem('userName'),//坐席姓名 ,
                agentNo: this.loginModel.agentId,//坐席工号 ,
                agentSkill: '',//坐席技能组 ,
                answerTime: dateFormat(new Date(this.startTime),'yyyy-MM-dd hh:mm:ss'),//应答时间(客户接起时间,call_time+ring_time) ,
                businessType: 'col',//业务类型(必输，col,crm,tsms,fi,approve,other) ,
                callId: sessionId,//通话id(必输，外呼系统中的通话记录唯一标识,callid,sessionId等) ,
                callResult: '',//通话结果 ,
                callSystem: 'QingNiu',//外呼系统编码(必输，RongLian,TianRun,QingNiu) ,
                callTime: this.callingTime,//呼叫时间(开始呼叫时间) ,
                callType: this.callOutType == 1 ? 0:1,//呼叫类型(0-呼入/1-呼出) ,
                calledPhone: this.loginModel.disNumber,//被叫号码(ani) ,
                callerPhone: this.callOutPhone,//主叫号码(ani) ,
                clientName: this.customerName?this.customerName[this.incomingIdCardNo]:'',//客户姓名 ,
                connected: this.startTime?1:0,//是否接通(0-未接通,1-接通,计算得到,answer为null则为0) ,
                employeeName: localStorage.getItem('userName'),//坐席员工姓名 ,
                employeeNo: localStorage.getItem('jobNo'),//坐席员工编号 ,
                endReason: isAgentHangup?'坐席挂机':'客户挂机',//通话结束原因(坐席挂机/客户挂机) ,
                endTime : dateFormat(new Date(this.endTime),'yyyy-MM-dd hh:mm:ss'),//结束时间(挂机时间) ,
                idNo: this.incomingIdCardNo,//客户证件号码 ,
                talkTime: timeLength,//通话时长(接通后时长,计算得到,秒s,end_time-answer_time) ,
                timeStmp: 0,//数据时间(时间戳)
            }
            dataJs.pushSdkCallInfo(JSON.stringify(sdkCallInfoParam)).then(_ => {})
            this.saveCallRecord(sdkCallInfoParam)
        },
        //fi保存通话数据
        saveCallRecord(sdkCallInfoParam){
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
                callCompany:12, //外呼平台公司：10-天润；11-容联
                callType:'1', //呼叫类型：0--呼入 1--呼出
                contactName: contactModel.contactName,//联系人姓名(电话仓库中)
                contactType: contactModel.contactType, //联系人类型(电话仓库中)
                phoneType: contactModel.phoneType,//电话类型 10:客户本人电话 20:单位电话 30:紧急联系人 40:第二联系人 50:其他 ,
                dialId:localStorage.getItem('jobNo'), //电话拨打人工号
                dialName:localStorage.getItem('userName'), //电话拨打人
                numCity:'',//电话号码归属城市
                numProvince:'',//电话号码归属省
                ucid: sdkCallInfoParam.callId +new Date().getTime(),//电话记录唯一标识编号
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
        getHash() {
            let hash = location.hash;
            if (hash && hash.length) {
                hash = hash.substring(1,hash.indexOf('-'))
            }
            return hash;
        },
        ...Vuex.mapMutations({
            setPhone: 'SET_INCOMING_PHONE',
            setIsLogin: 'SET_QINGNIU_CALLISLOGIN',
            setQingNiuCallData: 'SET_QINGNIU_CALLDATA',
            setVxContactModel: 'SET_VX_CONTACTMODEL',
        })
    },
}