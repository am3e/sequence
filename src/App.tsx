import React, { useState } from 'react';
import './App.css';

function App() {
  const [players, setPlayers] = useState(1)
  const [deck, setDeck] = useState('')
  const [hands, setHands] = useState()
  let huh 
  const newDeck = () => {
    const numberOfDecks = 2
    const url = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${numberOfDecks}`
    fetch(url)
      .then(res => res.json())
      .then(decks => {
        setDeck(decks.deck_id)
        console.log(decks.deck_id)
      })
  }

  const newHands = () => {
    const numberOfCards = players * 5
    const url = `https://deckofcardsapi.com/api/deck/${deck}/draw/?count=${numberOfCards}`
    fetch(url)
      .then(res => res.json())
      .then(drawnHands => {
        const handsDrawn = drawnHands.cards
        console.log(handsDrawn)
        let cardElements = handsDrawn.map((card: { code: string | null | undefined; image: string | undefined; value: number; suit: string; }) => (
            <img key={card.code} className="handCard" src={card.image} alt={`${card.value} of ${card.suit}`} />
        ))
        console.log(cardElements)
        setHands(cardElements)

      })
  }



  return (
    <div className="App">
      <header className="App-header">
        <h1>Sequence Game</h1>
        <button onClick={newDeck}>New Deck</button>
        <button onClick={newHands}>New Hands</button>
        <div className="drawn-hand"> {hands} </div>
       
      </header>
    </div>
  );
}

export default App;
