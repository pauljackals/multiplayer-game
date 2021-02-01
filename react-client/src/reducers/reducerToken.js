import {
    SET_TOKEN
} from "../types/typesToken";

const reducerToken = (state='', action) => {
    switch (action.type) {
        case SET_TOKEN: {
            return action.payload.token

        } default: {
            return state
        }
    }
}
export default reducerToken