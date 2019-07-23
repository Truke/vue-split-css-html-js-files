declare let Vue,require,SSPA
import * as dataJs from '../../scripts/_data'
import tianrunComponent from '../callTool/tianrun/tianrun'
export default SSPA.createComponent('tianRun', {
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
