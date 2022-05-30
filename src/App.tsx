import React, { useEffect, useState, useCallback, useMemo } from "react";
// import { json } from 'stream/consumers';
import "./App.css";
import { Context } from "./Context"
import Board from "./components/Board"
import { PlayerInfo, CardInfo } from "./interfaces";
import {
  submitUser,
  submitStart,
  submitMove,
} from "./actions"
 
const URL = 'ws://127.0.0.1:8083'

function App() {
  const { getCardSymbol } = React.useContext(Context)
  const [user, setUser] = useState<string>()
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false)
  const [ws, setWs] = useState<WebSocket>()
  const [disableBoard, setDisableBoard] = useState<boolean>(false)
  const [hands, setHands] = useState<CardInfo[]>([])
  const [confirmPlayers, setConfirmPlayers] = useState(false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [playerId, setPlayerId] = useState<number>(0)
  const [activePlayer, setActivePlayer] = useState(0);
  const [activePlayerUsername, setActivePlayerUsername] = useState<string>('');
  const [winner, setWinner] = useState<string>('');
  const [winnerArray, setWinnerArray] = useState<CardInfo[]>([])
  const [activeCard, setActiveCard] = useState<string>("");
  const [newCard, setNewCard] = useState<number>(-1);
  const [selectedCard, setSelectedCard] = useState<number>(100);
  const [boardTokens, setBoardTokens] = useState<number[]>(
    new Array(100).fill(-1)
  );
  

  const confirmUser = () => {
    setUserConfirmed(true)
    submitUser(ws, user?user:'')
  }

  const startGame = () => {
    submitStart(ws, user?user:'')
  }

  //export to own component
  const ShowHand = useMemo(
    () => ({
      user,
      hands,
      playerId
    }: {
      user: string | undefined;
      hands: CardInfo[] | undefined | null;
      playerId: number;
    }) => {
      let cards: any;
      let value
      let suit
      let suitcolor
      if (hands) {
        let cardElements = hands.map((card, index) => 
        {
          const result = getCardSymbol(card.code)
          suit = result[0]
          value = result[1]
          suitcolor = result[2]

        return (
          <div
            key={`${card.index}`}
            id={`${card.code}`}
            className={`
            handCard player${playerId} ${suitcolor}
            ${newCard === index ? 'newCard' : ''}
            ${selectedCard === index ? 'selectedCard' : ''}
            `}
            onMouseEnter={() => seeCard(card.code)}
            >{value} {suit}</div>
          
        )});
        cards = (
          <div id={`${playerId}`} key={playerId}>
            <div className="player-display">{cardElements}</div>
          </div>
        );
        return cards;
      }

    },
    [players]
  );

  const handleCardClick = useCallback((user, boardCard, i) => {
    console.log(boardTokens, playerId, activePlayer)
    let cardIndex : number = -1
    console.log('checking',playerId)
    const wildcards =['JD', 'JC'];
    const killcards = [ 'JH', 'JS'];
    let useKillcard = false

    if (hands && playerId === activePlayer) {
      hands?.forEach((card, handIndex) => {
        if (card.code === boardCard && boardTokens[i] === -1) {
          cardIndex = handIndex
      }})
      if (cardIndex === -1) {
        hands?.forEach((card, handIndex) => {
          const wildcard = wildcards.find(wildcard => card.code === wildcard)
          const killcard = killcards.find(killcard => card.code === killcard)
          if (wildcard && boardTokens[i] === -1) {
            cardIndex = handIndex
          } else if (killcard && boardTokens[i] !== playerId && boardTokens[i] !== -1) {
            cardIndex = handIndex
            useKillcard = true
            console.log('kc',cardIndex, useKillcard)
          }
        })
      }
  
      if (cardIndex !== -1) {
        setDisableBoard(true)

        const card = hands[cardIndex];
        setSelectedCard(cardIndex)
        submitMove(ws, user, i, card, cardIndex, hands, playerId, useKillcard)
        setSelectedCard(100)
      }
    }
    

  }, [players, activePlayer, boardTokens]);

  const seeCard = (cardId: string) => {
    setActiveCard(cardId);
    setTimeout(() => {setActiveCard('')} , 1000)
  };

  useEffect(() => {
    if (!ws) {
      let ws = new WebSocket(URL)
      ws.onopen = () => {
        console.log('WebSocket Connected')
      }

      ws.onmessage = async (e) => {
        // const message = JSON.parse(await e.data.text());
        const message = JSON.parse( e.data )
        console.log('onmessage',message)
        if (message.type === 'userevent') {
          players.push(message.playerinfo)
          setPlayers(players)
        }
        if (message.type === 'startgame') {
          setWinner('')
          setWinnerArray([])
          const clearBoardTokens = new Array(100).fill(-1)
          console.log(clearBoardTokens,'clearBoardTokens')
          setBoardTokens([...clearBoardTokens])
        }
        if (message.type === 'playerinfo') {
          setConfirmPlayers(true)
          setHands(message.hand)
          setPlayerId(message.playerIndex)
          setActivePlayer(message.activePlayer)
          setActivePlayerUsername(message.activePlayerUsername)
        }
        if (message.type === 'playerturn') {
          setActivePlayer(message.activePlayer)
          setActivePlayerUsername(message.activePlayerUsername)
          boardTokens[message.boardIndexChange] = message.boardIndexPlayer
          setBoardTokens([...boardTokens])
          if (message.winner !== '') {
            setWinner(message.winner)
            setWinnerArray(message.winnerArray)
            setDisableBoard(true)
            setTimeout(() => {
              setConfirmPlayers(false)
              setHands([])
              setPlayers([])
              setPlayerId(0)
              setUserConfirmed(false)
            }, 1000)
            
          }
          
        }
        if (message.type === 'updatehand') {
          setHands(message.hand)
          setNewCard(4)
          setTimeout(() => setNewCard(-1))
        }
        
      }

      ws.onclose = () => {
        console.log('WebSocket Disconnected')
      }
      setWs(ws);
    }
  },
    [hands, playerId, confirmPlayers, activePlayer, boardTokens]
  );

  return (
    <div className="App">
      <header className="App-header">
        <Board
          handleCardClick={handleCardClick}
          activeCard={activeCard}
          boardTokens={boardTokens}
          players={players}
          user={user}
          hands={hands}
          activePlayer={activePlayer}
          playerId={playerId}
          confirmPlayers={confirmPlayers}
          disableBoard={disableBoard}
        />
        <div className="player-side">
          <h1 className="game-title">Sequence</h1>
          {!userConfirmed && <label htmlFor="user">
	          <input
	            type="text"
	            id="user"
	            placeholder="Username"
	            value={user}
	            onChange={e => setUser(e.target.value)}
	          />
	        </label>}
          {!userConfirmed && (
            <button
              id="confirmPlayers"
              name="confirmPlayers"
              onClick={confirmUser}
            >
              Submit
            </button>
          )}
          
          {confirmPlayers && <h2>{`${activePlayer === playerId ? 'Your' : activePlayerUsername + `'s`}`} turn</h2>}
          {confirmPlayers && <div className="drawn-hand">
            <ShowHand
              user={user}
              hands={hands}
              playerId={playerId}
             />{" "}
          </div>}
          {winner ? <h1 className="winner-text">{winner} won</h1> : ''}
          {!confirmPlayers && userConfirmed && (
            <button
              id="confirmPlayers"
              name="confirmPlayers"
              onClick={startGame}
            >
              {winner ? 'Play Again' : 'Play Game'}
            </button>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
