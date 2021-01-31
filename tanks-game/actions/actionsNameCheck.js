const {
    START_NAME_CHECK,
    CLEAR_NAME_CHECK,
    REMOVE_NAME_CHECK
}=require('../types/typesNameCheck')

const startNameCheck = (interval, timeout, id) => {
    return {type: START_NAME_CHECK, payload: {interval, timeout, id}}
}
const clearNameCheck = (id, free) => {
    return {type: CLEAR_NAME_CHECK, payload: {id, free}}
}
const removeNameCheck = id => {
    return {type: REMOVE_NAME_CHECK, payload: {id}}
}

module.exports={
    startNameCheck,
    clearNameCheck,
    removeNameCheck
}