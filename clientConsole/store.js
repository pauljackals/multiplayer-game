const {createStore, combineReducers} = require('redux');
const reducerLocal = require('./reducers/reducerLocal')
const reducerOnline = require('./reducers/reducerOnline')
const reducerExtra = require('./reducers/reducerExtra')

const store = createStore(combineReducers({reducerLocal, reducerOnline, reducerExtra}));

module.exports = store;