import React from "react";
import { PlayerInfo, CardInfo } from "../interfaces";
import { Context } from "../Context";

// prettier-ignore
const layout : string[] = [
    "S",	"AC",	"KC",	"QC",	"0C",	"9C",	"8C",	"7C",	"6C",	"S",
    "AD",	"7S",	"8S",	"9S",	"0S",	"QD",	"KS",	"AS",	"5C",	"2S",
    "KD",	"6S",	"0C",	"9C",	"8C",	"7C",	"6C",	"2D",	"4C",	"3S",
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
    playerId,
    user,
    hands,
    boardTokens,
    confirmPlayers,
    disableBoard
  }: {
    handleCardClick: (user : string | undefined, boardCard : string, index : number) => void;
    activeCard: string | null | undefined;
    players: PlayerInfo[];
    activePlayer: number;
    playerId: number;
    user: string | undefined;
    hands: CardInfo[] | null | undefined;
    boardTokens: number[];
    confirmPlayers: boolean;
    disableBoard: boolean;
  }) => {
    let hand: string[] = [];
    const { getCardSymbol } = React.useContext(Context)
    hands && hands.map((cardS) => hand.push(cardS.code)); 
    let boardDiv: any;
    let boardElements = layout.map((boardCard: string, index: number) => {
        const active = activeCard === boardCard ? "active" : "";
        const playedToken = boardTokens[index] !== -1 ? `selected player${boardTokens[index]}` : '' ;
        const cardFound = hand.find((card) => card === boardCard);
        const inHand =  cardFound || playedToken ? "" : "overlay";
        const cardToken = cardFound ? `cardToken player${playerId}` : "";
        const tokenStyles = ` ${playedToken}`;
        const all = `${active} ${cardToken} ${inHand}`
        let value
        let suit
        let suitcolor
        
        if (boardCard === "S") {
            return (
            <div key={index} className="setGrid">
                <div
                id={boardCard}
                key={index}
                className={all}
                >
                ♣♦♥♠
                </div>
            </div>
            );
        }

        if (boardCard.length === 2) {
            const result = getCardSymbol(boardCard)
            suit = result[0]
            value = result[1]
            suitcolor = result[2]
        }
        console.log(value, suit)

        return (
            <div key={index} className="setGrid">
            <div
                id={boardCard}
                key={index}
                className={`${all} ${suitcolor}`}
                onClick={() => handleCardClick(user, boardCard, index)}
            >
                {boardTokens[index] !== -1 && <div className={tokenStyles}>{value} {suit}</div>}
                {boardTokens[index] === -1 && `${value} ${suit}`}
            </div>
            </div>
        );
    });

    boardDiv = <div className={`game-board grid ${(activePlayer !== playerId) ? 'disableBoard' : ''}`}>{boardElements}</div>;

    return boardDiv;
}


  export default Board