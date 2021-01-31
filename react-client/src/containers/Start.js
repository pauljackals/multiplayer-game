import {useState} from 'react'
import axios from "axios";
import {
    getApiUrl
} from "../functions";

const Start = ({setData}) => {
    const [waiting, setWaiting] = useState(false)

    const submitHandle = async event => {
        event.preventDefault()
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
                setWaiting(false)
            }
        }
    }

    return (
        <div className="Start">
            <form onSubmit={submitHandle}>
                <input name="username" placeholder="username"/>
                <input type="submit" value="start"/>
            </form>
        </div>
    )
}
export default Start