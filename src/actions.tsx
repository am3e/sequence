import { CardInfo } from "./interfaces";
import { nanoid } from 'nanoid'

const submitUser = (ws: WebSocket, msg : string) => {
    const message = {playerUsername: msg}
    ws.send(JSON.stringify({
    ...message,
    id: nanoid(),
    type: "userevent"}))
    // setMessage([message, ...messages])
    console.log('submitmsg-user',message)
  }
  
const submitJoin = (ws: WebSocket) => {
    const message = {
        type: "joingame"
    }
    ws.send(JSON.stringify({
    ...message
    }))
}

const submitMove = (
    ws: WebSocket | undefined, 
    user : string, 
    boardindex : number, 
    discardcard : CardInfo | undefined, 
    cardIndex : number, 
    hand : CardInfo[], 
    playerId : number,
    useKillcard: boolean) => {
const message = { 
    user: user, 
    boardindex: boardindex, 
    discardcard : discardcard,
    cardIndex : cardIndex,
    hand : hand,
    playerId: playerId,
    useKillcard: useKillcard,
}
    if (ws){
        ws.send(JSON.stringify({
            ...message,
            type: "playerturn"}))
        console.log('submitmsg-playerevent',message)
    }
}

export {
    submitUser,
    submitJoin,
    submitMove,
}