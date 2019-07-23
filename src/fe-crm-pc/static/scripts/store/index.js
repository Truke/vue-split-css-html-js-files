import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import getters from './getters'
import state from './state'
import mutations from './mutations'
Vue.use(Vuex)
window.Vuex = Vuex
const debug = '@{FEPACK.ENV}' !== 'ONLINE';

export default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  strict: debug,
})