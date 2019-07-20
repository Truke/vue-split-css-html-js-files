declare let $, Promise, Vue, require, Aurora, SSPA
let stroageHelper=require('./components/stroage/_stroage')
import {replaceGSLS} from './replace.js'


export function ajax(url, data, params={},isShowError=false){
    return new Promise(function (resolve, reject){
        try {
            params = $.extend({
                url: url,
                data,
                type: 'get',
                dataType: 'json',
                // contentType: "application/json",
                xhrFields: {
                    withCredentials: true
                },
                beforeSend:function (xhr) {
                    xhr.setRequestHeader('Authorization',stroageHelper.getItem('token'))
                    if (stroageHelper.getItem('jobNo')){
                        xhr.setRequestHeader('userId',stroageHelper.getItem('jobNo'))
                    }
                }
            }, params)

            $.ajax(params)
                .done((data, status, xhr)=>{
                    //105未登录 106没权限
                    if(!url.includes("upms/login")){
                        data = replaceGSLS(data)
                    }
                    if(data.code == 'G_0007') {
                        if(window['isReLogin']) {
                            return
                        }else{
                            setTimeout(_=> {
                                window['isReLogin'] = false;
                            }, 3000)
                            window['isReLogin'] = true;
                            Aurora.danger(data.msg || '登录超时,请重新登录');
                            localStorage.removeItem('token');
                            console.log('token失效');
                            let ENV = '@{FEPACK.ENV}';
                            if('LOCAL' != ENV) {
                                location.href = "/#login";
                                //easemob.com不跳转
                                if (parent.location.origin.indexOf('easemob.com') == -1) {
                                    parent.location.href = "/#login";
                                }
                            } else {
                                //本地环境
                                location.href = "#login";
                            }
                        }
                    }
                    else if(!data.success) {
                        if (isShowError) {
                            return;
                        }
                        Aurora.danger(data.msg);
                    }
                    resolve(data)
                })
                .fail((jqXHR, textStatus, errorThrown)=>{

                    let args = [jqXHR, textStatus, errorThrown];
                    reject(...args)
                    if (isShowError) {
                        return;
                    }
                    Aurora.danger('请求异常，请重试！');
                    console.log(args)
                })
        } catch (e) {
            console.error(e)
        }
    })
}
//客服外呼ajax
export function callAjax(url, data, params = {},isShowError=false,isShowCallError=true) {
    return new Promise(function (resolve, reject) {
        try {
            params = $.extend({
                url:  url,
                data,
                type: 'post',
                dataType: 'json',
                contentType : 'application/json',
                xhrFields: {
                    withCredentials: true
                },
            }, params)

            $.ajax(params)
                .done((data, status, xhr) => {
                    data =  replaceGSLS(data)
                    if (!isShowError) {
                        if (data.statusCode == 2) {
                            reject(data)
                            isShowCallError && Aurora.danger('Fe-话机异常，请检查话机！');
                            return;
                        }
                        if (data.statusCode != "0") {
                            reject(data)
                            Aurora.danger(data.resultMsg);
                            return;
                        }
                    }
                    resolve(data)
                })
                .fail((jqXHR, textStatus, errorThrown) => {
                    let args = [jqXHR, textStatus, errorThrown];
                    reject(...args)
                    if (!isShowError) {
                        Aurora.danger(args[2]);
                    }


                })
        } catch (e) {
            reject()
            console.error(e)
        }
    })
}
//附件列表时间格式化
export function dateFormat(date,fmt) {
    if (!date){
        return '';
    }
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

Date.prototype['format'] = Date.prototype['format'] || function (fmt) {
        if (!this.getMonth){
            return ''
        }
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
}
//附件列表时间格式化
export function fileListTimeFormate(str) {
    return str.substr(0, 8) + " " + str.substr(8, 2) + ":" + str.substr(10, 2);
}

//事件记录时间格式化
export function eventListTimeFormate(str) {
    return str.substr(0, 4) + "-" + str.substr(4, 2) + "-" + str.substr(6, 2) + ' ' + str.substr(8, 2) + ':' + str.substr(10, 2) + ':' + str.substr(12, 2);
}

// vue filter
Vue.filter('date-format', function (date){
    if(date == '' || date == undefined){
        return '----'
    }else{
        var d = new Date(date);
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + (d.getDate())).slice(-2);
        var hour = ('0' + (d.getHours())).slice(-2);
        var minutes = ('0' + (d.getMinutes())).slice(-2);
        var seconds = ('0' + (d.getSeconds())).slice(-2);
        return year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":" + seconds;
    }

})
Vue.filter('date', function (date) {
    if(date == '' || date == undefined){
        return '----'
    }else{
        var d = new Date(date);
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + (d.getDate())).slice(-2);
        return year + "-" + month + "-" + day;
    }
});
Vue.filter('dateMonth', function (date) {
    if(date == '' || date == undefined){
        return '----'
    }else{
        var d = new Date(date);
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        return year + "-" + month;
    }
});

class jsKeyPath {
    private static mergeObj(oldObj, newObj, deep = true) {
        // copy oldObj
        var obj = JSON.parse(JSON.stringify(oldObj))

        for (var key in newObj) {
            var oldType = typeof oldObj[key]
            var newType = typeof newObj[key]

            if (oldType != newType || !deep || 'object' != oldType) {
                // not same type or not deep mode or type is not object, replace
                obj[key] = newObj[key]
            } else {
                // deep mode and same type and is object, recursive merge
                obj[key] = arguments.callee(oldObj[key], newObj[key], true)
            }
        }

        return obj
    }

    public static getValue(obj: Object, keyPath: string) {
        // not an object or keyPath is empty
        if (typeof obj != 'object' || !keyPath) {
            return undefined
        }

        return keyPath.split('.').reduce((o, k) => {
            if (!o || typeof o[k] == 'undefined') {
                return undefined
            }

            return o[k]
        }, obj)
    }

    public static setValue(obj: Object, keyPath: string, value) {
        // not an object or keyPath is empty
        if (typeof obj != 'object' || !keyPath) {
            return
        }

        var [firstKey, ...otherKeys] = keyPath.split('.')
        var tempValue = value

        if (!!otherKeys.length) {
            tempValue = otherKeys.reduceRight((o, k) => {
                var tempObj = {}
                tempObj[k] = o

                return tempObj
            }, value)
        }

        if (typeof tempValue == 'object' && typeof obj[firstKey] == 'object') {
            obj[firstKey] = this.mergeObj(obj[firstKey], tempValue)
        } else {
            obj[firstKey] = tempValue
        }
    }

    public static toPlainObject(obj: Object, prefix: string = ''): Object {
        var tempObj = {}

        for (var _ in obj) {
            var key = (prefix ? prefix + '.' : '') + _,
                value = obj[_],
                type = typeof value

            if (type == 'object') {
                if (value instanceof Array) {
                    tempObj[key] = JSON.stringify(value)

                    continue
                }

                tempObj = this.mergeObj(tempObj, this.toPlainObject(value, key))
            } else {
                tempObj[key] = value
            }
        }

        return tempObj
    }
}

// SSpa util
SSPA.util = {
    toHash: function (sspaHash) {
        let params = []

        if (!$.isEmptyObject(sspaHash.params)) {
            var forceRefresh = false
            for (let k in sspaHash.params) {
                if ('_' == k) {
                    forceRefresh = true
                    continue
                }

                let v = sspaHash.params[k]
                if ('undefined' == typeof v) {
                    continue
                }

                params.push(`${k}=${encodeURIComponent(v)}`)
            }

            if (forceRefresh) {
                params.push(`_=${(+new Date)}`)
            }
        }

        if (!params.length) {
            return `#${sspaHash.url}`
        } else {
            return `#${sspaHash.url}?${params.join('&')}`
        }
    },
    getParams: function (p) {
        let obj = SSPA.getHash().params
        let params = {}

        for (let k in obj) {
            jsKeyPath.setValue(params, k, decodeURIComponent(obj[k]))
        }

        if (!!p) {
            return params[p]
        } else {
            return params
        }
    },
    changeParams: function (p, v, r = true) {
        let newParams = {}
        let forceRefresh = !!r
        if ('string' == typeof p) {
            newParams[p] = v
        } else if ('object' == typeof p) {
            newParams = p
            if (typeof v !== 'undefined') {
                forceRefresh =  !!v
            }
        }

        if (forceRefresh) {
            newParams['_'] = +new Date
        }

        let hash = SSPA.getHash()
        let params = this.getParams()

        for (let k in newParams) {
            jsKeyPath.setValue(params, k, newParams[k])
        }
        hash.params = jsKeyPath.toPlainObject(params)

        return this.toHash(hash)
    },
    isMod: function (modPatterns, modName?) {
        if (!modName) {
            modName = SSPA.getHash().url
        }

        if ('string' == typeof modPatterns) {
            modPatterns = [modPatterns]
        }

        return modPatterns.some(pattern => {
            let asteriskPos = pattern.indexOf('*')
            if (-1 == asteriskPos) {
                return pattern == modName
            } else {
                if (asteriskPos == 0) {
                    return modName.endsWith(pattern.substr(1))
                } else {
                    return modName.startsWith(pattern.substring(0, pattern.length - 1))
                }
            }
        })
    }
}