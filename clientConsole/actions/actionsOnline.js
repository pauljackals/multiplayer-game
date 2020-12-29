const {ADD_USER, REMOVE_USER, RESET_ONLINE} = require('../types/typesOnline')

const addUserAction = (user) => {
    return {type: ADD_USER, payload: {user}}
}
const removeUserAction = (username) => {
    return {type: REMOVE_USER, payload: {username}}
}
const resetOnlineAction = () => {
    return {type: RESET_ONLINE}
}
module.exports={addUserAction, removeUserAction, resetOnlineAction}