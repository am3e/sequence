import { CardInfo } from "./interfaces";


const submitUser = (ws: WebSocket | undefined, msg : string) => {
    const message = {playerUsername: msg}
    if (ws){
      ws.send(JSON.stringify({
        ...message,
        type: "userevent"}))
      // setMessage([message, ...messages])
      console.log('submitmsg-user',message)
    }
  }
  
const submitStart = (ws: WebSocket | undefined, user: string) => {
const message = {
    user: user,
    message: "",
    type: "startgame"
}
if (ws) {
    ws.send(JSON.stringify({
    ...message
    }))
}
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
    submitStart,
    submitMove,
}