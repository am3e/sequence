import { lookup } from 'dns';
import React, { useState } from 'react';
import './App.css';


function App() {
  let boardList : any[] = []
  const width = 10;
  let boardCards : any[] = []
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
  const [players, setPlayers] = useState(1)
  const [deck, setDeck] = useState('')
  const [hands, setHands] = useState()
  const [board, setBoard] = useState<any[]>(boardList)
  const [activeCard, setActiveCard] = useState<string | null | undefined>('')

  const chooseCard = (boardCard : string) => {
  }

  const seeCard = (cardId : string | null | undefined) => {
    board.forEach(element => {
      if (element.props.id === cardId) {
        console.log(element.props.id, cardId, element.props)
        // element.props.classList.add("active")
        setActiveCard(cardId)
      }
    })
  }
  
  const createBoard = (layout: any[]) => {
    let boardElements = layout.map((boardCard : string, index : number) => {
      if (boardCard === 'S') {
        return <div id={boardCard} className="" onClick={() => chooseCard(boardCard)}></div>
      } else {
        return <img 
          id={boardCard} 
          className={activeCard === boardCard ? 'active' : '' }
          src={`https://deckofcardsapi.com/static/img/${boardCard}.png`}
          onClick={() => chooseCard(boardCard)} />
      }
    })
    setBoard(boardElements);
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

  const newHands = () => {
    const numberOfCards = players * 5
    const url = `https://deckofcardsapi.com/api/deck/${deck}/draw/?count=${numberOfCards}`
    fetch(url)
      .then(res => res.json())
      .then(drawnHands => {
        const handsDrawn = drawnHands.cards
        let cardElements = handsDrawn.map((card: { code: string | null | undefined; image: string | undefined; value: number; suit: string; }) => (
            <img 
              key={card.code} 
              className="handCard" 
              src={card.image} 
              onMouseEnter={() => seeCard(card.code)}
              onClick={() => console.log('yep')}
              alt={`${card.value} of ${card.suit}`} />
        ))
        setHands(cardElements)

      })
  }

  React.useEffect(
    () => createBoard(layout)
    ,[activeCard])

  return (
    <div className="App">
      <header className="App-header">
        <div className="game-board grid">
          {board}
        </div>
        <div className="player-side">
          <h1>Sequence Game</h1>
          <button onClick={newDeck}>New Deck</button>
          <button onClick={newHands}>New Hands</button>
          <div className="drawn-hand"> {hands} </div>
        </div>
       
      </header>
    </div>
  );
}

export default App;
