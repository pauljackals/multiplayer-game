import {connect} from 'react-redux'
import {
    setDataAction
} from "../actions/actionsData";
import {
    setTokenAction
} from "../actions/actionsToken";
import Start from "./Start";
import Game from "./Game";
import '../styles/App.css'

const App = ({data, token, setData, setToken}) => {
  return (
    <div className="App">
      <h1>TANKS</h1>
        {
            !Object.keys(data).length ?
                <Start setData={setData} setToken={setToken}/> :
                <Game data={data} setData={setData} token={token}/>
        }
    </div>
  );
}

const mapStateToProps = state => {
    return {
        data: state.reducerData,
        token: state.reducerToken
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setData: data => {
            dispatch(setDataAction(data))
        },
        setToken: token => {
            dispatch(setTokenAction(token))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);