
export default [
  {
    path: "default",
    component: () => import('@/fe-crm-pc/static/htmls/default/default.vue')
  },{
    path: "feError",
    component: () => import('@/fe-crm-pc/static/htmls/feError/feError.vue')
  },{
    path: "frame",
    component: () => import('@/fe-crm-pc/static/htmls/frame/frame.vue')
  },{
    path: "login",
    component: () => import('@/fe-crm-pc/static/htmls/login/login.vue')
  },{
    path: "tianRun",
    component: () => import('@/fe-crm-pc/static/htmls/tianRun/tianRun.vue')
  },{
    path: "genesys",
    component: () => import('@/fe-crm-pc/static/htmls/callTool/genesys/genesys.vue')
  },{
    path: "qingniu",
    component: () => import('@/fe-crm-pc/static/htmls/callTool/qingniu/qingniu.vue')
  },{
    path: "ronglian",
    component: () => import('@/fe-crm-pc/static/htmls/callTool/ronglian/ronglian.vue')
  },{
    path: "tianrun",
    component: () => import('@/fe-crm-pc/static/htmls/callTool/tianrun/tianrun.vue')
  }
]