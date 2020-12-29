const {ADD_USER, REMOVE_USER, RESET_ONLINE, SET_PLAYING_ONLINE} = require('../types/typesOnline')

const addUserAction = user => {
    return {type: ADD_USER, payload: {user}}
}
const removeUserAction = username => {
    return {type: REMOVE_USER, payload: {username}}
}
const resetOnlineAction = () => {
    return {type: RESET_ONLINE}
}
const setPlayingOnline = (playing, username) => {
    return {type: SET_PLAYING_ONLINE, payload: {playing, username}}
}
module.exports={addUserAction, removeUserAction, resetOnlineAction, setPlayingOnline}