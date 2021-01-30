import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';
import {createStore, combineReducers} from "redux";
import {Provider} from 'react-redux'
import reducerData from "./reducers/reducerData";

const store = createStore(combineReducers({reducerData}))

const render = () => ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
        <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
render()
store.subscribe(render)