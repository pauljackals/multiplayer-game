import axios from "axios";
import {getApiUrl} from "../functions";
import {useState} from "react";
import '../styles/Room.css'

const Room = ({data, setData}) => {

    const [waiting, setWaiting] = useState(false)

    const local = data.reducerLocal
    const online = data.reducerOnline

    const all = [local, ...online]
    const [spectating, playing] = all.reduce(
        (accumulator, user) => !user.playing ? [[...accumulator[0], user], accumulator[1]] : [accumulator[0], [...accumulator[1], user]], [[], []]
    )

    const joinRoomHandle = async event => {
        event.preventDefault()
        if(!waiting) {
            setWaiting(true)
            const room = event.target.room.value
            event.target.reset()
            try {
                const response = await axios.patch(getApiUrl(`/${local.username}/join`), {room})
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            } finally {
                setWaiting(false)
            }
        }
    }
    const leaveRoomHandle = async () => {
        if(!waiting) {
            setWaiting(true)
            try {
                const response = await axios.patch(getApiUrl(`/${local.username}/leave`))
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            } finally {
                setWaiting(false)
            }
        }
    }

    return (
        <div className="Room">
            {
                !local.room.length ?
                    <form onSubmit={joinRoomHandle}>
                        <input placeholder="room" name="room"/>
                        <input type="submit" value="join"/>
                    </form> :
                    <>
                        <h3>Room: {local.room}</h3>
                        <button onClick={leaveRoomHandle}>leave</button>
                        <p>Spectating:</p>
                        <ul>
                            {[...spectating].sort(
                                (user1, user2) => user1.username > user2.username ? 1
                                    : (user1.username < user2.username ? -1
                                        : 0)
                            ).map((user, index) => <li key={index}>{user.username}</li>)}
                        </ul>
                    </>
            }
        </div>
    )
}
export default Room