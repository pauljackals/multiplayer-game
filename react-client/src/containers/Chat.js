import {useState} from 'react'
import '../styles/Chat.css'
import axios from "axios";
import {getApiUrl} from "../functions";

const Chat = ({local, setData}) => {
    const [waiting, setWaiting] = useState(false)
    const currentChat = local.currentChat

    const sendMessageHandle = async event => {
        event.preventDefault()
        const message = event.target.message.value
        if(message.length && !waiting) {
            setWaiting(true)
            event.target.reset()
            try {
                const response = await axios.post(getApiUrl(`/${local.username}/chat`), {user: currentChat, message})
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            } finally {
                setWaiting(false)
            }
        }
    }

    const newChatHandle = async event => {
        event.preventDefault()
        const user = event.target.user.value
        if(user.length && user!==local.username) {
            await readChatHandle(user)
            event.target.reset()
        }
    }

    const readChatHandle = async user => {
        if(!waiting) {
            setWaiting(true)
            try {
                const response = await axios.patch(getApiUrl(`/${local.username}/read`), {user})
                setData(response.data)
            } catch (error) {
                console.log(error.response ? error.response.status : 'No response from API')
            } finally {
                setWaiting(false)
            }
        }
    }

    const currentChatObject = local.chat.find(c => c.user===currentChat)

    return (
        <div className="Chat">
            <h3>Chat</h3>
            <div className="users">
                <form onSubmit={newChatHandle}>
                    <input name="user" placeholder="user"/>
                    <input type="submit" value="chat"/>
                </form>
                {local.chat.map(c => <span onClick={() => readChatHandle(c.user)} key={c.user} className={`${c.user===currentChat ? 'current ' : ''}${local.unread[c.user] ? 'unread' : ''}`}>
                    {c.user}{local.unread[c.user] ? <span className="unread-number">{local.unread[c.user]}</span> : ''}
                </span>)}
            </div>
            {
                currentChat.length ?
                    <div className="user">
                        <p>{currentChat} <button onClick={() => readChatHandle('')}>x</button></p>
                        <ul>
                            {currentChatObject && [...currentChatObject.messages].reverse()
                                .map((message, index) => <li key={index} className={message.username===local.username ? 'you' : ''}>
                                    <p>{message.username}</p>
                                    <div>{message.text}</div>
                                </li>)
                            }
                        </ul>
                        <form onSubmit={sendMessageHandle}>
                            <input name="message" placeholder="message"/>
                            <input type="submit" value="send"/>
                        </form>
                    </div> : ''
            }
        </div>
    )
}
export default Chat