declare let Vue, SSPA, Aurora,require, Vuex,$
import {dateFormat} from '../../../scripts/_util'
import * as dataJs from '../../../scripts/_data'
/**
 * currentStatus
 * online:空闲,pause:置忙,stateRinging:响铃状态，没有电话详情,comeRinging:呼入响铃状态，包含电话详情,normalBusy:正常通话
 * addBusy:断线后登陆系统直接进入通话状态,outRinging:外呼响铃,waitLink:等待客户接听,outBusy:外呼客户接听,onlineUnlink:挂断后置闲挂断后返回座席原状态
 * pauseUnlink:挂断后置闲挂断后返回座席原状态,hold:保持,unHold:保持接回,neatenEnd:整理结束,consulterOrTransferBusy:被咨询或者转移的通话
 * consultThreeBusy:咨询三方通话,consultationMove:咨询转接,spyBusy:监控通话,transferInteract:座席保持,interactReturn:座席保持接回
 * consultLink:咨询成功,neatenStart:挂机状态 不能区分是坐席挂机还是客户挂机
 */
window['CCIC2_TOOLBAR_URL'] = 'http://agent.clink.cn'

export default {
    data: () => ({
        //签入model
        loginModel:{
            hotLine: '',//热线号码59565141
            cno: '',//座席号2000
            pwd: '',//密码admin123456
            bindTel: '',//绑定电话01043904255
            bindType: '1',//绑定类型
            initStatus: 'online',//初始状态
        },
        isShowCheckin: false,//签入页面
        loginDisabled: false,//登录状态
        offlineDisabled: false,//签出状态
        currentStatus: 'noLogin',//当前状态
        callInPhone: '',//呼入电话
        callOutPhone: '',//呼出电话
        callTimeText: '00:00:00',//通话时间
        isHold: false,//静音
        callTimer: null,
        connectId: '',//进电Id
        timeStmp: '',//进电time
        onlineDisabled: false,//是否登录
        clientIdno: '',//身份证
        isOutbound: false,//是否是外呼
        isHangup: false,//是否是座席挂断
        callTime: '',//响铃时间
        conversationList: [],
        lastStatus: '',//上一次状态
        callerPhone: '',//主叫号码，
        hotline: '',//进线外显号码
        /**
         * hotline对应的400电话
         *   '89176574': '4008001889',
             '89171185': '4008001998',
             '89173187': '4008005518(有用分期)',
             '89171768': '4008009200(车金融)',
             '89175751': '4001800655(GSLS)',
             '86445622': '4008000909(ccjj)',
             '89176326': '4001622665(抱金猪)',
             '89175792': '4001650560(元气满满)',
             '89172160': '4001750570(乐享宝)',
             '53730770': '4006903777(小当家)',
             '53730771': '4006093777(闪电兔)',
         */
        hotLineDic: '',
        onlineLoading: false,//示闲中
        pauseLoading: false,//示忙中

    }),
    computed: {
        //通话状态文本
        onCallStatusTxt() {
            if(['stateRinging','comeRinging','outRinging','waitLink'].indexOf(this.currentStatus) > -1) {
                return '响铃中'
            }
            else if(['hold','transferInteract','normalBusy','outBusy','spyBusy','interactReturn','unHold','consulterOrTransferBusy'].indexOf(this.currentStatus) > -1) {
                return '通话中'
            }
            else if (['neatenStart','neatenEnd','onlineUnlink','pauseUnlink'].indexOf(this.currentStatus) > -1) {
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
        //挂断disabled
        hangupDisabled:function(){
            return this.onCallStatusTxt != '通话中' && this.onCallStatusTxt != '响铃中' && this.onCallStatusTxt != '拨打中..'
        },
        //示闲
        readyDisabled:function () {
            return !this.onlineDisabled || ['pause','pauseUnlink'].indexOf(this.currentStatus) < 0
        },
        //示忙
        notReadyDisabled:function () {
            return !this.onlineDisabled || ['online','onlineUnlink','neatenStart','neatenEnd'].indexOf(this.currentStatus) < 0
        },
        //满意度评价
        evaluateDisabled:function () {
            return this.onCallStatusTxt != '通话中'
        },
        //静音
        muteDisabled:function () {
            return this.onCallStatusTxt != '通话中'
        },
        //拨打
        callDisabled:function () {
            return this.onCallStatusTxt == '通话中' || this.onCallStatusTxt == '拨打中..' || this.onCallStatusTxt == '响铃中' || ['noLogin','online','onlineUnlink'].indexOf(this.currentStatus) > -1
        },
        //接听
        answerDisabled: function () {
            return this.currentStatus != 'comeRinging'
        },
        //进线对应的业务号码 取进线的后7位进行对应
        incomingLine: function () {
            let callerPhone = this.callerPhone.substr(-7,7)
            return this.hotLineDic[callerPhone] || this.callerPhone
        }
    },
    methods: {
        callLoadinInit: function() {
            //模拟进电
            // setTimeout(_=>{
            //     var data ={"crmCustomerNumber":"13890058884","cno":"81479","hotline":"89175751","isHiddenCrmCustomerNumber":"13890058884","idCardNo":null,"isHiddenCustomerNumber":"13890058884","customerNumber":"13890058884","type":"event","qid":"30052600008","callType":"1","ringingTime":"2019-02-27 09:01:39","bindTel":"01043904288","customerNumberType":"2","numberTrunk":"892175751","customerAreaCode":"0813","name":"ringing","enterpriseId":"3005260","uniqueId":"10.10.58.196-1551229265.1839","et":"e7","ct":"呼入","eventName":"comeRinging","action":"a5"}
            //
            //     this.cbThisStatus(data);
            //     this.onlineDisabled = true;
            //     },10000)
            if (window['executeAction']){
                return;
            }
            $.getScript('http://agent.clink.cn/jws/sourceCode/ccic2Toolbar-without-jquery.js?version='+new Date().getTime(),_=>{
                this.currentStatus = 'noLogin'//初始未登录状态
                window['cbLogin'] = this.cbLogin;//登录回调
                window['cbLogout'] = this.cbLogout;//登出回调
                window['cbUnpause'] = this.cbUnpause;//置闲回调
                window['cbPause'] = this.cbPause;//置忙回调
                window['cbHold'] = this.cbHold;//静音回调
                window['cbUnhold'] = this.cbUnhold;//静音回调
                window['cbPreviewOutCall'] = this.cbPreviewOutCall;//外呼回调
                window['cbPreviewOutCallCancel'] = this.cbPreviewOutCallCancel;//取消外呼回调
                window['cbUnLink'] = this.cbUnLink;//挂断回调
                window['cbThisStatus'] = this.cbThisStatus;//坐席状态监听 进电，外呼，接听，挂断等状态 坐席的一切状态
                window['cbRefuse'] = this.cbRefuse;//拒接回调
            });
            if (localStorage.getItem('hotLine')) {
                this.loginModel.hotLine = localStorage.getItem('hotLine')
            }
            if (localStorage.getItem('cno')) {
                this.loginModel.cno = localStorage.getItem('cno')
            }
            if (localStorage.getItem('bindTel')) {
                this.loginModel.bindTel = localStorage.getItem('bindTel')
            }
            //获取400热线配置数据
            dataJs.getCallConfigList({pageNum: 1,pageSize: 100}).then( _ => {
                if (!_.result || !_.result.list) {
                    return
                }
                this.hotLineDic = _.result.list.reduce((o,it)=>({...o,[it.telephoneNum.substr(-7,7)]:`${it.hotlineNum||''}${(it.channelName&&'('+it.channelName+')')||''}`}),{});
            })
        },
        //呼入响铃 操作
        callInFun(data){
            this.resetTimer();//重置时长
            //保存进电身份证
            this.clientIdno = data.idCardNo;
            this.setIdCardNo(data.idCardNo);
            //保存电话号码
            this.callInPhone = (data.customerNumber=='unknown_number'?'未知来电':data.customerNumber);//获取电话号码
            this.setPhone(this.callInPhone);//保存电话号码
            //保存进电id
            this.connectId = data.uniqueId;//获取进电id
            this.setConnectId(this.connectId);

            this.callerPhone = data.hotline;//进线外显号码

            this.hotline = data.hotline//进线外显号码
            //转化热线对应的400电话取400后四位，例如：4008001889  取1889
            if (this.hotLineDic[this.hotline]){
                this.hotline = this.hotLineDic[this.hotline].substr(6,4)
            }

            this.setSourceType(this.hotline);
            this.isOutbound = false;
            //1889不弹屏
            if (this.hotline !='1889'){
                location.href="#icsm-customerSearch?isCall=1";//系统跳转到搜索页面
            }
            this.printLog('呼入响铃电话:'+ this.callInPhone);//记录日志
        },
        /**
         * 监听状态 回调函数
         * @param data
         */
         cbThisStatus(data){
            console.log(data);
            console.log('----------'+new Date()["format"]('yyyy-MM-dd hh:mm:ss')+'----------------');


            this.lastStatus = this.currentStatus //保存上一次状态
            this.currentStatus = data.eventName;
            //呼入响铃
            if(this.currentStatus == 'comeRinging') {
                this.callTime = data.ringingTime;
                this.callInFun(data);
            }
            //外呼响铃
            else if(this.currentStatus == 'outRinging'){
                this.isOutbound = true;
                this.callTime =dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss');
                this.callerPhone = data.numberTrunk;
                this.connectId = data.uniqueId;//获取进电id
                this.setConnectId(this.connectId);
            }
            //外呼接听 || 呼入坐席接听
            else if(this.currentStatus == 'outBusy' || (this.currentStatus == 'normalBusy' && data.callType== '1')) {
                this.isOutbound = (this.currentStatus == 'outBusy')//是否是外呼
                this.callTimerFunc();
                this.printLog('电话接通');
            }
            //挂断  neatenStart：整理开始（座席挂断）
            else if (this.currentStatus == 'onlineUnlink' || this.currentStatus == 'pauseUnlink' || this.currentStatus == 'neatenStart'){
                this.stopTimer();
                this.timeStmp = data.eventTime;
                this.pushSdkCallInfo();
                this.isHangup = false;
                this.clientIdno = '';
            }
            //取消外呼
            else if(this.currentStatus == 'pause' && this.lastStatus == 'stateRinging' && data.callType == '3') {
                this.printLog('座席取消外呼');
            }

            let stringData = JSON.stringify(data);
            if (stringData.length > 350) {
                this.printLog('接收数据'+stringData.substring(0,350));
                this.printLog('接收数据2'+stringData.substring(350,stringData.length));
            } else {
                this.printLog('接收数据'+stringData);
            }
        },
        /**
         * 登录回调 cbLogin
         * 返回json对象token:  {"type":"response","code":"0","msg":"ok","reqType":"login",
            "sessionId":"812c16f96fa7f4bf34d75e07de4950bb", "hotline":"4006006001",
            "enterpriseId":"3000000","cno":"2002", "cname":"test","bindTel":"01041005975","bindType":"1"}
         * code描述
         0 ：登录成功
         4 ：座席不在任何一个队列
         29 ：在线座席数超过并发限制
         23 ：默认自定义置忙状态配置错误
         * hotline 热线号码
         * enterpriseId 企业号
         * cno 座席工号
         * cname 座席姓名
         * bindTel 绑定电话
         * bindType 绑定电话类型
         */
         cbLogin(data){
            this.loginDisabled = false;
            if(data.code == "0"){
                this.isShowCheckin = false;
                this.onlineDisabled = true;
                this.resetTimer();
                this.saveWorkStatus(1);
                //保存登录数据
                localStorage.setItem('hotLine',this.loginModel.hotLine)
                localStorage.setItem('cno',this.loginModel.cno)
                localStorage.setItem('bindTel',this.loginModel.bindTel)
                this.printLog('登录成功'+JSON.stringify(this.loginModel));
            }else{
                this.printLog("登录失败！" + data.msg,true);
            }
        },
        //外呼系统签入
        loginEvent() {
            if (!this.loginModel.hotLine){
                Aurora.danger('请输入热线号码');
                return;
            }
            if (!this.loginModel.cno){
                Aurora.danger('请输入座席');
                return;
            }
            if (!this.loginModel.pwd){
                Aurora.danger('请输入密码');
                return;
            }
            if (!this.loginModel.bindTel){
                Aurora.danger('请输入绑定电话');
                return;
            }
            this.loginDisabled = true;
            window['executeAction']('doLogin',this.loginModel)
            this.printLog('座席登录');
        },
        //退出
        offLineEvent(){
            this.offlineDisabled = true;
            window['executeAction']('doLogout',{type:1,removeBinding:1})//type0：不退出电话只退出座席 1：退出电话同时退出座席,removeBinding:解除绑定电话
            this.printLog('座席退出');
        },
        //退出回调
        cbLogout(data){
            if (data.code != 0){
                this.printLog('退出失败,'+data.msg,true);
            } else {
                this.onlineDisabled = false;
                this.resetTimer();
                this.currentStatus = 'noLogin'//初始未登录状态
                this.saveWorkStatus(2);
            }
        },
        //示闲
        readyEvent(){
            this.onlineLoading = true;
            window['executeAction']('doUnpause');
            this.printLog('座席示闲');
        },
        //示闲回调
        cbUnpause(data){
            this.onlineLoading = false;
            if (data.code != 0){
                this.printLog('示闲失败,'+data.msg,true);
            } else {
                this.currentStatus = 'online'
                this.printLog('示闲成功');
            }
            this.saveWorkStatus(3);
        },
        //示忙
        notReadyEvent(status){
            window['executeAction']('doPause', {description: status});
            this.printLog('座席示忙'+status);
            this.saveWorkStatus(4,status);
            this.pauseLoading = true;
        },
        cbPause(data){
            this.pauseLoading = false;
            if (data.code != 0){
                this.printLog('示忙失败,'+data.msg,true);
            } else {
                this.currentStatus = 'pause'
                this.printLog('示忙成功');
            }
        },
        //满意度调查
        doInvestingationEvent(){
            window['executeAction']('doInvestigation');
            this.printLog('座席点满意度调查');
        },
        //静音
        muteChangeEvent(){
            if (this.isHold){
                //开启静音
                window['executeAction']('doHold');
                this.printLog('座席开启静音');
            } else {
                //关闭静音
                window['executeAction']('doUnhold');
                this.printLog('座席关闭静音');
            }
        },
        cbHold(data){
            if (data.code != 0){
                this.printLog('静音失败,'+data.msg,true);
            }
        },
        cbUnhold(data){
            if (data.code != 0){
                this.printLog('静音接回失败,'+data.msg,true);
            }
        },
        //外呼
        dialCallEvent(){
            if (!this.callOutPhone){
                Aurora.danger('请选择电话号码');
            }
            this.resetTimer();
            window['executeAction']('doPreviewOutCall', {
                tel: this.callOutPhone,
                callType: 3,//1：呼入，2：网上400，3：点击外呼 4：预览外呼，5：IVR外呼 6：直接外呼
                taskId: '',//预览式外呼任务ID-可选
                customerCrmId: '',//CrmID-可选
                taskInventoryId: '',//预览式外呼详细ID-可选
                userField: '',//用户自定义参数-可选
                obClidLeftNumber: '',//外显号码-可选
            })
            this.printLog('座席外呼,'+ this.callOutPhone);
        },
        //外呼回调
        cbPreviewOutCall(data){
            if (data.code != 0){
                Aurora.danger('呼叫失败,'+data.msg);
            }
        },
        //接听
        answerCallEvent(){
            window['executeAction']('doLink');
            this.printLog('座席接听,'+ this.callInPhone);
        },
        /**
         * 挂断
         * 分三种情况，一:外呼和进电 没接听挂断，二:正在通话挂断，三：拒接
         */
         hangupCallEvent(){
            this.isHangup = true;
            if (this.currentStatus == 'stateRinging' && this.lastStatus === 'comeRinging') {
                window['executeAction']('doRefuse');//拒接
                this.printLog('座席拒接');
            }
            else if((this.currentStatus == 'stateRinging' && this.lastStatus === 'outRinging') || this.currentStatus === 'waitLink' ){
                window['executeAction']('doPreviewOutcallCancel')//取消外呼
                this.printLog('座席取消外呼-按钮');
            }
            else if (['normalBusy','outBusy','hold','unHold','consulterOrTransferBusy'].indexOf(this.currentStatus) > -1){
                window['executeAction']('doUnLink');//通话中挂断
                this.printLog('座席主动挂断');
            }
            else {
                this.printLog('未知主动挂断，状态为：'+this.currentStatus);
            }
        },
        //拒接回调
        cbRefuse(data){
            if (data.code != 0){
                Aurora.danger('取消外呼失败,'+data.msg);
            }
        },
        //取消外呼回调
        cbPreviewOutCallCancel(data){
            if (data.code != 0){
                Aurora.danger('取消外呼失败,'+data.msg);
            }
        },
        cbUnLink(data){
            if (data.code != 0){
                // Aurora.danger('挂断失败,'+data.msg);
            }
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
            clearInterval(this.callTimer);
            this.callTimeText = '00:00:00';
            let hh = 0;
            let mm = 0;
            let ss = 0;
            this.callTimer = setInterval(() => {
                this.callTimeText = '';
                if(++ss==60)
                {
                    if(++mm==60)
                    {
                        hh++;
                        mm=0;
                    }
                    ss=0;
                }
                this.callTimeText += hh < 10 ? "0" + hh : hh;
                this.callTimeText += ":";
                this.callTimeText += mm < 10 ? "0" + mm : mm;
                this.callTimeText += ":";
                this.callTimeText += ss < 10 ? "0" + ss : ss;
            },1000);
        },
        printLog(msg,isShow) {
            // console.log(msg+'--时间'+new Date());
            if(isShow) {
                Aurora.danger(msg);
            }
            dataJs.softPhoneLog({
                title: msg+' 状态：'+this.currentStatus,
                callId: this.connectId,
                phoneNo: this.loginModel.cno,
                jobNo: localStorage.getItem('jobNo')
            }).then(_ => {})
        },
        /**
         * 通话记录保存 客户用
         */
        callHistorySave(startTime,endTime,duration){

            let param = {
                callId: this.connectId,//进电id：通话id or 微信通话id
                callSourceType: this.hotline,//进线来源 服务来源：1889；WX 微信;
                phone: this.isOutbound ? this.callOutPhone : this.callInPhone,//呼入电话号码
                explicitPhone: this.callerPhone,//外显电话号码
                ivrOrbit: '',//ivr轨迹
                callPersonRelationType: '',//呼叫人关系类型
                idNo: this.clientIdno,//客户身份证
                endHandleBy: '',//最后处理人: ivr ;staff 人工；
                talkResult: '',//通话结果，1：解决；2：未解决
                callOutType: this.isOutbound ? 2 : 1,//呼入呼出类型不能为空呼入呼出类型，1：进电；2：外呼
                talkTime: duration,//通话时长
                startTimeStr: dateFormat(startTime,'yyyy-MM-dd hh:mm:ss'),//通话开始时间
                endTimeStr: dateFormat(endTime,'yyyy-MM-dd hh:mm:ss'),//通话结束时间
                staffJobNo: localStorage.getItem('jobNo')//通话客服
            }
            console.log(param);
            dataJs.callHistorySave(param).then(_ => {})
        },
        /**
         * 保存通话记录 质检系统用
         */
         pushSdkCallInfo(json){

            let endTime = new Date(),
                duration = 0;
            let t = this.callTimeText.split(':');
            if (t.length > 2) {
                duration = (t[0] * 360) + (t[1] * 60) + parseInt(t[2]);
            }
            let startTime = new Date(endTime.getTime() - (1000*duration));
            if (!this.clientIdno) {
                this.clientIdno = SSPA.util.getParams().idNo;
            }
            var sdkCallInfoParam = {
                agentDn: this.loginModel.bindTel,//坐席分机号
                agentName:  localStorage.getItem('userName'),//坐席姓名 ,
                agentNo: this.loginModel.cno,//坐席工号 ,
                agentSkill: '',//坐席技能组 ,
                answerTime: dateFormat(startTime,'yyyy-MM-dd hh:mm:ss'),//应答时间(客户接起时间,call_time+ring_time) ,
                businessType: 'crm',//业务类型(必输，col,crm,tsms,fi,approve,other) ,
                callId: this.connectId,//通话id(必输，外呼系统中的通话记录唯一标识,callid,sessionId等) ,
                callResult: '',//通话结果 ,
                callSystem: 'TianRun',//外呼系统编码(必输，RongLian,TianRun,QingNiu) ,
                callTime: this.callTime,//呼叫时间(开始呼叫时间) ,
                callType: this.isOutbound ? 1:0,//呼叫类型(0-呼入/1-呼出) ,
                calledPhone: this.isOutbound ? this.callOutPhone : this.callInPhone,//被叫号码(ani) ,
                callerPhone: this.callerPhone,//主叫号码(ani) ,
                clientName: this.clientName,//客户姓名 ,
                connected: duration ? 1 : 0,//是否接通(0-未接通,1-接通,计算得到,answer为null则为0) ,
                employeeName: localStorage.getItem('userName'),//坐席员工姓名 ,
                employeeNo: localStorage.getItem('jobNo'),//坐席员工编号 ,
                endReason: this.isHangup?'坐席挂机':'客户挂机',//通话结束原因(坐席挂机/客户挂机) ,
                endTime : dateFormat(endTime,'yyyy-MM-dd hh:mm:ss'),//结束时间(挂机时间) ,
                idNo: this.clientIdno,//客户证件号码 ,
                talkTime: duration || 0,//通话时长(接通后时长,计算得到,秒s,end_time-answer_time) ,
                timeStmp: this.timeStmp,//数据时间(时间戳)
            }
            this.callHistorySave(startTime,endTime,duration);
            dataJs.pushSdkCallInfo(JSON.stringify(sdkCallInfoParam)).then(_ => {})
            this.printLog(JSON.stringify(sdkCallInfoParam));
            if (!this.clientIdno){
                this.printLog('tianrun无身份证'+location.href+sdkCallInfoParam.calledPhone)
            }

        },
        //获取会话列表
        getConversationList() {
            this.conversationList = [];
            dataJs.getConversationList(1,100).then(_ => {
                if (!_.result || !_.result.list){
                    return;
                }
                this.conversationList = _.result.list.reverse();
            })
        },
        //保存工作状态 1：签入，2：签出，3：主动示闲，4：主动示忙，5自动示闲，6：自动示忙，7：进线，8：进线结束
        saveWorkStatus(type,reason) {
            dataJs.saveWorkStatus(type,this.loginModel.bindTel,reason).then( _ => {})
        },
        timeago(date) {
            if (!date) {
                return '未知';
            }
            let dateTimeStamp = new Date(date).getTime();
            var minute=1000*60;      //把分，时，天，周，半个月，一个月用毫秒表示
            var  hour=minute*60;
            var day=hour*24;
            var week=day*7;
            var month=day*30;
            var  now=new Date().getTime();   //获取当前时间毫秒
            var diffValue=now-dateTimeStamp;//时间差
            if(diffValue<0){ return ''; }
            var  minC=Math.floor(diffValue/minute);  //计算时间差的分，时，天，周，月
            var  hourC=Math.floor(diffValue/hour);
            var  dayC=Math.floor(diffValue/day);
            var  weekC=Math.floor(diffValue/week);
            var  monthC=Math.floor(diffValue/month);
            if(monthC>=1){
                return monthC+"月前"
            }
            else if(weekC>=1){
                return weekC+"周前"
            }
            else if(dayC>=1){
                return dayC+"天前"
            }
            else if(hourC>=1){
                return hourC+"小时前"
            }
            else if(minC>=1){
                return minC+"分钟前"
            }
            else{
                return "刚刚";
            }
        },
        ...Vuex.mapMutations({
            setCallState: 'SET_CALL_STATE',
            setPhone: 'SET_INCOMING_PHONE',
            setSourceType: 'SET_CALL_SOURCETYPE',
            setConnectId: 'SET_CONNECTID',
            setIdCardNo: 'SET_INCOMING_IDCARDNO',
        })
    },

}