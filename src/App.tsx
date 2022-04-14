import React, { useState, useCallback, useMemo } from 'react';
import { json } from 'stream/consumers';
import './App.css';

interface CardInfo {
  code: string | null | undefined,
  image: string | undefined,
  value: number,
  suit: string,
}

interface PlayerInfo {
  id: number;
  player_id : string,
  tokens: number,
  hands: CardInfo[],
  completedRows: number,
}

const width = 10;
const layout = [
  "S",	"AC",	"KC",	"QC",	"0C",	"9C",	"8C",	"7C",	"6C",	"S",
  "aceDiamonds",	"7S",	"8S",	"9S",	"0S",	"QD",	"KS",	"AS",	"5C",	"2S",
  "KD",	"6S",	"0C",	"9C",	"8C",	"7S",	"6C",	"2D",	"4C",	"3S",
  "QD",	"5S",	"QC",	"8H",	"7H",	"6H",	"5C",	"3D",	"3C",	"4S",
  "0D",	"4S",	"KC",	"9H",	"2H",	"5H",	"4C",	"4D",	"2C",	"5S",
  "9D",	"3S",	"AC",	"0H",	"3H",	"4H",	"3C",	"5D",	"AH",	"6S",
  "8D",	"2S",	"aceDiamonds",	"QH",	"KH",	"AH",	"2C",	"6D",	"KH",	"7S",
  "7D",	"2H",	"KD",	"QD",	"0D",	"9D",	"8D",	"7D",	"QH",	"8S",
  "6D",	"3H",	"4H",	"5H",	"6H",	"7H",	"8H",	"9H",	"0H",	"9S",
  "S",	"5D",	"4D",	"3D",	"2D",	"AS",	"KS",	"QS",	"0S",	"S"
]
  
const CreateBoard = ({chooseCard, activeCard} : {chooseCard: (boardCard: string) => void, activeCard: string | null | undefined}) => {
  let boardDiv : any
  let boardElements = layout.map((boardCard : string, index : number) => {
    if (boardCard === 'S') {
      return <div id={boardCard} key={index} className="" onClick={() => chooseCard(boardCard)}></div>
    }
    return <img 
      id={boardCard} 
      key={index}
      className={activeCard === boardCard ? 'active' : '' }
      src={`https://deckofcardsapi.com/static/img/${boardCard}.png`}
      onClick={() => chooseCard(boardCard)} />
  })
  boardDiv = 
  <div className="game-board grid">
    {boardElements}
  </div>

  return boardDiv
}

function App() {
  const [deck, setDeck] = useState('')
  const [numberOfPlayers, setNumberOfPlayers] = useState(4)
  const [confirmPlayers, setConfirmPlayers] = useState(false)
  const [cardCounter, setCardCounter] = useState(104)
  const [players, setPlayers] = useState<PlayerInfo[]>([])
  const [board, setBoard] = useState<any []>([])
  const [activePlayer,setActivePlayer] = useState(0)
  const [activeCard, setActiveCard] = useState<string | null | undefined>('')

  const chooseCard = useCallback((boardCard : string) => {
    console.log(boardCard)
  },[]);

  const seeCard = (cardId : string | null | undefined) => {
    setActiveCard(cardId);
  }


  const newDeck = () => {
    const numberOfDecks = 2
    const url = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${numberOfDecks}`
    fetch(url)
      .then(res => res.json())
      .then(decks => {
        setDeck(decks.deck_id)
      })
  }

  const confirmNumberOfPlayers = () => {
    setConfirmPlayers(true)
    let playersInfo : PlayerInfo[] = []
      for (let i = 0; i < numberOfPlayers; i++) {
        let cardsPush = drawCard(5)
        playersInfo.push({
          id: i,
          player_id : `Player${i}`,
          tokens: 50,
          hands: cardsPush,
          completedRows: 0,
        })            
      }
      setPlayers(playersInfo)
      playersTurnUpdate(playersInfo)
  }

  const playersTurnUpdate = (playersInfo : PlayerInfo[]) => {
    const nextActivePlayer = activePlayer + 1 % numberOfPlayers;
    setActivePlayer(nextActivePlayer)
  }


  const drawCard = (number : number) : CardInfo[] => {
    let cards : CardInfo[] = []
    const numberOfCards = number
    const url = `https://deckofcardsapi.com/api/deck/${deck}/draw/?count=${numberOfCards}`
    fetch(url)
      .then(res => res.json())
      .then(drawnHands => {
        const handsDrawn = drawnHands.cards
        handsDrawn.map((card: { code: string | null | undefined; image: string | undefined; value: number; suit: string; }) => (
          cards.push({
            code: card.code,
            image: card.image,
            value: card.value,
            suit: card.suit,
          })
        ))
      })
    return cards
     
  }

  const ActiveHand = useMemo(() => () => {
    if (activePlayer >= players.length) {
      return null;
    }
    const choosePlayer = players[activePlayer];
    const index = choosePlayer.id
    const hands = choosePlayer.hands
    let cards : any
    let cardElements = hands.map(card => (
      <img 
        key={`${card.code}`} 
        id={`${card.code}`}
        className="handCard" 
        src={card.image} 
        onMouseEnter={() => seeCard(card.code)}
        onClick={() => console.log('yep')}
        alt={`${card.value} of ${card.suit}`} />
    ))
    cards = 
      <div id={`${choosePlayer.id}`} key={index} className={`player${index}`}>
        <h2>Player {index}</h2>
        {cardElements}
      </div>
      return cards;
    
  },[activePlayer, players]);


  React.useEffect(

    () => newDeck()
    ,[activeCard, activePlayer])

  return (
    <div className="App">
      <header className="App-header">
        <CreateBoard chooseCard={chooseCard} activeCard={activeCard}/>
        <div className="player-side">
          <h1>Sequence Game</h1>
          {!confirmPlayers && <input 
              type="number"
              min="2"
              max="4"
              id="numberOfPlayers"
              name="numberOfPlayers"
              value={numberOfPlayers}
              onChange={(e) => setNumberOfPlayers(Number(e.target.value))}
            />}
            {!confirmPlayers && <button 
              id="confirmPlayers"
              name="confirmPlayers"
              onClick={confirmNumberOfPlayers}
            >Start Game</button>}
          <div className="drawn-hand"><ActiveHand/> </div>
        </div>
       
      </header>
    </div>
  );
}

export default App;
