const {SET_ROOM, SET_USERNAME, RESET_LOCAL, ADD_MESSAGE, SET_JOINING, SET_PLAYING_LOCAL, SET_TANK_LOCAL, SET_TANK_BOARD} = require('../types/typesLocal')

const fieldInitial = {tank: ''}
const generateBoard = side => Array(side).fill([])
    .map(() => Array(side).fill(fieldInitial));

const INITIAL_STATE = {
    board: generateBoard(10),
    playing: false,
    tank: {
        health: 3,
        row: -1,
        column: -1,
        rotation: -1,
        alive: true
    },
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
        } case SET_TANK_LOCAL: {
            const payload = action.payload
            const tank = {row: payload.row, column: payload.column, rotation: payload.rotation}
            return {...state, tank: {...state.tank, ...tank}}
        } case SET_TANK_BOARD: {
            const payload = action.payload
            const board = state.board.map((row, indexRow) =>
                row.map((field, indexColumn) => {
                    if(indexRow===payload.row && indexColumn===payload.column) {
                        return {tank: payload.username}
                    } else if (field.tank===payload.username){
                        return fieldInitial
                    } else {
                        return field
                    }
                })
            )
            return {...state, board}
        } default: {
            return state
        }
    }
}
module.exports = reducerLocal