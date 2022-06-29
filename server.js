const { default: userEvent } = require('@testing-library/user-event');
const e = require('express');
const WebSocket = require('ws');


const wss = new WebSocket.Server({ port: 8080 });
const sequence = {
    game: {
        discardpile: [],
        boardTokens: [],
        winner: '',
        deck: [],
        isPlaying: false,
        players: [],
        numberOfPlayers: 0,
    },
    nextPlayers: [],
    users: []
}
const {game, users} = sequence;



wss.on('connection', function connection(ws) {

    ws.send( JSON.stringify({
        type: "game",
        game,
    }));

    ws.send( JSON.stringify({
        type: "users",
        users: users.map(user => ({                    
            name: user.name,
            id: user.id,
            connections: user.webSockets.length
        }))
    }));
    
    ws.on("close", function() {
        users.forEach(user => {
            user.webSockets = user.webSockets.filter(webSocket => webSocket !== ws )
        });
        //todo: remove user if zero websockets and not playing
    });

    ws.on('message', function incoming(data) {
        const parsedData = JSON.parse(data)
        if (parsedData.type === "userevent") {
            const existingUser = users.find(user => user.id === parsedData.id)
            if (!existingUser) {
                const newUser = {
                    name: parsedData.playerUsername,
                    id: parsedData.id,
                    webSockets: [ws]
                };
                users.push(newUser);
                ws.user = newUser;
            } else {
                existingUser.webSockets.push(ws);
            }
            console.log('usersss', users)
            users.map(user => {
                const messages = []
                messages.push({
                    type: "userevent",
                    username: user.name,
                    userid: user.id
                })
                sendMessages(user.id, messages)
            })
        }
        if ( parsedData.type === "joingame") {
            const {nextPlayers} = sequence;
            console.log('joingame', parsedData)
            console.log(nextPlayers)
            if (nextPlayers.length < 2 && !game.isPlaying) {

                const playerIndex = nextPlayers.length+1
                const playerInformation = addPlayerInfo(playerIndex, ws.user.name, ws.user.id)
                nextPlayers.push(playerInformation)

                if (nextPlayers.length === 2) {
                    game.players = nextPlayers;
                    sequence.nextPlayers = [];
                    game.numberOfPlayers = 2
                    console.log('startgame/newgame',game)
                    const activePlayer = game.players[0].id
                    const activePlayerUsername = game.players[0].userName
                    console.log('activePlayer', activePlayer)
                    game.deck = createDeck()
                    game.boardTokens = new Array(100).fill(-1)
                    game.isPlaying = true
                    game.players.map(player => {
                        sendMessages(player.userId, [
                            {
                                type: "startgame",
                                game,
                            },
                            {
                                type: "playerinfo",
                                hand: drawCard(game.deck, 7),
                                user: player.userId,
                                players: game.players,
                                playerIndex: player.id,
                                activePlayer: activePlayer,
                                activePlayerUsername: activePlayerUsername,
                            }
                        ])
                    })
                }
            }
        }
        if ( parsedData.type === "playerturn") {
            const activePlayerIndex = game.players.findIndex(player => player.id === parsedData.playerId)
            const currentHand = parsedData.hand
            const newCard = drawCard(game.deck, 1)
            const discardCard = currentHand[parsedData.cardIndex]
            const updateHands = currentHand
            updateHands.splice(parsedData.cardIndex,1)
            updateHands.push(newCard[0])
            game.players[activePlayerIndex].totalTokens = game.players[activePlayerIndex].totalTokens - 1
            console.log(game, game.players, activePlayerIndex)

            const nextActivePlayer = activePlayerIndex === game.numberOfPlayers - 1 ? 0 : activePlayerIndex + 1;
            const activePlayer = game.players[nextActivePlayer].id
            const activePlayerUsername = game.players[nextActivePlayer].userName
            const boardTokenBoardIndex = parsedData.useKillcard ? -1 : parsedData.playerId
            game.boardTokens[parsedData.boardindex] = boardTokenBoardIndex

            game.discardpile.push(discardCard)
            const winnerArray = checkWinner(game.boardTokens, parsedData.playerId)
            const winnerUsername = winnerArray ? game.players[activePlayerIndex].userName : ''
            game.winner = winnerUsername
            game.isPlaying = winnerUsername == '';

            console.log(game.deck.length,'decklength')
            game.players.map((player, index) => {
                const messages = [];
                if (index === activePlayerIndex) {
                    messages.push( 
                        {
                            type: "updatehand",
                            hand: updateHands,
                            user: player.userName,
                            playerIndex: player.id,
                            remainingTokens: player.totalTokens,
                        }
                    ); 
                }
                messages.push( {
                    type: "playerturn",
                    activePlayer: activePlayer,
                    activePlayerUsername: activePlayerUsername,
                    boardIndexChange: parsedData.boardindex,
                    boardIndexPlayer: boardTokenBoardIndex,
                    discarded: discardCard,
                    remainingCards: game.deck.length,
                    winner: winnerUsername,
                    winnerArray: winnerArray,
                })                
                sendMessages(player.userId, messages);
                if (game.winner !== '') {
                    game.discardpile = []
                    game.boardTokens = []
                    game.winner = ''
                    game.deck = []
                    game.isPlaying = false
                    game.players = []
                    game.numberOfPlayers = 0
                }
            })
            users.map(user => {
                const messages = [];
                messages.push( {
                    type: "playerturn",
                    activePlayer: activePlayer,
                    activePlayerUsername: activePlayerUsername,
                    boardIndexChange: parsedData.boardindex,
                    boardIndexPlayer: boardTokenBoardIndex,
                    discarded: discardCard,
                    remainingCards: game.deck.length,
                    winner: winnerUsername,
                    winnerArray: winnerArray,
                })                
                sendMessages(user.id, messages);
            })

        }

    })
})

const sendMessages = (userId, messages) => {
    const user = users.find(user => user.id === userId)
    if (user) {
        messages.forEach(message => user.webSockets.forEach(webSocket => {
            webSocket.send( JSON.stringify(message));
        }))
    } else {
        console.error(`user not found ${userId}`)
    }
}

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

const addPlayerInfo = (playerId, name, userId) => {
    let playersInfo= {
        userName: name,
        userId,
        id: playerId,
        player_id: `player${playerId}`,
        totalTokens: 50,
        completedRows: 0
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