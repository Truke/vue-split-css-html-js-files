declare let Vue,require,SSPA
import * as dataJs from '../../scripts/_data'
import tianrunComponent from '../callTool/tianrun/tianrun'
SSPA.createComponent('tianRun', {
    template: '#tianRun-template',
    data: () => ({

    }),
    components: {
        tianrunComponent
    },
    methods: {
        SSPA_componentReady(){
            this.$nextTick(_=>{
                this.$refs.tianrunComponent.callLoadinInit();
            })
        }
    }
})
