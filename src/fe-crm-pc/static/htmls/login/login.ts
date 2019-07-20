declare let Vue, $, SSPA, swal, require, Aurora
import * as dataJs from '../../scripts/_data'
import RSA from '../../scripts/components/RSA/_rsaEncrypted.js'
let _stroage=require('../../scripts/components/stroage/_stroage')

export default SSPA.createComponent('login', {
    data: () => ({
        login: {
            jobNo: '',
            password: '',
            msgVerifyCode: ''
        },
        codeModel: {
            verifyCode: '',
            jobNo: '',
        },
        verifyCodeImg: '',
        isShow: false,
        isDisabled: false,
        rules: {
            jobNo: [{
                required: true,
                message: '请输入邮箱或员工编号'
            }],
            password: [{
                required: true,
                message: '请输入密码'
            }],
        },
        isIntranetIp: false,//是内网还是外网
        isSMSDisabled: false,
        codeText: '获取验证码',
    }),
    methods: {
        setTimeText() {
            this.isSMSDisabled = true;
            let timeout = setInterval( _ =>{
                if (+localStorage.getItem('smsCodeTime') < 1) {
                    this.codeText = '获取验证码';
                    clearInterval(timeout);
                    this.isSMSDisabled= false;
                    localStorage.removeItem('smsCodeTime');
                    return;
                }
                let time = +localStorage.getItem('smsCodeTime') - 1;
                localStorage.setItem('smsCodeTime',time+'');
                this.codeText = time + 'S';
            },1000)
        },
        getSmsCode() {
            if (!this.login.jobNo) {
                Aurora.danger('请输入用户名');
                return;
            }
            if (!this.login.password) {
                Aurora.danger('请输入密码');
                return;
            }
            let pwd = ''
            try{
                pwd = RSA.rsaEncrypted(this.login.password);
            }catch (e){
                location.reload();
            }

            this.codeText = '正在获取..'
            this.isSMSDisabled = true;
            dataJs.getMsgVerifyCode({
                jobNo: this.login.jobNo,
                password:pwd,
            }).then( _ => {
                if (!_.success) {
                    this.codeText = '获取验证码';
                    this.isSMSDisabled = false;
                    return;
                }
                localStorage.setItem('smsCodeTime','60');
                this.setTimeText();
                Aurora.success('验证码已发送'+_.result+'请查收');
            },_=>{
                this.codeText = '获取验证码';
                this.isSMSDisabled = false;
            })
        },
        refreshCode() {
            this.verifyCodeImg = dataJs.verifyCode() + '?t='+new Date().getTime();
        },
        //忘记密码
        resetPwEvent() {
            this.refreshCode();
            this.codeModel.verifyCode = '';
            this.isShow = true;
        },
        sendEmail() {
            this.isDisabled = true;
            dataJs.sendEmail({
                verifyCode: this.codeModel.verifyCode,
                jobNo: this.codeModel.jobNo,
            }).then( _ => {
                this.isDisabled = false;
                if(_.success) {
                    this.isShow = false;
                    Aurora.success('已发送重置链接到邮箱:'+_.result+'请登录邮箱查看');
                } else {
                    this.codeModel.verifyCode = '';
                    this.refreshCode();
                }
            },_=>{
                this.isDisabled = false;
            })
        },
        getIsIntranetIp() {
            dataJs.isIntranetIp().then( _ => {
                if (!_.success) {
                    return;
                }
                this.isIntranetIp = !_.result;
                if (this.isIntranetIp && +localStorage.getItem('smsCodeTime') > 1) {
                    this.setTimeText();
                }
            },_=>{
            })
        },
        subLogin: function() {

            let pwd = RSA.rsaEncrypted(this.login.password);

            dataJs.getLogin({
                jobNo:this.login.jobNo,
                password:pwd,
                msgVerifyCode: this.login.msgVerifyCode
            }).then( _ => {
                if(_.success) {
                    if (!_.result) {
                        Aurora.danger('登录失败');
                        return;
                    }
                    //第一次登录需要去修改密码
                    _stroage.setItem('token', _.result.token);
                    _stroage.setItem('userName', _.result.employee.name);
                    _stroage.setItem('jobNo',_.result.employee.jobNo);
                    _stroage.setItem('userId',_.result.employee.id);
                    _stroage.setItem('permissionList',JSON.stringify(_.result.permissionList))
                    _stroage.setItem('menuList',JSON.stringify(_.result.menuList) );
                    _stroage.setItem('roleList', JSON.stringify(_.result.roleList));

                    // if (_.result.employee.needChangePwd) {
                    //     location.href = "#iupms-resetPassWord?token="+_.result.token+'&istoken=1';
                    //     return;
                    // }
                    location.href = "#default";

                    // let requestUrl = SSPA.util.getParams('requestUrl');
                    // if (requestUrl) {
                    //     location.href = requestUrl;
                    // } else {
                    //     location.href = "#default";
                    // }
                }
            })
        },

        SSPA_componentShow: function() {
            this.login.jobNo = '';
            this.login.password = '';
            _stroage.removeItem('jurisdiction')
        },
        SSPA_componentReady: function() {
            this.getIsIntranetIp();
        }
    }
})