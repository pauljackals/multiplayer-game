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

    const playingFirst = playing.find(user => user.first)
    const sortLinkedPlayers = (current, sorted) => {
        if (current.next === playingFirst.username) {
            return [...sorted, current]
        }
        const nextObject = playing.find(user => user.username===current.next)
        return sortLinkedPlayers(nextObject, [...sorted, current])
    }
    const playingSorted = playingFirst ? sortLinkedPlayers(playingFirst, []) : []

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

    const gameInProgress = playing.length && playing.find(u => u.turn)
    const getPlayerSymbol = user => {
        if(gameInProgress) {
            if(user.turn){
                return '>'
            } else {
                if(local.cancelUser.length) {
                    if(user.vote===1) {
                        return '✓'
                    } else {
                        return '?'
                    }
                } else {
                    return ' '
                }
            }
        } else {
            if(user.ready) {
                return '✓'
            } else {
                return 'X'
            }
        }
    }

    const tankElement = player => (
        <div className={`tank${player ? ` rotation-${player.tank.rotation}` : ''}${player && !player.tank.health ? ' dead' : ''}`}>
            <div className="cannon"/>
        </div>
    )

    return (
        <div className="Room">
            {
                !local.room.length ?
                    <form onSubmit={joinRoomHandle}>
                        <input placeholder="room" name="room"/>
                        <input type="submit" value="join"/>
                    </form> :
                    <>
                        <div className="sidebar">
                            <h3>Room: {local.room}</h3>
                            <button onClick={leaveRoomHandle}>leave</button>
                            <h3>Spectating:</h3>
                            <ul>
                                {[...spectating].sort(
                                    (user1, user2) => user1.username > user2.username ? 1
                                        : (user1.username < user2.username ? -1
                                            : 0)
                                ).map((user, index) => <li key={index}>{user.username}</li>)}
                            </ul>
                            <table className="players">
                                <tbody>
                                <tr>
                                    <th/>
                                    <th>name</th>
                                    <th>score</th>
                                    <th>health</th>
                                    <th>actions</th>
                                </tr>
                                {
                                    playingSorted.map((user, index) =>
                                        <tr key={index}>
                                            <td>{getPlayerSymbol(user)}</td>
                                            <td>{user.username}</td>
                                            <td>{user.score}</td>
                                            <td>
                                                {[...Array(user.tank.health)].map((health, index) => <div key={index} className="bar health"/>)}
                                                {[...Array(3-user.tank.health)].map((health, index) => <div key={index} className="bar health lost"/>)}
                                            </td>
                                            <td>
                                                {[...Array(user.tank.actions)].map((health, index) => <div key={index} className="bar action"/>)}
                                                {[...Array(3-user.tank.actions)].map((health, index) => <div key={index} className="bar action lost"/>)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <h3>Messages:</h3>
                            <ul className="messages">
                                {[...local.messages].reverse()
                                    .map((message, index) => <li key={index} className={message.username===local.username ? 'you' : ''}>
                                        <p>{message.username}</p>
                                        <div>{message.text}</div>
                                    </li>)
                                }
                            </ul>
                        </div>
                        {
                            local.winner.username.length ?
                                <h2>{local.winner.username} has won with a score of {local.winner.score}</h2> :
                                <>
                                    <div className="board-wrap">
                                        <div className="board">
                                            {local.board.map((row, indexRow) =>
                                                row.map((field, indexColumn) =>
                                                    <div key={`${indexRow}-${indexColumn}`} className={`field ${field.tank===local.username ? 'you' : ''}`}>
                                                        {field.tank.length ? tankElement(playing.find(user => user.username===field.tank)) : ''}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        {
                                            local.turn ?
                                                <h3>Your turn</h3> : ''
                                        }
                                        {
                                            local.cancelUser.length ?
                                                <h3>{local.cancel ? 'Waiting for votes' : `${local.cancelUser} wants to cancel move`}</h3> : ''
                                        }
                                    </div>
                                </>
                        }
                    </>
            }
        </div>
    )
}
export default Room