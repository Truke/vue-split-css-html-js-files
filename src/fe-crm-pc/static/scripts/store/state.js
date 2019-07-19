const state = {
  callState:'loggedOut',//loggedOut
  incomingPhone: '',
  callSourceType:'',
  connectId:'',
  incomingIdCardNo: '',
  customerName: {},//{'carId':'name'}
  newWithholdStatus: '',
  oldWithholdStatus: '',
  tabModel: '1',
  callLoginType: '',
  tianrunCallIsLogin: false,
  qingniuCallIsLogin: false,
  ronglianCallIsLogin: false,
  genesysCallIsLogin: false,
  callPhoneData: '',
  tianrunCallData: '',
  qingniuCallData: '',
  ronglianCallData: '',
  genesysCallData: '',
  vxContactModel: {},//{contactName:'',contactType:'',phoneType:''} ifi设置
  phoneBlacklist: [],//外呼黑名单
  ncolInfo: {},//催收信息 {clientIdno:'',refId:'',routeId:''}
}

export default state