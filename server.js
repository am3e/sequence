const { default: userEvent } = require('@testing-library/user-event');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8083 });
const game = {}
game.numberOfPlayers = 0
game.players = []
game.discardpile = []
game.winner = ''

wss.on('connection', function connection(ws) {
    let messages = ''

    ws.on('message', function incoming(data) {
        const parsedData = JSON.parse(data)
        if (parsedData.type === "userevent") {
            
            existingPlayer = game.players.find(player => player.ws === ws)
            if (!existingPlayer) {
                const playerIndex = game.players.length+1
                const playerInformation = addPlayerInfo(playerIndex, parsedData.playerUsername, ws)
                game.players.push(playerInformation)
                game.numberOfPlayers = game.numberOfPlayers + 1
            }
        }
        if ( parsedData.type === "startgame") {
            game.deck = createDeck()
            game.boardTokens = new Array(100).fill(-1)
            console.log('startgame/newgame',game)
            const activePlayer = game.players[0].id
            const activePlayerUsername = game.players[0].userName
            console.log('activePlayer', activePlayer)
            game.players.map(player => {
                player.ws.send(JSON.stringify( {message: "begin", type: "startgame"} ))
                player.ws.send( JSON.stringify({
                    type: "playerinfo",
                    hand: drawCard(game.deck, 5),
                    user: player.userName,
                    playerIndex: player.id,
                    activePlayer: activePlayer,
                    activePlayerUsername: activePlayerUsername,
                }));

            })
        }
        if ( parsedData.type === "playerturn") {
            const activePlayerIndex = game.players.findIndex(player => player.id === parsedData.playerId)
            const currentHand = parsedData.hand
            const newCard = drawCard(game.deck, 1)
            const discardCard = parsedData.cardIndex
            const updateHands = currentHand
            updateHands.splice(discardCard,1)
            updateHands.push(newCard[0])

            const nextActivePlayer = activePlayerIndex === game.numberOfPlayers - 1 ? 0 : activePlayerIndex + 1;
            const activePlayer = game.players[nextActivePlayer].id
            const activePlayerUsername = game.players[nextActivePlayer].userName
            console.log('1', game.boardTokens[parsedData.boardindex], parsedData.useKillcard, parsedData.boardindex)
            const boardTokenBoardIndex = parsedData.useKillcard ? -1 : parsedData.playerId
            game.boardTokens[parsedData.boardindex] = boardTokenBoardIndex
            console.log('2', game.boardTokens[parsedData.boardindex])

            game.discardpile.push(parsedData.card)
            const winnerArray = checkWinner(game.boardTokens, parsedData.playerId)
            const winnerUsername = winnerArray ? game.players[activePlayerIndex].userName : ''
            game.winner = winnerUsername

            game.players.map((player, index) => {
                if (index === activePlayerIndex) {
                    player.ws.send(JSON.stringify({
                        type: "updatehand",
                        hand: updateHands,
                        user: player.userName,
                        playerIndex: player.id,
                    }))
                }
                player.ws.send(JSON.stringify({
                    type: "playerturn",
                    activePlayer: activePlayer,
                    activePlayerUsername: activePlayerUsername,
                    boardIndexChange: parsedData.boardindex,
                    boardIndexPlayer: boardTokenBoardIndex,
                    discarded: parsedData.card,
                    winner: winnerUsername,
                    winnerArray: winnerArray,
                }))
                if (game.winner !== '') {
                    game.discardpile = []
                    game.boardTokens = []
                    game.winner = ''
                    game.deck = []
                }
            })

        }

        wss.clients.forEach(function each(client) {
            //excludes sending when client is itself
            // if (client !== ws && client.readyState === WebSocket.OPEN) {
            if (client.readyState === WebSocket.OPEN) {
                // console.log(data.toString())
                // console.log('hm', parsedData.type)
                client.send(JSON.stringify(messages))

                
                // if ( parsedData.type === "submitdeck") {
                //     console.log('something went there')
                //     client.send(data)
                //     console.log('submitdeck data',data.toString())
                // }
                // console.log('nothing')
                
            }
        })
    })
})

//need to know what happens when the client says a state change occured
// first need to know if client has joined a game, how many joined a game - done
// then need to know if client wants to start a game.. - done
//server needs to hold state of the cards deck array and the discared deck array too - kinda done
//the client validates if the card can be used as it is already completed
//then the server updates everyone's board/boardtoken array and checks if there is a winner to end the game and which player's turn it is

const suits = ['D', 'H', 'C', 'S'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];

const createDeck = () => {
    let index = 0
    const deck = []
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
    return deck
}

const addPlayerInfo = (playerId, user, ws) => {
    let playersInfo= {
        userName: user,
        id: playerId,
        player_id: `player${playerId}`,
        totalTokens: 50,
        completedRows: 0,
        ws
    };
    return playersInfo
};

//server sends cards
const drawCard = (cardsArray, number) => {
    let cards = [];
    const drawnCards = cardsArray.splice(0, number)
    drawnCards.map(card => cards.push(card))
    return cards;
};

//server checks winner
const checkWinner = (arr, player) => {

    const horizonatal = boardTokenSearch('horizonatal', player, arr, 1)
    const vertical = boardTokenSearch('vertical', player, arr, 10)
    const descdiagonal = boardTokenSearch('descdiagonal', player, arr, 11)  
    const ascdiagonal = boardTokenSearch('ascdiagonal', player, arr,9)  
    
    return  descdiagonal || ascdiagonal || horizonatal || vertical
    
  }
  
const boardTokenSearch = (type, player, arr, increment) => {
let winner = []
for (let i = 0; i < arr.length; i++) {
    const iWildcard = i === 0 || i === 9 || i === 90 || i === 99 ? true : false
    if (arr[i] === player || iWildcard) {
    winner.push(i) 
    for (let j = i + increment; j < arr.length; j += increment) {
        const jWildcard = j === 0 || j === 9 || j === 90 || j === 99 ? true : false

        if (arr[j] === player) {
        winner.push(j)
        if (winner.length === 5) {
            return winner
        }
        } else if (winner.length === 4 && jWildcard) {
        winner.push(j)
        return winner
        } else {
        winner = []
        break
        }
    }
    winner = []
    } 
}
}


// const newDeck = () => {
//   const numberOfDecks = 2;
//   const url = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${numberOfDecks}`;
//   fetch(url)
//     .then((res) => res.json())
//     .then((decks) => {
//       setDeck(decks.deck_id);
//     });
// };

// const drawCard = (deck, numberOfCards) => {
// let cards = [];
// const numberOfCards = number;
// const url = `https://deckofcardsapi.com/api/deck/${deck}/draw/?count=${numberOfCards}`;
// fetch(url)
//     .then((res) => res.json())
//     .then((drawnHands) => {
//     const handsDrawn = drawnHands.cards;
//     handsDrawn.map(
//         (card) =>
//         cards.push({
//             code: card.code,
//             image: card.image,
//             value: card.value,
//             suit: card.suit,
//         })
//     );
//     });
// };