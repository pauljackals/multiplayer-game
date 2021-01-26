const {
    SET_ROOM,
    SET_USERNAME,
    RESET_LOCAL,
    ADD_MESSAGE,
    SET_PLAYING_LOCAL,
    SET_TANK_LOCAL,
    SET_TANK_BOARD,
    SET_TURN_LOCAL,
    SET_PREVIOUS_NEXT_LOCAL,
    SET_FIRST_LOCAL,
    SET_READY_LOCAL,
    DECREMENT_ACTIONS_LOCAL,
    RESET_ACTIONS_LOCAL,
    DECREMENT_HEALTH_LOCAL
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
const setPreviousNextLocalAction = (previous, next) => {
    return {type: SET_PREVIOUS_NEXT_LOCAL, payload: {previous, next}}
}
const setFirstLocalAction = first => {
    return {type: SET_FIRST_LOCAL, payload: {first}}
}
const setReadyLocalAction = ready => {
    return {type: SET_READY_LOCAL, payload: {ready}}
}
const decrementActionsLocalAction = () => {
    return {type: DECREMENT_ACTIONS_LOCAL}
}
const resetActionsLocalAction = full => {
    return {type: RESET_ACTIONS_LOCAL, payload: {full}}
}
const decrementHealthLocalAction = () => {
    return {type: DECREMENT_HEALTH_LOCAL}
}

module.exports={
    setRoomAction,
    setUsernameAction,
    resetLocalAction,
    addMessageAction,
    setPlayingLocalAction,
    setTankLocalAction,
    setTankBoardAction,
    setTurnLocalAction,
    setPreviousNextLocalAction,
    setFirstLocalAction,
    setReadyLocalAction,
    decrementActionsLocalAction,
    resetActionsLocalAction,
    decrementHealthLocalAction
}