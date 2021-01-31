const {createStore, combineReducers} = require('redux');
const reducerLocal = require('./reducers/reducerLocal')
const reducerOnline = require('./reducers/reducerOnline')
const reducerNameCheck = require('./reducers/reducerNameCheck')

const store = reducers => createStore(combineReducers({...reducers, reducerLocal, reducerOnline, reducerNameCheck}));

module.exports = store;