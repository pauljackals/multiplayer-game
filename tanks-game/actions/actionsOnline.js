const {
    ADD_USER,
    REMOVE_USER,
    RESET_ONLINE,
    SET_PLAYING_ONLINE,
    SET_TANK_ONLINE,
    SET_TURN_ONLINE,
    SET_FIRST_ONLINE,
    SET_PREVIOUS_NEXT_ONLINE,
    SET_READY_ONLINE,
    DECREMENT_ACTIONS_ONLINE,
    RESET_ACTIONS_ONLINE,
    DECREMENT_HEALTH_ONLINE,
    ADD_POINTS_ONLINE,
    SET_CANCEL_ONLINE,
    SET_VOTE_ONLINE
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
const setPreviousNextOnlineAction = (previous, next, username) => {
    return {type: SET_PREVIOUS_NEXT_ONLINE, payload: {previous, next, username}}
}
const setFirstOnlineAction = (first, username) => {
    return {type: SET_FIRST_ONLINE, payload: {first, username}}
}
const setReadyOnlineAction = (ready, username) => {
    return {type: SET_READY_ONLINE, payload: {ready, username}}
}
const decrementActionsOnlineAction = username => {
    return {type: DECREMENT_ACTIONS_ONLINE, payload: {username}}
}
const resetActionsOnlineAction = (full, username) => {
    return {type: RESET_ACTIONS_ONLINE, payload: {full, username}}
}
const decrementHealthOnlineAction = username => {
    return {type: DECREMENT_HEALTH_ONLINE, payload: {username}}
}
const addPointsOnlineAction = (points, username) => {
    return {type: ADD_POINTS_ONLINE, payload: {points, username}}
}
const setCancelOnlineAction = (cancel, username) => {
    return {type: SET_CANCEL_ONLINE, payload: {cancel, username}}
}
const setVoteOnlineAction = (vote, username) => {
    return {type: SET_VOTE_ONLINE, payload: {vote, username}}
}

module.exports={
    addUserAction,
    removeUserAction,
    resetOnlineAction,
    setPlayingOnlineAction,
    setTankOnlineAction,
    setTurnOnlineAction,
    setPreviousNextOnlineAction,
    setFirstOnlineAction,
    setReadyOnlineAction,
    decrementActionsOnlineAction,
    resetActionsOnlineAction,
    decrementHealthOnlineAction,
    addPointsOnlineAction,
    setCancelOnlineAction,
    setVoteOnlineAction
}