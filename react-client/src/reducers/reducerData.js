import {
    SET_DATA,
    SET_USER
} from "../types/typesData";

const reducerData = (state={data: {}, user: ''}, action) => {
    switch (action.type) {
        case SET_DATA: {
            return {...state, data: action.payload.data}

        } case SET_USER: {
            return {...state, user: action.payload.user}

        } default: {
            return state
        }
    }
}
export default reducerData