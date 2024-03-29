export default {
	callState: state => state.callState,
	incomingPhone: state => state.incomingPhone,
    callSourceType: state => state.callSourceType,
    connectId: state => state.connectId,
    incomingIdCardNo: state => state.incomingIdCardNo,
    customerName: state => state.customerName,
    oldWithholdStatus: state => state.oldWithholdStatus,
    newWithholdStatus: state => state.newWithholdStatus,
    tabModel: state => state.tabModel,
    callLoginType: state => state.callLoginType,
    tianrunCallIsLogin: state => state.tianrunCallIsLogin,
    qingniuCallIsLogin: state => state.qingniuCallIsLogin,
    genesysCallIsLogin: state => state.genesysCallIsLogin,
    ronglianCallIsLogin: state => state.ronglianCallIsLogin,
    callPhoneData: state => state.callPhoneData,
    tianrunCallData: state => state.tianrunCallData,
	qingniuCallData: state => state.qingniuCallData,
	ronglianCallData: state => state.ronglianCallData,
	genesysCallData: state => state.genesysCallData,
    vxContactModel: state => state.vxContactModel,
	phoneBlacklist: state => state.phoneBlacklist,
    ncolInfo: state => state.ncolInfo
}