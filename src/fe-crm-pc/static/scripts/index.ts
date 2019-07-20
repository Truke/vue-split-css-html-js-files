declare let require,$
import store from './store'

;((_)=>{

    //- fepack直接copy第三方插件CallCenter需要给静态资源域名（车贷后、车反欺诈、催收）
    window['sourcePath'] = '@{FEPACK.STATIC_URL}'

    let STATIC_PATH = '@{FEPACK.STATIC_URL}/fe-crm-pc'

    let ROUTER_LIST = {};
    //根据菜单项取出对应的路由
    ['iprocess','iupms','icsm','isettle','icrmreport','ipl','ifi','incol','ilaw','iquatest','ihepaicar','iarbitration','iphonewh','isms','iactmodule' ].forEach(uri => {
        let router = window[uri + '_Router'];
        if (!router) {
            return
        }
        let _router = {
            components: {},
            pages: {}
        }
        //给每个系统的路由加前缀，在sspa-vue.js-createComponent方法注册的时候也加上
        for (let item in router.components) {
            _router.components[uri + '_' + item] = router.components[item];
        }
        for (let item in router.pages) {
            let v = router.pages[item];
            if (v.length == 1) {
                v[0] = uri+'_'+v[0];
            }
            else if (v.length == 2) {
                if (v[1]) {
                    v[1] = uri+'_'+v[1];
                } else {
                    v[0] = uri+'_'+v[0];
                }
            }
            _router.pages[item] = v;
        }
        ROUTER_LIST[uri] = _router;
    })

    let ROUTER_MAIN = {
        components: {
            frame: {
                path: `${STATIC_PATH}/static/htmls/frame/frame@{FEPACK.htmlVersion}.html`,
                container: 'body'
            },
            default: {
                path: `${STATIC_PATH}/static/htmls/default/default@{FEPACK.htmlVersion}.html`,
                container: 'contentWrapper'
            },
            login: {
                path: `${STATIC_PATH}/static/htmls/login/login@{FEPACK.htmlVersion}.html`,
                container: 'body'
            },
            tianRun: {
                path: `${STATIC_PATH}/static/htmls/tianRun/tianRun@{FEPACK.htmlVersion}.html`,
                container: 'contentWrapper'
            },
            feError: {
                path: `${STATIC_PATH}/static/htmls/feError/feError@{FEPACK.htmlVersion}.html`,
                container: 'contentWrapper'
            },
        },
        pages: {
            'login': ['login',],
            'default': ['frame', 'default'],
            'tianRun': ['frame', 'tianRun'],
            'feError': ['frame', 'feError'],
        },

    };
    let SSPA_URL_ROUTER_CONF = {
        components: {},
        pages: {},
        urlRewrite: [
            {
                _from: '',
                _to: 'default'
            }
        ]
    }
    //合并路由
    for (let item in ROUTER_LIST) {
        $.extend(SSPA_URL_ROUTER_CONF.components,ROUTER_LIST[item]['components']);
        $.extend(SSPA_URL_ROUTER_CONF.pages,ROUTER_LIST[item]['pages']);
    }
    $.extend(SSPA_URL_ROUTER_CONF.components,ROUTER_MAIN.components);
    $.extend(SSPA_URL_ROUTER_CONF.pages,ROUTER_MAIN.pages);

    SSPA.init(SSPA_URL_ROUTER_CONF, {
        el: '#app',
        store,
        data: {}
    })
    console.log(SSPA_URL_ROUTER_CONF);
})(this)
