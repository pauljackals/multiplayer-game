const {createStore, combineReducers} = require('redux');
const reducerLocal = require('./reducers/reducerLocal')
const reducerOnline = require('./reducers/reducerOnline')
// const reducerExtra = require('../client-console/reducers/reducerExtra')

// const store = createStore(combineReducers({reducerLocal, reducerOnline, reducerExtra}));
const store = reducers => createStore(combineReducers({reducerLocal, reducerOnline, ...reducers}));

module.exports = store;