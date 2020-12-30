const {
    ADD_USER,
    REMOVE_USER,
    RESET_ONLINE,
    SET_PLAYING_ONLINE,
    SET_TANK_ONLINE,
    SET_TURN_ONLINE
} = require('../types/typesOnline')

const addUserAction = user => {
    return {type: ADD_USER, payload: {user}}
}
const removeUserAction = username => {
    return {type: REMOVE_USER, payload: {username}}
}
const resetOnlineAction = () => {
    return {type: RESET_ONLINE}
}
const setPlayingOnlineAction = (playing, username) => {
    return {type: SET_PLAYING_ONLINE, payload: {playing, username}}
}
const setTankOnlineAction = (row, column, rotation, username) => {
    return {type: SET_TANK_ONLINE, payload: {row, column, rotation, username}}
}
const setTurnOnlineAction = (turn, username) => {
    return {type: SET_TURN_ONLINE, payload: {turn, username}}
}
module.exports={
    addUserAction,
    removeUserAction,
    resetOnlineAction,
    setPlayingOnlineAction,
    setTankOnlineAction,
    setTurnOnlineAction
}