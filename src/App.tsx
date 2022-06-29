import React, { useEffect, useState, useCallback, useMemo } from "react";
// import { json } from 'stream/consumers';
import "./App.css";
import { Context } from "./Context"
import Board from "./components/Board"
import { PlayerInfo, CardInfo, User, Game } from "./interfaces";
import {
  submitUser,
  submitJoin,
  submitMove,
} from "./actions"
 
const URL = process.env.NODE_ENV === 'development' ? 'ws://127.0.0.1:8080' : 'wss://sequence.bzerk.com'

function App() {
  const { getCardSymbol } = React.useContext(Context)
  const [user, setUser] = useState<string>()
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false)
  const [playerConfirmed, setPlayerConfirmed] = useState<boolean>(false)
  const [ws, setWs] = useState<WebSocket>()
  const [disableBoard, setDisableBoard] = useState<boolean>(false)
  const [hands, setHands] = useState<CardInfo[]>([])
  const [confirmPlayers, setConfirmPlayers] = useState(false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [game, setGame] = useState<Game>({
    numberOfPlayers: '',
    players: [],
    discardpile: [],
    winner: '',
    isPlaying: false
  });
  const [playerId, setPlayerId] = useState<number>(0)
  const [activePlayer, setActivePlayer] = useState(0);
  const [activePlayerUsername, setActivePlayerUsername] = useState<string>('');
  const [remainingCards, setRemainingCards] = useState<number>(104);
  const [remainingTokens, setRemainingTokens] = useState<number>(50);
  const [winner, setWinner] = useState<string>('');
  const [winnerArray, setWinnerArray] = useState<number[]>([])
  const [activeCard, setActiveCard] = useState<string>("");
  const [newCard, setNewCard] = useState<number>(-1);
  const [discardedCard, setDiscardedCard] = useState<string>("");
  const [selectedCard, setSelectedCard] = useState<number>(100);
  const [boardTokens, setBoardTokens] = useState<number[]>(
    new Array(100).fill(-1)
  );
  

  const confirmUser = () => {
    setUserConfirmed(true)
    ws && submitUser(ws, user?user:'')
  }

  const joinGame = () => {
      setPlayerConfirmed(true)
      ws && submitJoin(ws)
  }

  //export to own component
  const ShowHand = useMemo(
    () => ({
      hands,
      playerId
    }: {
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

  const Discarded = ({discardedCard} : {discardedCard : string}) => {
    const result = getCardSymbol(discardedCard)
    let suit = result[0]
    let value = result[1]
    let suitcolor = result[2]

    return (
      <div
        key={`discarded-${discardedCard}`}
        id={`discarded-${discardedCard}`}
        className={`
        handCard ${suitcolor}
        `}
        >{value} {suit}</div>
    )
  };

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
      console.log(players)
      ws.onmessage = async (e) => {
        // const message = JSON.parse(await e.data.text());
        const message = JSON.parse( e.data )
        console.log('onmessage',message)
        if (message.type === 'game') {
          setGame(message.game);
          if (message.game.isPlaying) {
            setPlayers(message.game.players)
            setBoardTokens(message.game.boardTokens)
          }
        } else if (message.type === 'userevent') {
          console.log('users', users)
          setUsers(users)
        } else if (message.type === 'users') {
          console.log('users', message.users)
          setUsers(message.users);
        } else if (message.type === 'startgame') {
          setWinner('')
          setWinnerArray([])
          const clearBoardTokens = new Array(100).fill(-1)
          setBoardTokens([...clearBoardTokens])
          setGame(message.game)
          console.log(message.game)
        } else if (message.type === 'playerinfo') {
          setConfirmPlayers(true)
          setHands(message.hand)
          setRemainingTokens(message.remainingTokens)
          setPlayers(message.players)
          setPlayerId(message.playerIndex)
          setActivePlayer(message.activePlayer)
          setActivePlayerUsername(message.activePlayerUsername)
        } else if (message.type === 'playerturn') {
          setActivePlayer(message.activePlayer)
          setActivePlayerUsername(message.activePlayerUsername)
          boardTokens[message.boardIndexChange] = message.boardIndexPlayer
          setBoardTokens([...boardTokens])
          setDiscardedCard(message.discarded.code)
          setRemainingCards(message.remainingCards)
          console.log('lookie', message.discarded)
          if (message.winner !== '') {
            setWinner(message.winner)
            setWinnerArray(message.winnerArray)
            setDisableBoard(true)
            setTimeout(() => {
              console.log(game)
              game.isPlaying = false
              setGame(game)
              setUserConfirmed(false)
              setConfirmPlayers(false)
              setHands([])
              setPlayers([])
              setPlayerId(0)
              setActivePlayer(0)
              setActivePlayerUsername('')
              setWinner('')
              setWinnerArray([])
              setBoardTokens(new Array(100).fill(-1))
            }, 10000)
            
          }
          
        } else if (message.type === 'updatehand') {
          setRemainingTokens(message.remainingTokens)
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
      <main className="App-header">
        <section className="game">
          <Board
            handleCardClick={handleCardClick}
            activeCard={activeCard}
            activePlayer={activePlayer}
            playerId={playerId}
            user={user}
            hands={hands}
            boardTokens={boardTokens}
            winnerArray={winnerArray}
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
            
            <ul className="player-list">{game.players.map(player => 
              <li className={`player-item ${player.player_id} ${activePlayer === player.id ? 'player-turn' : ''}`}>
                {player.userName}
              </li>)}
            </ul>
            {confirmPlayers && <div className="drawn-hand">
              <ShowHand
                hands={hands}
                playerId={playerId}

              />{" "}
            </div>}
            {winner ? <h1 className="winner-text">{winner} won</h1> : ''}
            {userConfirmed && game && !game.isPlaying && !playerConfirmed && (
              <button
                id="confirmPlayers"
                name="confirmPlayers"
                onClick={joinGame}
              >
                {!players.length ? 'Start New Game' : 'Join Game'}
              </button>
            )}
            {userConfirmed && playerConfirmed && players.length < 1 && game && !game.isPlaying && <p>Waiting for Players</p>}
            { game.isPlaying && <div className="game-info">
              <div className="discarded">
                <p className="game-info-title">Discarded </p>
                <Discarded
                  discardedCard={discardedCard}
                />
              </div>
              <p className="game-info-title">Remaining Cards {remainingCards}</p>
              <p className="game-info-title">Remaining Tokens {remainingTokens ? remainingTokens : 50}</p>
              <p className="game-info-title">Watchers {users.length}</p>
            </div>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
