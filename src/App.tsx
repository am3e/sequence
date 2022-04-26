import React, { useState, useCallback, useMemo } from "react";
// import { json } from 'stream/consumers';
import "./App.css";

interface CardInfo {
  code: string;
  image: string;
  value: string;
  suit: string;
  index: number;
}

interface PlayerInfo {
  id: number;
  player_id: string;
  totalTokens: number;
  hands: CardInfo[];
  tokens: number[];
  completedRows: number;
}

// prettier-ignore
const layout = [
  "S",	"AC",	"KC",	"QC",	"0C",	"9C",	"8C",	"7C",	"6C",	"S",
  "AD",	"7S",	"8S",	"9S",	"0S",	"QD",	"KS",	"AS",	"5C",	"2S",
  "KD",	"6S",	"0C",	"9C",	"8C",	"7S",	"6C",	"2D",	"4C",	"3S",
  "QD",	"5S",	"QC",	"8H",	"7H",	"6H",	"5C",	"3D",	"3C",	"4S",
  "0D",	"4S",	"KC",	"9H",	"2H",	"5H",	"4C",	"4D",	"2C",	"5S",
  "9D",	"3S",	"AC",	"0H",	"3H",	"4H",	"3C",	"5D",	"AH",	"6S",
  "8D",	"2S",	"AD",	"QH",	"KH",	"AH",	"2C",	"6D",	"KH",	"7S",
  "7D",	"2H",	"KD",	"QD",	"0D",	"9D",	"8D",	"7D",	"QH",	"8S",
  "6D",	"3H",	"4H",	"5H",	"6H",	"7H",	"8H",	"9H",	"0H",	"9S",
  "S",	"5D",	"4D",	"3D",	"2D",	"AS",	"KS",	"QS",	"0S",	"S"
]

const Board = ({
  handleCardClick,
  activeCard,
  players,
  activePlayer,
  token,
  boardTokens,
  confirmPlayers
}: {
  handleCardClick: (boardCard: string, index: number) => void;
  activeCard: string | null | undefined;
  players: PlayerInfo[];
  activePlayer: number;
  token: number | null;
  boardTokens: number[];
  confirmPlayers: boolean;
}) => {
  let hand: string[] = [];
  console.log(activePlayer,'activeplaher')
  if (confirmPlayers && players && activePlayer >= 0) {
    const { hands } = players[activePlayer];
    hands.map((cardS) => hand.push(cardS.code));
  }
  console.log(hand,'hand')
  let boardDiv: any;
  let boardElements = layout.map((boardCard: string, index: number) => {
    const active = activeCard === boardCard ? "active" : "";
    const playedToken = boardTokens[index] !== -1 ? `selected player${boardTokens[index]}` : '' ;
    const cardFound = hand.find((card) => card === boardCard);
    console.log('cardFound',cardFound)
    const inHand =  cardFound || playedToken ? "" : "overlay";
    const cardToken = cardFound ? `cardToken player${activePlayer+1}` : "";
    const overlayStyles = `${inHand}`;
    const tokenStyles = ` ${playedToken}`;
    const divStyles = `${active} ${cardToken}`;
    const all = `${active} ${cardToken} ${inHand}`

    //styles
    //overlay - diasbles cards not in hand
    //cardtoken - hovers overs cards you can put a token on
    //selected - after you click
    //player - displays a color
    //active - highlights the card in your hand

    if (boardCard === "S") {
      return (
        <div key={index} className="setGrid">
          <div
            id={boardCard}
            key={index}
            className={all}
            onClick={() => handleCardClick(boardCard, index)}
          >
            S
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="setGrid">
        <div
          id={boardCard}
          key={index}
          className={all}
          onClick={() => handleCardClick(boardCard, index)}
        >
          {boardTokens[index] !== -1 && <div className={tokenStyles}>{boardTokens[index]}</div>}
          {boardTokens[index] === -1 && boardCard}
        </div>
      </div>
    );
  });
  boardDiv = <div className="game-board grid">{boardElements}</div>;

  return boardDiv;
};

function App() {
  const [deck, setDeck] = useState("");
  const [deckArray, setDeckArray] = useState<CardInfo[]>([]);
  const [numberOfPlayers, setNumberOfPlayers] = useState(2);
  const [confirmPlayers, setConfirmPlayers] = useState(false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [activePlayer, setActivePlayer] = useState(0);
  const [activeCard, setActiveCard] = useState<string | null | undefined>("");
  const [token, setToken] = useState<number | null>(null);
  const [boardTokens, setBoardTokens] = useState<number[]>(
    new Array(100).fill(-1)
  );


  const handleCardClick = useCallback((boardCard, index) => {
    const activePlayerInfo = players[activePlayer];
    const { id, hands, tokens } = activePlayerInfo;
    const card = hands.find((card) => card.code === boardCard);
    if (card && boardTokens[index] === -1) {
      tokens.push(index);
      boardTokens[index] = id;
      setBoardTokens(boardTokens);
      setToken(index)

      setPlayers(players.map((prevPlayerInfo) => {
          if (prevPlayerInfo.id === id) {
            console.log('before',prevPlayerInfo)
            let newCard : CardInfo[] = drawCard(1)
            let updateHands : CardInfo[] = hands.filter((card : any) => card.code !== boardCard)
            updateHands.push(newCard[0])
            return ({
              ...prevPlayerInfo,
              hands: updateHands,
            })
          }
          else return prevPlayerInfo
          
        }))

      playersTurnUpdate()
    }

  }, [players, activePlayer, boardTokens]);

  const seeCard = (cardId: string | null | undefined) => {
    setActiveCard(cardId);
  };

  const newDeck = () => {
    const numberOfDecks = 2;
    const url = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${numberOfDecks}`;
    fetch(url)
      .then((res) => res.json())
      .then((decks) => {
        setDeck(decks.deck_id);
      });
  };

  const suits = ['D', 'H', 'C', 'S'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];
    
  const createDeck = () => {
    let index = 0
    const deck : CardInfo[] = []
    suits.map(suit => {
      values.map(value => {
        deck.push({
          code: `${value}${suit}`,
          image: ``,
          value: value,
          suit: `${suit}`,
          index: index,
        })
        index++
        deck.push({
          code: `${value}${suit}`,
          image: ``,
          value: value,
          suit: `${suit}`,
          index: index,
        })
        index++
      })
    })

    for (let i = deck.length - 1; i >= 0; i--) {
      let j = Math.floor(Math.random() * i)
      let tmp = deck[i]
      deck[i] = deck[j]
      deck[j] = tmp
    }
    setDeckArray(deck)
  }
    

  const confirmNumberOfPlayers = () => {
    setConfirmPlayers(true);
    let playersInfo: PlayerInfo[] = [];
    for (let i = 0; i < numberOfPlayers; i++) {
      let cardsPush = drawCard(5);
      let index = i + 1
      playersInfo.push({
        id: index,
        player_id: `player${index}`,
        totalTokens: 50,
        hands: cardsPush,
        completedRows: 0,
        tokens: [],
      });
    }
    setPlayers(playersInfo);
  };

  const playersTurnUpdate = () => {
    const nextActivePlayer = activePlayer === numberOfPlayers - 1 ? 0 : activePlayer + 1;
    console.log(numberOfPlayers)
    console.log(nextActivePlayer,'fdedws')
    setActivePlayer(nextActivePlayer)
    console.log(nextActivePlayer)
  };

  console.log(players,'i')

  const drawCard = (number: number): CardInfo[] => {
    console.log('drawing card')
    let cards: CardInfo[] = [];
    // const numberOfCards = number;
    // const url = `https://deckofcardsapi.com/api/deck/${deck}/draw/?count=${numberOfCards}`;
    // fetch(url)
    //   .then((res) => res.json())
    //   .then((drawnHands) => {
    //     const handsDrawn = drawnHands.cards;
    //     handsDrawn.map(
    //       (card: CardInfo) =>
    //         cards.push({
    //           code: card.code,
    //           image: card.image,
    //           value: card.value,
    //           suit: card.suit,
    //         })
    //     );
    //   });

    const drawnCards = deckArray.splice(0, number)
    drawnCards.map(card => cards.push(card))
    setDeckArray(deckArray)

    return cards;
  };

  const ActiveHand = useMemo(
    () => () => {
      if (activePlayer >= players.length) {
        return null;
      }
      const choosePlayer = players[activePlayer];
      const index = choosePlayer.id;
      const hands = choosePlayer.hands;
      let cards: any;
      let cardElements = hands.map((card) => (
        // <img
        //   key={`${card.deckIndex}`}
        //   id={`${card.code}`}
        //   className="handCard"
        //   src={card.image}
        //   onMouseEnter={() => seeCard(card.code)}
        //   />
        <div
          key={`${card.index}`}
          id={`${card.code}`}
          className={` handCard player${index}`}
          // src={card.image}
          onMouseEnter={() => seeCard(card.code)}
          >{card.code}</div>
        
      ));
      cards = (
        <div id={`${index}`} key={index}>
          <h2>Player {index}</h2>
          <div className="player-display">{cardElements}</div>
        </div>
      );
      return cards;
    },
    [activePlayer, players]
  );

  React.useEffect(
    () => createDeck(),
    [activeCard, activePlayer, activeCard, players, token]
  );

  return (
    <div className="App">
      <header className="App-header">
        <Board
          handleCardClick={handleCardClick}
          activeCard={activeCard}
          boardTokens={boardTokens}
          players={players}
          token={token}
          activePlayer={activePlayer}
          confirmPlayers={confirmPlayers}
        />
        <div className="player-side">
          <h1>Sequence Game</h1>
          {!confirmPlayers && (
            <input
              type="number"
              min="2"
              max="4"
              id="numberOfPlayers"
              name="numberOfPlayers"
              value={numberOfPlayers}
              onChange={(e) => setNumberOfPlayers(Number(e.target.value))}
            />
          )}
          {!confirmPlayers && (
            <button
              id="confirmPlayers"
              name="confirmPlayers"
              onClick={confirmNumberOfPlayers}
            >
              Start Game
            </button>
          )}
          <div className="drawn-hand">
            <ActiveHand />{" "}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
