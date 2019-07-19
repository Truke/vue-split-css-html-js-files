// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
// import FastClick from 'fastclick'
import VueRouter from 'vue-router'
import App from './App'
// import Home from './components/SplitComponentVux.vue'
// require('./fe-crm-pc/static/scripts/libs/aurora/aurora.2.0.0.min.js')

Vue.use(VueRouter)

const routes = [{
  path: '/login',
  component: () => import('./fe-crm-pc/static/htmls/login/login.vue')
}]

const router = new VueRouter({
  routes
})

// FastClick.attach(document.body)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
