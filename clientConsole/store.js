const {createStore, combineReducers} = require('redux');
const reducerLocal = require('./reducers/reducerLocal')
const reducerOnline = require('./reducers/reducerOnline')

const store = createStore(combineReducers({reducerLocal, reducerOnline}));

module.exports = store;