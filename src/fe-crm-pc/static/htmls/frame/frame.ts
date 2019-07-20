declare let Vue, $, SSPA, require,Aurora,Vuex
import * as dataJs from '../../scripts/_data'
import {dateFormat} from '../../scripts/_util'
import tianRunFrame from '../callTool/tianrun/tianrun'
import ronglianComponent from '../callTool/ronglian/ronglian'
import qingniuComponent from '../callTool/qingniu/qingniu'
import genesysComponent from '../callTool/genesys/genesys'
let _stroage=require('../../scripts/components/stroage/_stroage')

export default SSPA.createComponent('frame', {
    data: function() {
        return {
            whiteList: ['iupms-resetPassWord','resetPassWord','incol-no-login'],//无登录白名单
            userName: '',
            jobNo: '',
            account: {
                imgPath: '/fe-crm-pc/static/image/portrait.png'
            },
            roleMenu: [],//大crm的菜单,
            //系统列表
            sysNameList: {
                iprocess: 'iprocess',
                iupms: 'iupms',
                icsm: 'icsm',
                isettle: 'isettle',
                icrmreport: 'icrmreport',
                ipl: 'ipl',
                ifi: 'ifi',
                incol: 'incol',
                iquatest: 'iquatest',
                ihepaicar: 'ihepaicar',
                iarbitration: 'iarbitration',
                iphonewh: 'iphonewh',
                isms: 'isms',
                iactmodule: 'iactmodule',
            },
            frameShow: '',//frame显示项
            isShowMenu: true,//是否显示菜单
            jurisdiction: '',//电话条权限 tianrun,qingniu ronglian
            menuJurisdiction:{//菜单权限
                isIcsm: false,
                isCollection: false,
                isIfi: false,
                isActModule: false,//是否有活动中心系统的权限
            },
            tianrunLoadSataus: false,
            ronglianLoadSataus: false,
            qingniuLoadSataus: false,
            GenesysLoadSataus: false,
            oldhash: '',
            jurisdictionIcsm: null, // 客服默认是4 天润
            jurisdictionIncol: null, // 催收默认是3 G系统
            jurisdictionIfiActModule: null,//
        }
    },
    watch:{
        //监听要外呼的数据，进行分发到具体的电话
        callPhoneData:function (val) {
            if (val) {
                if (this.frameShow == this.sysNameList.icsm) {
                    if (this.jurisdiction == 'tianrun'){
                        this.setTianRunCallData(val);
                    } else if (this.jurisdiction == 'genesys') {
                        this.setGenesysCallData(val);
                    }
                }
                else if (this.frameShow == this.sysNameList.incol || this.frameShow == this.sysNameList.ifi) {
                    if (this.jurisdiction == 'qingniu'){
                        this.setQingNiuCallData(val);
                    }
                    else if (this.jurisdiction == 'ronglian') {
                        this.setRongLianCallData(val);
                    }
                    else if (this.jurisdiction == 'genesys'){
                        this.setGenesysCallData(val);
                    }
                }
                this.setCallPhoneData('');
            }
        }
    },
    computed: {
        ...Vuex.mapGetters([
            'callPhoneData',//外呼数据
        ]),
        tianRunFrameShow(){
            return this.frameShow === this.sysNameList.icsm && this.menuJurisdiction.isIcsm && this.jurisdiction=='tianrun'
        },
        ronglianComponentShow(){
            return (this.frameShow === this.sysNameList.incol || this.frameShow === this.sysNameList.ifi) && (this.menuJurisdiction.isCollection || this.menuJurisdiction.isIfi) && this.jurisdiction=='ronglian'
        },
        qingniuComponentShow(){
            return (this.frameShow === this.sysNameList.incol || this.frameShow === this.sysNameList.ifi) && (this.menuJurisdiction.isCollection || this.menuJurisdiction.isIfi) && this.jurisdiction=='qingniu'
        },
        genesysComponentShow(){
            return (this.frameShow === this.sysNameList.incol || this.frameShow === this.sysNameList.ifi || this.frameShow === this.sysNameList.icsm || this.frameShow === this.sysNameList.iactmodule) && (this.menuJurisdiction.isCollection || this.menuJurisdiction.isIfi || this.menuJurisdiction.isIcsm || this.menuJurisdiction.isActModule) && this.jurisdiction=='genesys'
        }
    },
    components: {
        tianRunFrame,
        ronglianComponent,
        qingniuComponent,
        genesysComponent
    },
    methods: {
        //菜单切换
        menuChangeEvent(hash) {
            this.frameShow = hash ? this.sysNameList[hash] : '';
            return {
                iprocess: () => {
                    console.log('---process---');
                },
                iupms: () => {
                    console.log('---platform---');
                },
                icsm: () => {
                    console.log('---customer---');
                    this.loadCallByOne();//客服系统需要判断是天润还是G系统
                },
                isettle: () => {
                    console.log('---settle---');
                },
                icrmreport: () => {
                    console.log('---crmreport---');
                },
                ipl: () => {
                    console.log('---ipl---');
                },
                ifi: () => {
                    console.log('---crmreport---');
                    this.loadCallByOne();
                },
                incol: () => {
                    console.log('---incol---');
                    this.loadCallByOne();
                },
                iquatest: () => {
                    console.log('---iquatest---');
                },
                ihepaicar:() => {
                    console.log('---ihepaicar---');
                },
                iarbitration:() => {
                    console.log('---iarbitration---');
                },
                iphonewh:() => {

                },
                isms:() => {

                },
                iactmodule: () =>{

                }
            }
        },
        SSPA_componentShow() {
            if(this.whiteList.indexOf(this.getURLHash()) == -1) {
                if(!_stroage.getItem('token')){
                    if (history.pushState) {
                        history.pushState({},'','#login');
                        location.reload()
                    } else {
                        location.href = '#login';
                        location.reload();
                    }
                }
            }

            let menu = JSON.parse(_stroage.getItem('menuList') || '[]');
            let initMenuValue = this.sysNameList[this.getHash()];
            for (let i = 0; i < menu.length; i++) {
                if (menu[i].uri == '/'+initMenuValue) {
                    menu[i]['isShow'] = true;
                } else {
                    menu[i]['isShow'] = false;
                }
                //判断有没有客服系统权限
                if (menu[i].uri == '/'+this.sysNameList.icsm) {
                    this.menuJurisdiction.isIcsm = true;
                }
                //判断有没有催收系统权限
                if (menu[i].uri == '/'+this.sysNameList.incol) {
                    this.menuJurisdiction.isCollection = true;
                }
                //判断有没有FI系统权限
                if (menu[i].uri == '/'+this.sysNameList.ifi) {
                    this.menuJurisdiction.isIfi = true;
                }
                //判断有没有活动中心系统权限
                if (menu[i].uri == '/'+this.sysNameList.iactmodule) {
                    this.menuJurisdiction.isActModule = true;
                }

            }
            this.roleMenu = menu;
            this.userName =  _stroage.getItem('userName')
            this.jobNo= _stroage.getItem('jobNo')
            // if (!this.jurisdiction || !_stroage.getItem('jurisdiction')) {
            //     this.getJurisdiction();
            // }
            let hash = this.getHash()
            if (this.jurisdictionIcsm === null && this.menuJurisdiction.isIcsm) {
                // 客服传2
                dataJs.queryCallProviderId({sign: '2'}).then(_ => {
                    this.jurisdictionIcsm = _.result
                    if (hash == this.sysNameList.icsm) {
                        this.loadCallByOne()
                    }
                })
            }
            if (this.jurisdictionIncol === null && this.menuJurisdiction.isCollection){
                 // 催收传1
                dataJs.queryCallProviderId({sign: '1'}).then(_ => {
                    this.jurisdictionIncol = _.result
                    if (hash == this.sysNameList.incol) {
                        this.loadCallByOne()
                    }
                })
            }
            if (this.jurisdictionIfiActModule === null && (this.menuJurisdiction.isIfi || this.menuJurisdiction.isActModule)){
                dataJs.queryCallProviderIdByJobNo().then( _ => {
                    this.jurisdictionIfiActModule = _.result
                    if (hash == this.sysNameList.ifi || hash == this.sysNameList.iactmodule) {
                        this.loadCallByOne()
                    }
                })
            }
            
        },
        //判断是加载青牛还是容联还是天润还是genesys
        loadCallByOne(){
            if (this.frameShow == this.sysNameList.icsm) {
                if (this.jurisdictionIcsm == 3) {
                    this.jurisdiction = 'genesys'
                    this.loadGenesysJs()
                } else {
                    this.jurisdiction = 'tianrun'; // 客服默认的是天润
                    this.loadTianRunJs();
                }
            } else if (this.frameShow == this.sysNameList.incol) {
                if (this.jurisdictionIncol == 1) {
                    this.jurisdiction = 'ronglian';
                    this.loadRongLianJs();
                } else if (this.jurisdictionIncol == 2) {
                    this.jurisdiction = 'qingniu'
                    this.loadQingNiuJs();
                } else if (this.jurisdictionIncol == 3) {
                    this.jurisdiction = 'genesys'
                    this.loadGenesysJs()
                }
            } else if (this.frameShow == this.sysNameList.ifi || this.frameShow == this.sysNameList.iactmodule) {
                if (this.jurisdictionIfiActModule == 1) {
                    this.jurisdiction = 'ronglian';
                    this.loadRongLianJs();
                } else if (this.jurisdictionIfiActModule == 2) {
                    this.jurisdiction = 'qingniu'
                    this.loadQingNiuJs();
                } else if (this.jurisdictionIfiActModule == 3) {
                    this.jurisdiction = 'genesys'
                    this.loadGenesysJs()
                }
            } else {
                this.jurisdiction = ''
            }
            this.oldhash = this.getHash()
        },
        //获取电话权限
        // getJurisdiction(){
        //     dataJs.queryCallProviderIdByJobNo().then( _ => {
        //         if(this.frameShow == this.sysNameList.ifi) {
        //             if (_.result == 2) {
        //                 this.jurisdiction = 'qingniu';
        //                 this.loadCallByOne();
        //             }
        //             else if(_.result == 1){
        //                 this.jurisdiction = 'ronglian';
        //                 this.loadCallByOne();
        //             }
        //             else {
        //                 //result 3
        //                 this.jurisdiction = 'genesys';
        //                 this.loadCallByOne();
        //             }   
        //         }
        //         _stroage.setItem('jurisdiction',_.result)
        //     },_=>{
        //         this.jurisdiction = 'genesys'; // qingniu ronglian
        //         this.loadCallByOne();
        //         _stroage.setItem('jurisdiction',1)
        //     });
        // },
        SSPA_componentReady(){
            this.bindHashChange();
            setTimeout(_=>{
                //#resetPassWord 页面不检查
                if(this.whiteList.indexOf(this.getURLHash()) == -1) {
                    dataJs.checkToken().then( _ => {});
                }
            },10)
        },

        bindHashChange() {
            //监听hash变化
            if (!('onhashchange' in window)) {
                var oldHref = location.href
                setInterval(_=> {
                    var newHref = location.href
                    if (oldHref !== newHref) {
                        oldHref = newHref
                        this.hashChange.call(window, {});
                    }
                }, 500)
            }
            else if (window.addEventListener) {
                window.addEventListener("hashchange", this.hashChange, false)
            }
            else if (window['attachEvent']) {
                window['attachEvent']("onhashchange", this.hashChange)
            }
            this.hashChange();
            //显示隐藏菜单
            $('#angle-double').unbind('click');
            $('#angle-double').click( () => {
                if (this.isShowMenu) {
                    $('.au-content .au-content-sidebar').hide(100);
                } else {
                    $('.au-content .au-content-sidebar').show(100);
                }
                this.isShowMenu = !this.isShowMenu;
            })
            if (SSPA.util.getParams('parent')==1) {
                $('.au-content .au-content-sidebar').hide(100);
                this.isShowMenu = !this.isShowMenu;
            }
        },
        getHash() {
            let hash = location.hash;
            if (hash && hash.length) {
                hash = hash.substring(1,hash.indexOf('-'))
            }
            return hash;
        },
        //url hash 改变
        hashChange() {
            let hash = this.getHash();
            if (hash in this.sysNameList) {
                this.menuChangeEvent(hash)[hash]();
            } else {
                this.frameShow = ''
            }
        },
        //登出
        logout() {
            let logout = ()=>{
                _stroage.removeItem('token');
                _stroage.removeItem('userName');
                _stroage.removeItem('userId');
                _stroage.removeItem('accountJobNo');
                location.href = '#login';
            }

            dataJs.getLogout().then(_ => {
                logout();
            },_ => {
                logout();
            })
            this.callLoginOut();
        },
        showCurrentMenuEvent(m) {
            m.isShow= !m.isShow;
            for (let i = 0; i < this.roleMenu.length; i++) {
                if (this.roleMenu[i] != m) {
                    this.roleMenu[i]['isShow'] = false;
                }
            }
        },
        getURLHash() {
            let hash = location.hash.match(/^#([^\?]*)?\??(.*)?$/) || [];
            return hash[1]
        },
        //加载青牛电话条
        loadQingNiuJs(){
            if (this.qingniuLoadSataus) {
                return;
            }
            //如果没有加载过
            if (!window['WA']){
                this.$nextTick(_=>{
                    this.$refs.qingniuComponent.callLoadinInit();
                    this.qingniuLoadSataus = true;
                })
            }
        },
        //加载容联
        loadRongLianJs(){
            if (this.ronglianLoadSataus) {
                return;
            }
            if (!window['CallCenter']){
                this.$nextTick(_=>{
                    this.$refs.ronglianComponent.callLoadinInit();
                    this.ronglianLoadSataus = true;
                })
            }
        },
        //加载tianrun
        loadTianRunJs(){
            if (this.tianrunLoadSataus) {
                return;
            }
            this.$nextTick(_=>{
                this.$refs.tianRunFrame.callLoadinInit();
                this.tianrunLoadSataus = true;
            })
        },
        //加载tianrun
        loadGenesysJs(){
            if (this.GenesysLoadSataus) {
                return;
            }
            this.$nextTick(_=>{
                this.$refs.genesysComponent.callLoadinInit();
                this.GenesysLoadSataus = true;
            })
        },
        /**
         * 话机签出
         */
        callLoginOut(){
            if (this.jurisdiction == 'qingniu'){
                this.$refs.qingniuComponent && this.$refs.qingniuComponent.callLogout();//签出
            }
            else if (this.jurisdiction == 'ronglian'){
                this.$refs.ronglianComponent && this.$refs.ronglianComponent.callLogout();//容联签出
            }
            else if (this.jurisdiction == 'genesys'){
                this.$refs.genesysComponent && this.$refs.genesysComponent.offLine();//容联签出
            }
            if (this.jurisdiction == 'tianrun' || this.menuJurisdiction.isIcsm == 'tianrun') {
                this.$refs.tianRunFrame  && this.$refs.tianRunFrame.offLineEvent();//签出
            }
        },
        ...Vuex.mapMutations({
            setTianRunCallData: 'SET_TIANRUN_CALLDATA',
            setRongLianCallData: 'SET_RONGLIAN_CALLDATA',
            setQingNiuCallData: 'SET_QINGNIU_CALLDATA',
            setGenesysCallData: 'SET_GENESYS_CALLDATA',
            setCallPhoneData: 'SET_CALL_PHONEDATA',
        })
    }
})
