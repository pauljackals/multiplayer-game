import {useState} from 'react'
import axios from "axios";
import {
    getApiUrl,
    getHeaders
} from "../functions";

const Start = ({setData, setToken}) => {
    const [waiting, setWaiting] = useState(false)
    const [error, setError] = useState('')
    const [info, setInfo] = useState('')
    const [giveToken, setGiveToken] = useState(false)

    const submitHandle = async event => {
        event.preventDefault()
        setError('')
        const username = event.target.username.value
        const token = event.target.token ? event.target.token.value : undefined
        if(token!==undefined && !token.length) {
            setGiveToken(false)
        }
        if(username.length && !waiting) {
            setWaiting(true)
            try {
                const response = await axios.get(getApiUrl(`/${username}`), token ? getHeaders(token) : {})
                setToken(token)
                setData(response.data)
                return
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
                if(error.response) {
                    const status = error.response.status
                    if (status===401) {
                        setGiveToken(true)
                    } else if (status===403){
                        setError('Invalid token')
                    }

                    if(status!==404){
                        setWaiting(false)
                        return
                    }
                }
            }
            try {
                setInfo('Checking name availability')
                const response = await axios.post(getApiUrl('/'), {username})
                const responseData = response.data
                setToken(responseData.token)
                setData(responseData.data)
            } catch (error) {
                setInfo('')
                console.log(error.response ? error.response.status : 'No response from API')
                if(error.response && error.response.data.message) {
                    setError(error.response.data.message)
                    setGiveToken(false)
                }
                setWaiting(false)
            }
        }
    }

    return (
        <div className="Start">
            {info.length ? <div className="warning info">{info}</div> : ''}
            {error.length ? <div className="warning error">{error}</div> : ''}
            <form onSubmit={submitHandle} onBlur={() => setError('')}>
                <input name="username" placeholder="username"/>
                {
                    giveToken ?
                        <input name="token" placeholder="token"/> : ''
                }
                <input type="submit" value="start"/>
            </form>
        </div>
    )
}
export default Start