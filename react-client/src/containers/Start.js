import {useState} from 'react'
import axios from "axios";
import {
    getApiUrl
} from "../functions";

const Start = ({setData}) => {
    const [waiting, setWaiting] = useState(false)
    const [error, setError] = useState('')

    const submitHandle = async event => {
        event.preventDefault()
        setError('')
        const username = event.target.username.value
        if(username.length && !waiting) {
            setWaiting(true)
            try {
                const response = await axios.get(getApiUrl(`/${username}`))
                setData(response.data)
                return
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            }
            try {
                const response = await axios.post(getApiUrl('/'), {username})
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
                if(error.response && error.response.data.message) {
                    setError(error.response.data.message)
                }
                setWaiting(false)
            }
        }
    }

    return (
        <div className="Start">
            {error.length ? <div className="error">{error}</div> : ''}
            <form onSubmit={submitHandle} onBlur={() => setError('')}>
                <input name="username" placeholder="username"/>
                <input type="submit" value="start"/>
            </form>
        </div>
    )
}
export default Start