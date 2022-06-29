export interface CardInfo {
    code: string;
    image: string;
    value: string;
    suit: string;
    index: number;
  }
  
export interface PlayerInfo {
    userName: string | null | undefined;
    id: number;
    player_id: string;
    totalTokens: number;
    hands?: CardInfo[];
    completedRows: number;
  }

  export interface User {
    name: string;
    id: string;
    connections: number;
  }

  export interface Game {
    numberOfPlayers: string,
    players: PlayerInfo[],
    discardpile: CardInfo[],
    winner: string,
    isPlaying: boolean
  }

//   export interface AppContextInterface {
//     // name: string;
//     // author: string;
//     // url: string;
//     string || undefined
//   }