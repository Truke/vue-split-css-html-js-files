import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import store from './fe-crm-pc/static/scripts/store'
window.Vue = Vue
window.FEDOG = window.FEPACK = {}
// 引入项目中的静态资源插件
require('../static/libs/font-awesome-4.7.0/css/font-awesome.min.css')
require('../static/libs/jquery/jquery-2.0.0.min.js')
require('../static/libs/laydate/laydate.js')
// 引入aurora
require('../static/libs/aurora/aurora.1.0.4.min.js')
// 引入加密文件并赋值给全局
let { JSEncrypt } = require('../static/libs/rsa/jsencrypt.min.js')
window.JSEncrypt = JSEncrypt
// 引入SSPA 有改造
const SSPA = {
  createComponent(name, options) {
    let oldMounted = options.mounted || Function
    options.mounted = function() {
      oldMounted()

      //先执行一次sspa-component-ready
      if (('SSPA_componentReady' in this) && (typeof this['SSPA_componentReady'] === 'function')) {
        this['SSPA_componentReady']()
      }

      //实例化后执行sspa-com-show
      if (('SSPA_componentShow' in this) && (typeof this['SSPA_componentShow'] === 'function')) {
        this['SSPA_componentShow']()
      }
    }

    let oldData = options.data || Function
    options.data = function() {
      let oldDataRet = oldData()
      if (!oldDataRet) {
        oldDataRet = {}
      }
      return oldDataRet
    }

    return options
  },
  getHash() {
    function getQuerysring(qstr) {
      let params = {}

      if (qstr) {
        qstr.split('&').forEach((a) => {
          let xy = a.split('=')
          params[xy[0]] = xy[1]
        })
      }

      return params
    }

    function getHash() {
      let hashInfo = location.hash.match(/^#([^\?]*)?\??(.*)?$/) || []

      var url = hashInfo[1] || ''
      var qstr = hashInfo[2] || ''

      if (url[0] == '/') {
        url = url.slice(1)
      }
      if (url.slice(-1) == '/') {
        url = url.slice(0, -1)
      }

      let params = getQuerysring(qstr)

      return { url, params }
    }
    return getHash()
  }
}
window.SSPA = SSPA
// 定义路由
import feCrmPcRouter from './fe-crm-pc/router/router.js'
import crmPlatformRouter from './crm-platform/router/router.js'
const routes = [...feCrmPcRouter, ...crmPlatformRouter]
console.log(routes)
class VueRouter {
  constructor(Vue, options) {
    this.$options = options;
    this.routeMap = {};
    this.app = new Vue({
      data: {
        current: SSPA.getHash().url
      }
    });

    this.init();
    this.createRouteMap(this.$options);
    this.initComponent(Vue);
  }

  // 初始化 hashchange
  init() {
    if (!('onhashchange' in window)) {
      var oldHref = location.href
      setInterval(function() {
        var newHref = location.href
        if (oldHref !== newHref) {
          var _oldHref = oldHref
          oldHref = newHref
          hashChange.call(window, {
            'type': 'hashchange',
            'newURL': newHref,
            'oldURL': _oldHref
          });
        }
      }, 100)
    } else if (window.addEventListener) {
      window.addEventListener('load', this.onHashChange.bind(this), false);
      window.addEventListener('hashchange', this.onHashChange.bind(this), false);
    } else if (window['attachEvent']) {
      window['attachEvent']("onload", this.onHashChange.bind(this))
      window['attachEvent']("onhashchange", this.onHashChange.bind(this))
    }

  }

  // 创建路由映射表
  createRouteMap(options) {
    options
      .routes
      .forEach(item => {
        this.routeMap[item.path] = item.component;
      });
  }

  // 注册组件
  initComponent(Vue) {
    Vue.component('router-link', {
      props: {
        to: String
      },
      template: '<a :href="to"><slot></slot></a>'
    });

    const _this = this;
    Vue.component('router-view', {
      render(h) {
        var component = _this.routeMap[(_this.app.current && _this.app.current !== 'login') ? 'frame' : 'login'];
        return h(component);
      }
    });
    Vue.component('router-view-children', {
      render(h) {
        var component = _this.routeMap[_this.app.current];
        return h(component);
      }
    });
  }

  // 设置当前路径
  onHashChange() {
    let path = SSPA.getHash().url
    if (localStorage.getItem('token')) {
      if (path === "login" || routes.find(v => path === v.path) === undefined) {
        location.href = '#default'
        return
      }
    } else {
      if (path !== "login") {
        location.href = '#login'
        return
      }
    }
    this.app.current = path || 'login';
  }
}

const router = new VueRouter(Vue, {
  routes
})

Vue.config.productionTip = false
Vue.config.devtool = true
/* eslint-disable no-new */
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
