import {
    SET_TOKEN
} from "../types/typesToken";

export const setTokenAction = token => {
    return {type: SET_TOKEN, payload: {token}}
}