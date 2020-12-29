const {SET_ROOM, SET_USERNAME, RESET_LOCAL, ADD_MESSAGE, SET_JOINING, SET_PLAYING_LOCAL} = require('../types/typesLocal')

const setRoomAction = room => {
    return {type: SET_ROOM, payload: {room}}
}
const setUsernameAction = username => {
    return {type: SET_USERNAME, payload: {username}}
}
const resetLocalAction = () => {
    return {type: RESET_LOCAL}
}
const addMessageAction = (username, text) => {
    return {type: ADD_MESSAGE, payload: {message: {username, text}}}
}
const setJoiningAction = joining => {
    return {type: SET_JOINING, payload: {joining}}
}
const setPlayingLocal = playing => {
    return {type: SET_PLAYING_LOCAL, payload: {playing}}
}
module.exports={setRoomAction, setUsernameAction, resetLocalAction, addMessageAction, setJoiningAction, setPlayingLocal}