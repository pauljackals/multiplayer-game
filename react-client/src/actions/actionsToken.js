import {
    SET_TOKEN,
    SET_TOKEN_NOTIFICATION
} from "../types/typesToken";

export const setTokenAction = token => {
    return {type: SET_TOKEN, payload: {token}}
}
export const setTokenNotificationAction = on => {
    return {type: SET_TOKEN_NOTIFICATION, payload: {on}}
}