import {useEffect} from 'react'
import axios from "axios";
import {
    getApiUrl
} from "../functions";
import Chat from "./Chat";
import Room from "./Room";

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
    return (
        <div className="Game">
            <h3>User: {local.username}</h3>
            <Room data={data} setData={setData}/>
            <Chat local={local} setData={setData}/>
        </div>
    )
}
export default Game