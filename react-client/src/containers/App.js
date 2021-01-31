import {connect} from 'react-redux'
import {
    setDataAction
} from "../actions/actionsData";
import Start from "./Start";
import Game from "./Game";
import '../styles/App.css'

const App = ({data, setData}) => {
  return (
    <div className="App">
      <h1>TANKS</h1>
        {
            !Object.keys(data).length ?
                <Start setData={setData}/> :
                <Game data={data} setData={setData}/>
        }
    </div>
  );
}

const mapStateToProps = state => {
    return {
        data: state.reducerData
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setData: data => {
            dispatch(setDataAction(data))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);