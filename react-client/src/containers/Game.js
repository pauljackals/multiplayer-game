import {useEffect} from 'react'
import axios from "axios";
import {
    getApiUrl
} from "../functions";
import Chat from "./Chat";

const Game = ({data, setData, user}) => {

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const response = await axios.get(getApiUrl(`/${user}`))
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            }
        }, 1000)

        return () => clearInterval(intervalId);

    }, [user, setData])

    const local = data.reducerLocal
    const online = data.reducerOnline
    return (
        <div className="Game">
            <h3>User: {local.username}</h3>
            <Chat user={user} chat={local.chat} setData={setData}/>
        </div>
    )
}
export default Game