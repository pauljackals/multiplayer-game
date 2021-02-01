import {connect} from 'react-redux'
import {
    setDataAction
} from "../actions/actionsData";
import {
    setTokenAction,
    setTokenNotificationAction
} from "../actions/actionsToken";
import Start from "./Start";
import Game from "./Game";
import '../styles/App.css'

const App = ({data, token, tokenNotification, setData, setToken, setTokenNotification}) => {
  return (
    <div className="App">
      <h1>TANKS</h1>
        {
            !Object.keys(data).length ?
                <Start setData={setData} setToken={setToken} setTokenNotification={setTokenNotification}/> :
                <Game data={data} setData={setData} token={token} tokenNotification={tokenNotification} setTokenNotification={setTokenNotification}/>
        }
    </div>
  );
}

const mapStateToProps = state => {
    return {
        data: state.reducerData,
        token: state.reducerToken.token,
        tokenNotification: state.reducerToken.notification
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setData: data => {
            dispatch(setDataAction(data))
        },
        setToken: token => {
            dispatch(setTokenAction(token))
        },
        setTokenNotification: on => {
            dispatch(setTokenNotificationAction(on))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);