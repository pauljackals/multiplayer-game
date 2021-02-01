const {
    ADD_TOKEN
} = require('../types/typesExtra')

const addTokenAction = (username, token) => {
    return {type: ADD_TOKEN, payload:{username, token}}
}

module.exports={
    addTokenAction
}