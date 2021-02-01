import {
    SET_TOKEN,
    SET_TOKEN_NOTIFICATION
} from "../types/typesToken";

const reducerToken = (state={token: '', notification: false}, action) => {
    switch (action.type) {
        case SET_TOKEN: {
            return {...state, token: action.payload.token}

        }case SET_TOKEN_NOTIFICATION: {
            return {...state, notification: action.payload.on}

        } default: {
            return state
        }
    }
}
export default reducerToken