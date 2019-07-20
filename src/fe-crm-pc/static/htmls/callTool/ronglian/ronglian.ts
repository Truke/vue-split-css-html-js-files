declare let Vue, SSPA, Aurora,require, Vuex,$
import * as dataJs from '../../../scripts/_data'
var md5 = require('../../../scripts/libs/md5.js')
/**
 * 容联外呼组件
 */
export default {
    data: () => ({
        isShowCallView: false,
        logining: false,
        rules: {},
        callLoginForm:{},//外呼登录表单
        isAutoCall: false,//是否是自动外呼
        accountJobNo: '',//外呼工号
        isOutbound: false,//是否是外呼
        isHangup: false,//是否是坐席挂机
        callMode: 1,
        autoInfo: {
            operator: '',
            pwd: '',
            companyid: '',
            logintype: '',
            url: '',
            client_type: '',
            server_type: '',
        },
    }),
    watch: {
        //监听详情页无登录要拨打的电话数据
        ronglianCallData:function(val){
            if (val) {
                if (this.ronglianCallIsLogin) {
                    this.callout(val,1);
                } else {
                    this.setRongLianCallData('');
                    //自动登录
                    this.callLogin(val);
                }
            }
        },
        'phoneBlacklist': function(val){
            window['phoneBlacklist'] = val;
        }
    },
    computed: {
        ...Vuex.mapGetters([
            'ronglianCallData',//外呼数据
            'ronglianCallIsLogin',//外呼登录状态
            'incomingIdCardNo',
            'customerName',
            'vxContactModel',
            'phoneBlacklist'
        ]),
    },
    methods: {
        /**
         * 组件入口
         * 初始化加载外部js
         */
        callLoadinInit(){
            //如果没有加载过callcenter
            if (!window['CallCenter']){
                $.getScript('@{FEPACK.STATIC_URL}'+"/fe-crm-pc/static/scripts/libs/CallCenter/CallCenter.js");
            }
            //无登录，未初始化过
            if (!window['isColCallCenterInit'] && $('#CallCenter_main').length === 0){
                //进行初始化
                this.$nextTick(_=>{
                    this.callCenterInitLogin();
                })
            }
            this.isAutoCall = location.hash.indexOf('isAutoCall=1') === -1
            this.getAccountJobNo();
        },
        /**
         * 获取外呼工号
         */
        getAccountJobNo(){
            dataJs.getAccount({
                employeeId: localStorage.getItem('userId')
            }).then(_=>{
                if (!_.result || !_.result.account){
                    return;
                }
                localStorage.setItem('accountJobNo',_.result.account)
                this.accountJobNo = _.result.account;
                this.callLoginForm.operator = _.result.account;
            })
        },
        //显示登录
        showLoginDialog(){
            let hash = this.getHash();
            this.logining = true;
            if (hash == 'incol') {
                this.getCollectionInfo();
            } else if (hash == 'ipl' || hash == 'ifi' || hash == 'ilaw') {
                this.getFiLoginInfo();
            }
        },
        /**
         * 签出 父组件有调用
         */
        callLogout(){
            if (window['CallCenter']){
                let CallCenter = window['CallCenter']
                CallCenter.logout();
                this.setIsLogin(false);
            }
        },
        callLogin2(){
            this.callLoginForm.pwd = md5(this.callLoginForm.pwd);
            this.callLogin('');
        },
        callLogin(phone){
            if (!this.callLoginForm.operator || !this.callLoginForm.mid || !this.callLoginForm.pwd) {
                this.isShowCallView = true;
                this.logining = false
                return;
            }
            // 外呼登录
            // 改造外呼错误alert提示
            window.alert = function(msg){
                // Aurora.danger(msg)
                console.log('alert:'+msg)
            }

            let CallCenter = window['CallCenter']

            this.callCentenOpLogin();
            // 登录成功容联，回调
            CallCenter.logon_event = (json) => {

                console.log('登录成功回调：')
                console.log(json)

                this.isShowCallView = false
                this.logining = false

                if(json.status == 0){
                    // 上班成功:登录成功（回调）后示闲
                    CallCenter.free();

                    // 已登录
                    this.setIsLogin(true);
                    //如果有电话参数自动拨打
                    if (phone) {
                        this.callout(phone,1);
                    }
                }else{
                    Aurora.danger('外呼登录失败')
                    this.setIsLogin(false);

                }
            }


            // ---------------外呼：事件集合 Start------------------
            // 登录失败事件
            CallCenter.opLogin_callback = json => {
                let msg = json.code
                if(json.code == '0004'){
                    msg = 'session过期或不存在，需要重新登录'
                }else if(json.code == '0009'){
                    msg = '验证非法'
                }else if(json.code == '1001'){
                    msg = '用户名格式不正确'
                }else if(json.code == '1002'){
                    msg = '没绑定sip电话'
                }else if(json.code == '1003'){
                    msg = '没绑定电话号码'
                }else if(json.code == '1004'){
                    msg = '用户名或密码错误'
                    // 显示登录弹窗
                    this.isShowCallView = true
                    this.logining = false;
                }else if(json.code == '1005'){
                    msg = '账号被禁用'
                }else if(json.code == '1006'){
                    msg = '旧密码错误'
                    // 显示登录弹窗
                    this.isShowCallView = true
                    this.logining = false;
                }else if(json.code == '1007'){
                    msg = '账户不存在'
                }else if(json.code == '1008'){
                    msg = '没绑定主要技能组'
                }else if(json.code == '2001'){
                    msg = '工单编号为空'
                }else if(json.code == '3001'){
                    msg = '必填参数为空'
                }else if(json.code == '3003'){
                    msg = '登录过期，请重新尝试'
                }else if(json.code == '4001'){
                    msg = '有子目录，不能删除'
                }else if(json.code == '8888'){
                    msg = '系统异常'
                }else if(json.code == '9003'){
                    msg = '任务状态错误'
                }else if(json.code == '9004'){
                    msg = '超出座席领取最大用户数量'
                }
                Aurora.danger(msg);
                this.logining = false
            }
            //主动挂机
            CallCenter.cancelmakecall_callback=()=> {
                this.isHangup = true;
                this.setRongLianCallData('');
            }
            CallCenter.makecall_event=()=> {
                this.isOutbound = CallCenter.isOutbound();
            }

            // 话机异常
            CallCenter.siperror_event = json => {
                this.setIsLogin(false);
                this.setRongLianCallData('');
            }
            // 话后，自动示闲
            CallCenter.after_event = json => {
                CallCenter.free();
                this.pushSdkCallInfo(json);
                if (!this.incomingIdCardNo) {
                    this.printLog('容联无身份证'+location.href+'-'+json.called+'-'+json.caller)
                }
                var temptimes = json.timestamp+"000";
                console.log("json.timestamp-"+temptimes);
                // 保存通话记录
                let params = {
                    clientName:this.customerName[this.incomingIdCardNo],
                    clientIdNo:this.incomingIdCardNo,
                    timeStamp:temptimes,
                    uuid:json.callid
                }
                dataJs.saveRecord(params).then(_ => {
                    Aurora.success('保存成功')
                },(_) => {
                    Aurora.danger('保存失败')
                })
                this.isHangup = false;
                this.isOutbound = false;
                this.setRongLianCallData('');
            }
            // ---------------外呼：事件集合 End--------------------

        },
        callout(phone,type=1){
            this.callMode = type
            if (!!this.phoneBlacklist && this.phoneBlacklist.indexOf(phone) > -1) {
                Aurora.info('该号码是黑名单')
                return
            }
            let CallCenter = window['CallCenter']
            CallCenter.callout(phone)
        },
        callCenterInitLogin(){

            window['isColCallCenterInit'] = true;//标记已经初始化过
            let timer = setInterval(() => {
                if(window['CallCenter']){
                    // 显示外呼工具条
                    clearInterval(timer);
                    let CallCenter = window['CallCenter']
                    $('#CallCenter_main').remove();
                    if($('#CallCenter_main').length === 0){
                        $("#callTools").append(CallCenter.draw());
                    }
                }
            },200);

            this.callLoginForm.operator = this.callLoginForm.operator || localStorage.getItem('Call_operator')
            this.callLoginForm.pwd = localStorage.getItem('Call_pwd') || ''
            this.callLoginForm.mid = localStorage.getItem('Call_mid') || ''
        },
        printLog(msg,item) {
            console.log(msg+'--时间'+new Date());
            if(item) {
                console.log(item);
            }
            dataJs.softPhoneLog({
                title: msg,
                callId: '',
                phoneNo: '',
                jobNo: this.callLoginForm.operator
            }).then(_ => {})
        },
        /**
         * 保存通话记录
         */
         pushSdkCallInfo(json){
            var isJieTong = (json.filename && json.filename !== ' ');//根据通话文件名来判断有没有接通
            var sdkCallInfoParam = {
                agentDn: '',//坐席分机号
                agentName:  localStorage.getItem('userName'),//坐席姓名 ,
                agentNo: this.callLoginForm.operator,//坐席工号 ,
                agentSkill: '',//坐席技能组 ,
                answerTime: json.answer_time,//应答时间(客户接起时间,call_time+ring_time) ,
                businessType: 'col',//业务类型(必输，col,crm,tsms,fi,approve,other) ,
                callId: json.callid,//通话id(必输，外呼系统中的通话记录唯一标识,callid,sessionId等) ,
                callResult: '',//通话结果 ,
                callSystem: 'RongLian',//外呼系统编码(必输，RongLian,TianRun,QingNiu) ,
                callTime: json.begin_time,//呼叫时间(开始呼叫时间) ,
                callType: this.isOutbound? 1:0,//呼叫类型(0-呼入/1-呼出) ,
                calledPhone: json.called,//被叫号码(ani) ,
                callerPhone: json.caller,//主叫号码(ani) ,
                clientName: this.customerName ? this.customerName[this.incomingIdCardNo]:'',//客户姓名 ,
                connected: isJieTong ? 1 : 0,//是否接通(0-未接通,1-接通,计算得到,answer为null则为0) ,
                employeeName: localStorage.getItem('userName'),//坐席员工姓名 ,
                employeeNo: localStorage.getItem('jobNo'),//坐席员工编号 ,
                endReason: this.isHangup ? '坐席挂机' : '客户挂机',//通话结束原因(坐席挂机/客户挂机) ,
                endTime : json.end_time,//结束时间(挂机时间) ,
                idNo: this.incomingIdCardNo,//客户证件号码 ,
                talkTime: isJieTong ? json.duration : 0,//通话时长(接通后时长,计算得到,秒s,end_time-answer_time) ,
                timeStmp: json.timestamp,//数据时间(时间戳)
                trRecordName: json.filename || '' //保存录音文件名
            }
            if (sdkCallInfoParam.idNo) {
                dataJs.pushSdkCallInfo(JSON.stringify(sdkCallInfoParam)).then(_ => {})
            }
            this.saveCallRecord(sdkCallInfoParam)
            this.callMode = 0;
        },
        //fi保存通话数据
        saveCallRecord(sdkCallInfoParam){
            if (this.getHash() != 'ifi') {
                return;
            }
            let param = SSPA.util.getParams();
            let contactModel = {
                contactName: '-',//联系人姓名(电话仓库中)
                contactType: '-', //联系人类型(电话仓库中)
                phoneType: '50'
            }
            if (this.vxContactModel.contactName || this.vxContactModel.contactType || this.vxContactModel.phoneType) {
                contactModel.contactName = this.vxContactModel.contactName || '--',//联系人姓名(电话仓库中)
                contactModel.contactType = this.vxContactModel.contactType || '--', //联系人类型(电话仓库中)
                contactModel.phoneType = this.vxContactModel.phoneType || '--'
            }
            
            let query = {
                caseId: param.caseId,
                contractId: param.refId,
                phoneNum: sdkCallInfoParam.calledPhone,
                callCompany:11, //外呼平台公司：10-天润；11-容联
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
                rlCallType:'after', //容联通话类型(开始呼出:makecall, 外呼响铃:outringing,正在呼出:outcall, 已响铃:calledringing,已应答:answer,话后:after)
                trRecordName: sdkCallInfoParam.trRecordName || '' //保存录音文件名
            }
            dataJs.saveCallRecord(query).then(_ => {})
            //清空
            this.setVxContactModel({
                contactName: '',//联系人姓名(电话仓库中)
                contactType: '', //联系人类型(电话仓库中)
                phoneType:'',//电话类型 10:客户本人电话
            })
        },
        //催收自动登录
        getCollectionInfo(){
            dataJs.manualcall().then(_ => {
                let data = _.result || {}
                let employee = data.employeeAccount || {}
                this.autoInfo.operator = employee.account;
                this.autoInfo.pwd = md5(data.initiativeCallPwd);
                this.autoInfo.companyid = employee.mid;
                this.autoInfo.logintype = 2;
                this.autoInfo.url = data.initiativeCallApi;
                this.autoInfo.client_type = 2;
                this.autoInfo.server_type = '';
                this.callLoginForm.operator = employee.account
                this.callLoginForm.mid = employee.mid;
                this.callLoginForm.pwd = this.autoInfo.pwd;
                this.callLogin()
            },_ => {
                this.logining = false
            }).catch(_ => {
                this.logining = false
            })
        },
        //Fi自动登录
        getFiLoginInfo() {
            // 获取登录信息，登录外呼
            dataJs.getLoginInfo().then(_=>{
                if (_.result) {
                    this.callLoginForm.operator = _.result.operator
                    this.callLoginForm.mid = _.result.companyid;
                    this.callLoginForm.pwd = _.result.pwd;
                }
                this.autoInfo = _.result || {};
                this.callLogin()
            },_=>{
                this.logining = false
            })
        },
        callCentenOpLogin(){
            this.logining = true
            window['CallCenter'].opLogin(this.callLoginForm.operator,this.callLoginForm.pwd,this.callLoginForm.mid,this.autoInfo.logintype,0,'',this.autoInfo.url,this.autoInfo.client_type,this.autoInfo.server_type);
            setTimeout(_=>{
                this.logining = false
            },100)
            localStorage.setItem('Call_operator',this.callLoginForm.operator )
            localStorage.setItem('Call_pwd',this.callLoginForm.pwd )
            localStorage.setItem('Call_mid',this.callLoginForm.mid )
        },
        getHash() {
            let hash = location.hash;
            if (hash && hash.length) {
                hash = hash.substring(1,hash.indexOf('-'))
            }
            return hash;
        },
        ...Vuex.mapMutations({
            setIsLogin: 'SET_RONGLIAN_CALLISLOGIN',
            setRongLianCallData: 'SET_RONGLIAN_CALLDATA',
            setVxContactModel: 'SET_VX_CONTACTMODEL',
        })
    }
}

