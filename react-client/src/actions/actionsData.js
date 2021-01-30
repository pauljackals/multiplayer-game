import {
    SET_DATA,
    SET_USER
} from "../types/typesData";

export const setDataAction = data => {
    return {type: SET_DATA, payload: {data}}
}
export const setUserAction = user => {
    return {type: SET_USER, payload: {user}}
}