import {useState} from 'react'
import '../styles/Chat.css'
import axios from "axios";
import {getApiUrl} from "../functions";

const Chat = ({local, setData}) => {
    const [currentChat, setCurrentChat] = useState('')
    const [waiting, setWaiting] = useState(false)

    const sendMessageHandle = async event => {
        event.preventDefault()
        if(!waiting) {
            setWaiting(true)
            const message = event.target.message.value
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
        if(user.length) {
            setCurrentChat(user)
            event.target.reset()
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
                {local.chat.map(c => <span onClick={() => setCurrentChat(c.user)} key={c.user} className={c.user===currentChat ? 'current' : ''}>{c.user}</span>)}
            </div>
            {
                currentChat.length ?
                    <div className="user">
                        <p>{currentChat} <button onClick={() => setCurrentChat('')}>x</button></p>
                        <ul>
                            {currentChatObject && currentChatObject.messages
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