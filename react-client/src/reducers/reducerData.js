import {
    SET_DATA
} from "../types/typesData";

const reducerData = (state={}, action) => {
    switch (action.type) {
        case SET_DATA: {
            return action.payload.data

        } default: {
            return state
        }
    }
}
export default reducerData