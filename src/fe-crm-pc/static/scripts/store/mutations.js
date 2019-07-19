import * as types from './mutation-types'

const mutations = {
    [types.SET_CALL_STATE](state, callState) {
        state.callState = callState
    },
    [types.SET_INCOMING_PHONE](state, incomingPhone) {
        state.incomingPhone = incomingPhone
    },
    [types.SET_CALL_SOURCETYPE](state, callSourceType) {
        state.callSourceType = callSourceType
    },
    [types.SET_CONNECTID](state, connectId) {
        state.connectId = connectId
    },
    [types.SET_INCOMING_IDCARDNO](state, incomingIdCardNo) {
        state.incomingIdCardNo = incomingIdCardNo
    },
    [types.SET_CUSTOMER_NAME](state, customerName) {
        state.customerName = customerName
    },
    [types.SET_NEW_WITHHOLD_STATUS](state, newWithholdStatus) {
        state.newWithholdStatus = newWithholdStatus
    },
    [types.SET_OLD_WITHHOLD_STATUS](state, oldWithholdStatus) {
        state.oldWithholdStatus = oldWithholdStatus
    },
    [types.SET_TABMODEL](state, tabModel) {
        state.tabModel = tabModel
    },
    [types.SET_CALL_LOGINTYPE](state, callLoginType) {
        state.callLoginType = callLoginType
    },
    [types.SET_TIANRUN_CALLISLOGIN](state, tianrunCallIsLogin) {
        state.tianrunCallIsLogin = tianrunCallIsLogin
    },
    [types.SET_QINGNIU_CALLISLOGIN](state, qingniuCallIsLogin) {
        state.qingniuCallIsLogin = qingniuCallIsLogin
    },
    [types.SET_RONGLIAN_CALLISLOGIN](state, ronglianCallIsLogin) {
        state.ronglianCallIsLogin = ronglianCallIsLogin
    },
    [types.SET_GENESYS_CALLISLOGIN](state, genesysCallIsLogin) {
        state.genesysCallIsLogin = genesysCallIsLogin
    },
    [types.SET_CALL_PHONEDATA](state, callPhoneData) {
        state.callPhoneData = callPhoneData
    },
    [types.SET_TIANRUN_CALLDATA](state, tianrunCallData) {
        state.tianrunCallData = tianrunCallData
    },
    [types.SET_QINGNIU_CALLDATA](state, qingniuCallData) {
        state.qingniuCallData = qingniuCallData
    },
    [types.SET_RONGLIAN_CALLDATA](state, ronglianCallData) {
        state.ronglianCallData = ronglianCallData
    },
    [types.SET_GENESYS_CALLDATA](state, genesysCallData) {
        state.genesysCallData = genesysCallData
    },
    [types.SET_VX_CONTACTMODEL](state, vxContactModel) {
        state.vxContactModel = vxContactModel
    },
    [types.SET_PHONE_BLACKLIST](state, phoneBlacklist) {
        state.phoneBlacklist = phoneBlacklist
    },
    [types.SET_NCOLINFO](state, ncolInfo) {
        state.ncolInfo = ncolInfo
    },
}

export default mutations