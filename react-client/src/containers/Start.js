import {useState} from 'react'
import axios from "axios";
import {
    getApiUrl
} from "../functions";

const Start = ({setUser, setData}) => {
    const [waiting, setWaiting] = useState(false)

    const submitHandle = async event => {
        event.preventDefault()
        if(!waiting) {
            setWaiting(true)
            const username = event.target.username.value
            try {
                const response = await axios.post(getApiUrl('/'), {username})
                setData(response.data)
                setUser(username)
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