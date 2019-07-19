export default {
    MENU: [{
        "icon": "",
        "id": 2,
        "name": "员工系统",
        "sort": 0,
        "subMenu": [{"icon": "", "id": 1, "name": "人员管理", "sort": 1, "subMenu": [], "uri": "#platform-staff"}, {
            "icon": "",
            "id": 3,
            "name": "角色管理",
            "sort": 2,
            "subMenu": [],
            "uri": "#platform-roles"
        }, {"icon": "", "id": 4, "name": "技能组", "sort": 3, "subMenu": [], "uri": "#platform-skills"}, {
            "icon": "",
            "id": 48,
            "name": "权限管理",
            "sort": 5,
            "subMenu": [],
            "uri": "#platform-permission"
        }],
        "uri": "/iupms#default"
    }, {
        "icon": "",
        "id": 17,
        "name": "工单系统",
        "sort": 0,
        "subMenu": [{
            "icon": "home",
            "id": 18,
            "name": "首页",
            "sort": 0,
            "subMenu": [],
            "uri": "#process-default"
        }, {
            "icon": "life-ring",
            "id": 19,
            "name": "使用工单",
            "sort": 0,
            "subMenu": [{
                "icon": "cube",
                "id": 21,
                "name": "任务管理",
                "sort": 0,
                "subMenu": [],
                "uri": "#process-taskManagement"
            }, {"icon": "", "id": 28, "name": "使用工单", "sort": 2, "subMenu": [], "uri": "#process-bizEntry"}],
            "uri": ""
        }, {
            "icon": "user",
            "id": 29,
            "name": "系统配置",
            "sort": 2,
            "subMenu": [{
                "icon": "",
                "id": 30,
                "name": "流程管理员",
                "sort": 2,
                "subMenu": [],
                "uri": "#process-processManager"
            }, {"icon": "", "id": 31, "name": "代理人设置", "sort": 2, "subMenu": [], "uri": "#process-agentList"}, {
                "icon": "",
                "id": 32,
                "name": "流程发起权限",
                "sort": 5,
                "subMenu": [],
                "uri": "#process-processInitiator"
            }, {"icon": "", "id": 33, "name": "类别管理", "sort": 5, "subMenu": [], "uri": "#process-processGrouping"}],
            "uri": ""
        }, {
            "icon": "sitemap",
            "id": 22,
            "name": "流程设计",
            "sort": 3,
            "subMenu": [{
                "icon": "",
                "id": 108,
                "name": "表单操作项配置",
                "sort": 1,
                "subMenu": [],
                "uri": "#process-processBtnConfig"
            }, {
                "icon": "",
                "id": 111,
                "name": "操作项管理",
                "sort": 1,
                "subMenu": [],
                "uri": "#process-processBtnConfig"
            }, {
                "icon": "",
                "id": 24,
                "name": "流程图设计",
                "sort": 4,
                "subMenu": [],
                "uri": "#process-manageTempDeploy"
            }, {"icon": "", "id": 25, "name": "变量配置", "sort": 5, "subMenu": [], "uri": "#process-processAdd"}, {
                "icon": "",
                "id": 26,
                "name": "流程配置",
                "sort": 6,
                "subMenu": [],
                "uri": "#process-processNodeConfig"
            }, {"icon": "", "id": 27, "name": "流程版本", "sort": 7, "subMenu": [], "uri": "#process-processVersion"}],
            "uri": ""
        }],
        "uri": "/iprocess#default"
    }, {
        "icon": "",
        "id": 53,
        "name": "催收系统",
        "sort": 0,
        "subMenu": [{
            "icon": "",
            "id": 81,
            "name": "参数管理",
            "sort": 2,
            "subMenu": [{
                "icon": "",
                "id": 85,
                "name": "入催条件",
                "sort": 1,
                "subMenu": [],
                "uri": "#collection-condition"
            }, {"icon": "", "id": 86, "name": "参数配置", "sort": 1, "subMenu": [], "uri": "#config-arg"}, {
                "icon": "",
                "id": 87,
                "name": "行动码",
                "sort": 1,
                "subMenu": [],
                "uri": "#action-code"
            }],
            "uri": ""
        }, {
            "icon": "",
            "id": 82,
            "name": "催收管理",
            "sort": 3,
            "subMenu": [{"icon": "", "id": 84, "name": "任务池", "sort": 1, "subMenu": [], "uri": "#tasks"}, {
                "icon": "",
                "id": 90,
                "name": "任务分配",
                "sort": 1,
                "subMenu": [],
                "uri": "#tasks-allot"
            }, {"icon": "", "id": 91, "name": "批次管理", "sort": 1, "subMenu": [], "uri": "#task-batch"}],
            "uri": ""
        }, {
            "icon": "",
            "id": 83,
            "name": "我的催收",
            "sort": 4,
            "subMenu": [{
                "icon": "",
                "id": 88,
                "name": "催收列表",
                "sort": 1,
                "subMenu": [],
                "uri": "#my-list"
            }, {"icon": "", "id": 89, "name": "客户查询", "sort": 1, "subMenu": [], "uri": "#customer-query"}],
            "uri": ""
        }, {"icon": "", "id": 112, "name": "青牛外呼", "sort": 100, "subMenu": [], "uri": "#call-tools"}],
        "uri": ""
    },
        {
        "icon": "",
        "id": 92,
        "name": "客服系统",
        "sort": 4,
        "subMenu": [{
            "icon": "",
            "id": 93,
            "name": "客户查询",
            "sort": 0,
            "subMenu": [],
            "uri": "#customer-search"
        },
            {"icon": "", "id": 94, "name": "事件导入", "sort": 1, "subMenu": [], "uri": "#customer-eventImport"}, {
            "icon": "",
            "id": 110,
            "name": "在线客服",
            "sort": 1,
            "subMenu": [],
            "uri": "#customer-sessionSearch"
        }],
        "uri": "/icsm"
    }]
}
