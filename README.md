# fepack2webpack

### 使用部骤

``` bash
# 安装依赖
npm install

# 本地运行 然后访问localhost:8080
npm run dev

# 生产压缩打包
npm run build

# 自动生成现有路由，比如:
npm run generate src/fe-crm-pc/static/htmls/login/login.vue
# 请注意: src/fe-crm-pc/static/htmls/login/login.vue 为想要创建的路径，必须有对应的.jade和.ts

# 带统计报告打包
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
