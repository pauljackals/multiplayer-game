const {SET_ROOM, SET_USERNAME, RESET_LOCAL, ADD_MESSAGE, SET_JOINING, SET_PLAYING_LOCAL} = require('../types/typesLocal')

const generateBoard = side => Array(side).fill([])
    .map(() => Array(side).fill({}));

const INITIAL_STATE = {
    board: generateBoard(10),
    playing: false,
    tank: {},
    score: 0,
    username: '',
    room: '',
    messages: [],
    joining: true
}

const reducerLocal = (state=INITIAL_STATE, action) => {
    switch (action.type) {
        case SET_ROOM: {
            return {...state, room: action.payload.room}
        } case SET_USERNAME: {
            return {...state, username: action.payload.username}
        } case RESET_LOCAL: {
            return {...INITIAL_STATE, username: state.username}
        } case ADD_MESSAGE: {
            return {...state, messages: [...state.messages, action.payload.message]}
        } case SET_JOINING: {
            return {...state, joining: action.payload.joining}
        } case SET_PLAYING_LOCAL: {
            return {...state, playing: action.payload.playing}
        } default: {
            return state
        }
    }
}
module.exports = reducerLocal