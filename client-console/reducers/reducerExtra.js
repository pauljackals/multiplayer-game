const {
    SET_HELP,
    SET_CURRENT_USER
} = require('../types/typesExtra')

const INITIAL_STATE = {
    help: false,
    currentUser: ''
}
const reducerExtra = (state=INITIAL_STATE, action) => {
    switch (action.type) {
        case SET_HELP: {
            return {...state, help: action.payload.on}

        } case SET_CURRENT_USER: {
            return {...state, currentUser: action.payload.currentUser}

        } default: {
            return state
        }
    }
}
module.exports = reducerExtra