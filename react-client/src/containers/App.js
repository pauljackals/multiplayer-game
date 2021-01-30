import {connect} from 'react-redux'
import {
    setDataAction,
    setUserAction
} from "../actions/actionsData";
import Start from "./Start";
import Game from "./Game";

const App = ({user, data, setUser, setData}) => {
  return (
    <div className="App">
      <h1>TANKS</h1>
        {
            !user.length ?
                <Start setUser={setUser} setData={setData}/> :
                <Game data={data} setData={setData} user={user}/>
        }
    </div>
  );
}

const mapStateToProps = state => {
    return {
        user: state.reducerData.user,
        data: state.reducerData.data
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setUser: user => {
            dispatch(setUserAction(user))
        },
        setData: data => {
            dispatch(setDataAction(data))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);