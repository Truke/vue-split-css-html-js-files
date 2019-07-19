//检查是否引入了vue和jquery

if ( (typeof Vue === 'undefined') || (typeof jQuery === 'undefined') ){
    throw('SSPA_ERROR: 必须依赖Vue和jQuery!')
}

const SSPA = function (){
    //收集所有容器id
    const containers = {}

    //收集所有vue实例
    const vues = {}

    //存储所有由createComponent所生成的组件配置
    const componentOptions = {}

    //路由配置
    let URL_ROUTER_CONF = {}

    Vue.component('sspa-view', {
        props: ['id'],
        template: '<keep-alive><component :is="id"></component></keep-alive>'
    })
    Vue.component('sspa-loading', {
        template: '<div style="text-align:center;line-height:100px;">Loading...</div>'
    })

    //记录所有组件状态
    let componentPromise = {}

    //记录所有显示的组件
    let showComponents = {}

    //收集所有容器id
    function collectContainers(){
        for (name in URL_ROUTER_CONF.components)(
            void function (_name){
                let componentConf = URL_ROUTER_CONF.components[_name]
                containers[componentConf.container] = ''
            }(name)
        )
    }

    //下载并注册一个组件
    function registerComponent(name){
        if (name in componentPromise){
            return componentPromise[name]
        }

        componentPromise[name] = new Promise(function (resolve, reject){
            let path = URL_ROUTER_CONF.components[name].path

            // setTimeout(function (){
            $.get(path).done(function (source){
                $('<div/>').html(source).appendTo($('body'))

                Vue.component(name, componentOptions[name])
                componentPromise[name].promiseStatus = 'resolved'
                resolve()
            })
            // }, 500)

        })

        return componentPromise[name]
    }

    //通过hash来触发渲染
    function renderByHash(){
        let page = getHash().url
        let components = URL_ROUTER_CONF.pages[page]

        if (typeof components === 'undefined'){

            if (window.localStorage) {
                if (!localStorage.getItem('token')) {
                    if (history.pushState) {
                        history.pushState({},'','#login');
                        location.reload()
                    } else {
                        location.href = '#login';
                        location.reload();
                    }
                    return false;
                }
                if (!localStorage.getItem('isreload')) {
                    localStorage.setItem('isreload', 1);
                    window.location.reload();
                    return false;
                }
            }
            var isConfirm = confirm("页面错误,页面将自动跳到首页!")
            if (isConfirm || !isConfirm) {
                console.log('页面错误,页面将自动跳到首页!');
                if (history.pushState) {
                    history.pushState({},'','#default');
                    location.reload()
                } else {
                    location.href = '#default';
                    location.reload();
                }
                return false;
            }
            return false
        }
        if (window.localStorage) {
            localStorage.removeItem('isreload');
        }

        //hide本次components中没有的组件
        components.forEach(compName => {
            if (compName in showComponents){
            delete showComponents[compName]
        }
    })
        for (compName in showComponents){
            if ('SSPA_componentHide' in vues[compName]){
                vues[compName].SSPA_componentHide()
            }
        }
        showComponents = {}

        //show本次components里的组件
        components.forEach(compName => {
            let container = URL_ROUTER_CONF.components[compName].container

            //设置所有vue实例的component容器值
            for (name in vues){

            let promise = registerComponent(compName).then(_=>{
                    vues[name].SSPA_containers[container] = compName
                })
            if (promise.promiseStatus !== 'resolved'){
                vues[name].SSPA_containers[container] = 'sspa-loading'
            }
        }

        //触发compName对应的vue实例的SSPA_componentShow方法
        if( (compName in vues) && ('SSPA_componentShow' in vues[compName]) ){
            vues[compName].SSPA_componentShow()
            showComponents[compName] = true
        }
    })
    }

    //创造vue实例
    function createVue(options){
        let oldMounted = options.mounted || Function
        options.mounted = function (){
            oldMounted()
            vues['root'] = this
        }

        if (!options.data){
            options.data = {}
        }
        options.data['SSPA_containers'] = containers

        new Vue(options)
    }

    //创造vue组件
    function createComponent(name, options){
        //处理各个系统注册组件时加上前缀来对应路由里加了前缀 index.ts
        let hashInfo = location.hash.match(/^#([^\?]*)?\??(.*)?$/) || [];
        if (hashInfo[1] && hashInfo[1].split('-').length>1 && name!='frame') {
            var hash = location.hash.split('-')[0].replace('#','');
            name = hash ? (hash + '_' + name): name;
        }

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
                showComponents[name] = true
            }

            //保存引用
            vues[name] = this
        }

        let oldData = options.data || Function
        options.data = function (){
            let oldDataRet = oldData()
            if (!oldDataRet){
                oldDataRet = {}
            }
            oldDataRet['SSPA_containers'] = containers
            return oldDataRet
        }

        componentOptions[name] = options
    }

    //修正hashchange事件
    function registerHashChange(hashChange) {
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
        }
        else if (window.addEventListener) {
            window.addEventListener("hashchange", hashChange, false)
        }
        else if (window['attachEvent']) {
            window['attachEvent']("onhashchange", hashChange)
        }
    }

    function getQuerysring(qstr){
        let params = {}

        if (qstr) {
            qstr.split('&').forEach((a) => {
                let xy = a.split('=')
                params[xy[0]] = xy[1]
            })
        }

        return params
    }

    function getHash(){
        let hashInfo = location.hash.match(/^#([^\?]*)?\??(.*)?$/) || []

        var url = hashInfo[1] || ''
        var qstr = hashInfo[2] || ''

        if (url[0] == '/') {
            url = url.slice(1)
        }
        if (url.slice(-1) == '/') {
            url = url.slice(0, -1)
        }

        // 检查是否有url rewrite
        URL_ROUTER_CONF.urlRewrite.forEach((rule) => {
            let {_from, _to} = rule
            let fromType = Object.prototype.toString.call(_from).slice(8, -1)

            if (fromType === 'String') {
            if (_from === url) {
                url = _to
            }
        }
    else if (fromType === 'RegExp') {
            let matchObj = url.match(_from)
            if (matchObj) {
                let toUrl = _to.replace(/\$(\d+)/g, function(a, b) {
                    return matchObj[b]
                })

                let i = toUrl.indexOf('?')
                if (i != -1) {
                    url = toUrl.slice(0, i)

                    if (qstr) {
                        qstr += '&'
                    }
                    qstr += toUrl.slice(i + 1)
                }
            }
        }

    })

        let params = getQuerysring(qstr)

        return { url, params }
    }

    //监听hash变化
    registerHashChange(function (){
        renderByHash()
    })

    //初始化
    function init(routerConf, vueConf){
        URL_ROUTER_CONF = routerConf

        collectContainers()
        createVue(vueConf)
        renderByHash()
    }

    return {
        createComponent: createComponent,
        getHash: getHash,
        init: init
    }
}()

this.SSPA = SSPA