const {SET_ROOM, SET_USERNAME, RESET_LOCAL} = require('../types/typesLocal')

const setRoomAction = (room) => {
    return {type: SET_ROOM, payload: {room}}
}
const setUsernameAction = (username) => {
    return {type: SET_USERNAME, payload: {username}}
}
const resetLocalAction = () => {
    return {type: RESET_LOCAL}
}
module.exports={setRoomAction, setUsernameAction, resetLocalAction}