import {
    SET_DATA
} from "../types/typesData";

export const setDataAction = data => {
    return {type: SET_DATA, payload: {data}}
}