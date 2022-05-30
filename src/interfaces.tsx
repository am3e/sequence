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

//   export interface AppContextInterface {
//     // name: string;
//     // author: string;
//     // url: string;
//     string || undefined
//   }