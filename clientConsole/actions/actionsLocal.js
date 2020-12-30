const {
    SET_ROOM,
    SET_USERNAME,
    RESET_LOCAL,
    ADD_MESSAGE,
    SET_JOINING,
    SET_PLAYING_LOCAL,
    SET_TANK_LOCAL,
    SET_TANK_BOARD,
    SET_TURN_LOCAL
} = require('../types/typesLocal')

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
const setPlayingLocalAction = playing => {
    return {type: SET_PLAYING_LOCAL, payload: {playing}}
}
const setTankLocalAction = (row, column, rotation) => {
    return {type: SET_TANK_LOCAL, payload: {row, column, rotation}}
}
const setTankBoardAction = (row, column, username) => {
    return {type: SET_TANK_BOARD, payload: {row, column, username}}
}
const setTurnLocalAction = turn => {
    return {type: SET_TURN_LOCAL, payload: {turn}}
}
module.exports={
    setRoomAction,
    setUsernameAction,
    resetLocalAction,
    addMessageAction,
    setJoiningAction,
    setPlayingLocalAction,
    setTankLocalAction,
    setTankBoardAction,
    setTurnLocalAction
}