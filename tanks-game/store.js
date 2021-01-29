const {createStore, combineReducers} = require('redux');
const reducerLocal = require('./reducers/reducerLocal')
const reducerOnline = require('./reducers/reducerOnline')

const store = reducers => createStore(combineReducers({reducerLocal, reducerOnline, ...reducers}));

module.exports = store;