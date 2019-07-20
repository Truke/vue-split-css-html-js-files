
declare let Vue, $, SSPA, require, Aurora
import * as dataHelper from '../../scripts/_data'
import * as utilHelper from '../../scripts/_util'

SSPA.createComponent('feError', {
    template: '#feError-template',
    data: () => ({
        ListData: [],//列表数据
        loading: false,
        query: {
            sysName: '',
            beginTime: '',
            endTime: '',
            errorMsg: '',
            pageSize: 15,
            pageNum: 1,
        },
        dayCount: 0,
        pageCount: 0,
    }),
    methods: {
        pageChange(page) {
            this.query.pageNum = page;
            this.getData();
        },
        getDayNum(){
            dataHelper.feErrorDayCount().then(_ => {
               this.dayCount = _.result;
            });
        },
        getData() {
            this.loading = true;
            this.ListData = [];
            dataHelper.feErrorQueryList(this.query).then(_ => {
                this.loading = false;
                if (_.result) {
                    this.ListData = _.result.list || [];
                    this.pageCount = _.result.totalCount
                }
            }, _ => {
                this.loading = false;
            });
        },

        SSPA_componentReady() {
            this.getDayNum();
            this.getData();
        }
    }
})