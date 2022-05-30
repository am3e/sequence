import React, { useState } from 'react'
import { CardInfo } from "./interfaces"

const Context = React.createContext<any>(null)

function ContextProvider({children } : { children : any}) {
    const boo = ''

    const getCardSymbol = (cardcode : string) => {
        let suit
        let value
        let suitcolor
        if (cardcode[1] === "C") {
            suit = "♣"
        } else if (cardcode[1] === "D") {
            suit = "♦"
        } else if (cardcode[1] === "H") {
            suit = "♥"
        } else if (cardcode[1] === "S") {
            suit = "♠"
        }
        if (cardcode[1] === "C" || cardcode[1] === "S") {
            suitcolor = 'blacksuit'
        } else if (cardcode[1] === "C" || cardcode[1] === "S") {
            suitcolor = 'redsuit'
        }
        value = cardcode[0] === '0' ? '10' : cardcode[0]
        return [suit, value, suitcolor]
    }
    

    return (
        <Context.Provider value={{
            boo,
            getCardSymbol,
        }}>
            {children}
        </Context.Provider>
    )
}

export {ContextProvider, Context}

