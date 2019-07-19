import {ajax} from './_util.ts'

//登陆
export function getLogin(data) {
    return ajax(
        '/upms/login',
        data,
        {type:'post'}
    )
}
//退出登录
export function getLogout() {
    return ajax(
        '/upms/logout',
        {}
    )
}
// 发送短信验证码
export function getMsgVerifyCode(data={}){
    return ajax(
        '/upms/login/getMsgVerifyCode',
        data,
    )
}
export function verifyCode() {
    return '/upms/login/getImageVerifyCode'
}
export function sendEmail(data) {
    return ajax(
        '/upms/login/sendEmail',
        data
    )
}
// 内网判断GET
export function isIntranetIp(data={}){
    return ajax(
        '/upms/login/isIntranetIp',
        data,
    )
}
//会话列表
export function getConversationList(pageNum,pageSize){
    return ajax(
        '/csm/callHistory/listByJobNo',
        {pageNum:pageNum,pageSize:pageSize},
        {type:"post"},
    )
}
//保存工作状态
export function saveWorkStatus(type,extensionNo,reason=''){
    return ajax(
        '/csm/workStatus/save',
        {type:type,extensionNo:extensionNo,reason:reason},
        {type:"post"},
    )
}
//保存会话列表
export function callHistorySave(param){
    return ajax(
        '/csm/callHistory/saveNew',
        param,
        {type:"post"},
        true
    )
}
//电话条日志
export function softPhoneLog(form){
    return ajax(
        '/csm/softPhoneLog/saveLog',
        form,
        {type:"post"},
        true
    )
}
//验证token
export function checkToken() {
    return ajax(
        '/upms/sys/checkToken',
        {}
    )
}
//获取绑定的工号
export function getAccount(data){
    return ajax(
        '/upms/employee/getAccount',
        data
    )
}

//-----催收
//容联外呼，获取登录信息
export function manualcall(){
    return ajax('/ncol/s/manualcall/params',{})
}

// 保存外呼记录
export function saveRecord(data={}){
    return ajax('/ncol/s/manualcall/saveRecord',data)
}
// 记录挂机信息
export function addHangUpReason(data={}){
    return ajax('/ncol/s/autocall/addHangUpReason',data,{type: 'post'})
}
// 话务：客服、催收进线时，需要将这几个字段传给亿讯，已方便开发坐席工作量统计报表
export function addCallInInfo(data={}){
    return ajax('/tele/autoCall/addCallInInfo',data,{type: 'post'})
}

//推送青牛外呼sessionId http://172.28.3.144:8086/fs/call/pushSessionInfo
/**会话id sessionId*/;
/**会话开始时间戳 startTime*/
/**会话结束时间戳 endTime*/
export function pushSessionInfo(callId,startTime,endTime){
    return ajax(
        '/fs/call/pushSessionInfo',
        JSON.stringify({
            callId:callId,
            startTime:startTime,
            endTime:endTime,
            contentType: "text"
        }),
        {type:'post',contentType: "application/json"},
        true
    )
}

//查询用户对应的外呼id
export function queryCallProviderIdByJobNo(){
    return ajax(
        '/upms/callCenter/queryCallProviderIdByJobNo',
        {}
    )
}
export function queryCallProviderId(data={}){
    return ajax(
        '/upms/callCenter/queryCallProviderId',
        data
    )
}
/**
 * 外呼通话记录
 * @param sdkCallInfoParam {agentDn: 坐席分机号 ,agentName: 坐席姓名 ,agentNo: 坐席工号 ,agentSkill: 坐席技能组 ,
    answerTime: 应答时间(客户接起时间,call_time+ring_time) ,businessType: 业务类型(必输，col,crm,tsms,fi,approve,other) ,
    callId: 通话id(必输，外呼系统中的通话记录唯一标识,callid,sessionId等) ,callResult: 通话结果 ,
    callSystem: 外呼系统编码(必输，RongLian,TianRun,QingNiu) ,callTime: 呼叫时间(开始呼叫时间) ,
    callType: 呼叫类型(0-呼入/1-呼出) ,calledPhone: 主叫方号码(ani) ,callerPhone: 主叫方号码(ani) ,
    clientName: 客户姓名 ,connected: 是否接通(0-未接通,1-接通,计算得到,answer为null则为0) ,
    employeeName: 坐席员工姓名 ,employeeNo: 坐席员工编号 ,endReason: 通话结束原因(坐席挂机/客户挂机) ,
    endTime : 结束时间(挂机时间) ,idNo: 客户证件号码 ,talkTime: 通话时长(接通后时长,计算得到,秒s,end_time-answer_time) ,timeStmp: 数据时间(时间戳)
 * @returns {any}
 */
export function pushSdkCallInfo(form){
    return ajax(
        '/themis/web/call/pushSdkCallInfo',
        form,
        {type:'post',contentType: "application/json"},
        true
    )
}


//前端日志添加
export function feErrorAdd(form){
    return ajax(
        '/pub/feError/add',
        form,
        {type:'post',contentType: "application/json"},
        true
    )
}

//前端日志统计
export function feErrorDayCount(){
    return ajax(
        '/pub/feError/dayCount',
        {},
        {},
        true
    )
}
//前端日志统计
export function feErrorQueryList(query){
    return ajax(
        '/pub/feError/queryList',
        query,
    )
}

// 保存通话记录信息
export function saveCallRecord(data = {}) {
    return ajax(
        '/fi/phoneForFi/saveCallRecord',
        JSON.stringify(data),
        {type:'post',contentType: "application/json"},
    )
}
// fi获取容联登录信息
export function getLoginInfo(data = {}) {
    return ajax(
        '/fi/phoneForFi/getLoginInfo',
        data,
        {type:'post'},
    )
}
//来电参数配置列表接口
export function getCallConfigList(data) {
    return ajax(
        '/csm/teleInfo/listTeleInfo',
        data,
        {type:'post'},
        true
    )
}
