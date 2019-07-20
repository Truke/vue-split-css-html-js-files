declare let Vue,require
import * as dataJs from '../../scripts/_data'
let _stroage=require('../../scripts/components/stroage/_stroage')
export default SSPA.createComponent('default', {
    data: () => ({

    }),
    methods: {
        SSPA_componentReady(){
            if(!_stroage.getItem('token')){
                location.href = '#login';
            }
            //token验证
            dataJs.checkToken().then( _ => {});
        }
    }
})
