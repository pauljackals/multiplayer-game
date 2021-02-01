import {useEffect, useState} from 'react'
import axios from "axios";
import {
    getApiUrl,
    getHeaders
} from "../functions";
import Chat from "./Chat";
import Room from "./Room";
import '../styles/Game.css'

const Game = ({data, setData, token}) => {
    const local = data.reducerLocal

    const [showToken, setShowToken] = useState(false)

    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                const response = await axios.get(getApiUrl(`/${local.username}`), getHeaders(token))
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            }
        }, 1000)

        return () => clearInterval(intervalId);

    }, [local, setData, token])

    return (
        <div className="Game">
            {
                !showToken ?
                    <button onClick={() => setShowToken(true)}>show token</button> :
                    <>
                        <span className="token">{token}</span>
                        <button onClick={() => setShowToken(false)}>hide</button>
                    </>
            }
            <h3>User: {local.username}</h3>
            <div className="main-columns">
                <div className="chat-wrap">
                    <Chat local={local} setData={setData} token={token}/>
                </div>
                <div className="room-wrap">
                    <Room data={data} setData={setData} token={token}/>
                </div>
            </div>
        </div>
    )
}
export default Game