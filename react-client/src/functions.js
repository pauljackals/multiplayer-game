export const getApiUrl = endpoint => {
    return `http://localhost:5000${endpoint}`
}
export const getHeaders = token => {
    return {headers: {'Authorization': `Bearer ${token}`}}
}