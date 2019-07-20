// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
console.log(Vuex)
window.Vue = Vue
window.Vuex = Vuex
Vue.use(Vuex)
// import $ from 'jquery'
import VueRouter from 'vue-router'

const store = require('./fe-crm-pc/static/scripts/store')
// 引入项目中的静态资源插件
require('../static/libs/jquery/jquery-2.0.0.min.js')
require('../static/libs/laydate/laydate.js')
// 引入aurora
require('../static/libs/aurora/aurora.2.0.0.min.js')
// 引入加密文件并赋值给全局
let { JSEncrypt } = require('../static/libs/rsa/jsencrypt.min.js')
window.JSEncrypt = JSEncrypt
// 引入SSPA 有改造
// const SSPA = require('../static/libs/sspa-vue.js')
const SSPA = {
  createComponent(name, options){
    let oldMounted = options.mounted || Function
    options.mounted = function (){
        oldMounted()

        //先执行一次sspa-component-ready
        if ( ('SSPA_componentReady' in this) && (typeof this['SSPA_componentReady'] === 'function') ){
            this['SSPA_componentReady']()
        }

        //实例化后执行sspa-com-show
        if ( ('SSPA_componentShow' in this) && (typeof this['SSPA_componentShow'] === 'function') ){
            this['SSPA_componentShow']()
        }
    }

    let oldData = options.data || Function
    options.data = function (){
        let oldDataRet = oldData()
        if (!oldDataRet){
            oldDataRet = {}
        }
        return oldDataRet
    }

    return options
  },

}
window.SSPA = SSPA

Vue.use(VueRouter)
const asyncRoutes = [
  {
    path: 'default',
    component: () => import('./fe-crm-pc/static/htmls/default/default.vue')
  }
]
const routes = [{
  path: '/login',
  component: () => import('./fe-crm-pc/static/htmls/login/login.vue')
},{
  path: '/',
  component: () => import('./fe-crm-pc/static/htmls/frame/frame.vue'),
  redirect: 'default',
  children: asyncRoutes
}]

const router = new VueRouter({
  routes
})
const whiteList = ["/login"]
// router.beforeEach((to, from, next) => {
//   if (localStorage.getItem('token')) {
//     if (to.path === "/#login") {
//       next({
//         path: "/#default"
//       });
//     } else if (asyncRoutes.find(v => to.path === v.path) === undefined){
//       next({
//         path: "/#default"
//       });
//     } else {
//       next()
//     }
//   } else {
//     if (whiteList.indexOf(to.path) !== -1) {
//       // 在免登录白名单，直接进入
//       next();
//     } else if (to.path === "/#login") {
//       localStorage.clear()
//     } else {
//       next({
//         path: '/#login'
//       })
//     }
//   }
// });
// FastClick.attach(document.body)

Vue.config.productionTip = false
Vue.config.devtool = true
/* eslint-disable no-new */
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
