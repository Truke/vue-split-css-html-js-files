import * as actions from './actions'
import getters from './getters'
import state from './state'
import mutations from './mutations'

const debug = '@{FEPACK.ENV}' !== 'ONLINE';

export default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  strict: debug,
})