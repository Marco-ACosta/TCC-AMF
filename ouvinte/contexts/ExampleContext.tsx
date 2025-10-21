import { Screen } from "../components/base/Screen"
import Loading from "../components/base/Loading"
import React, { createContext, JSX, useContext, useState } from "react"

type ExampleContextComponentProps = {
    children: JSX.Element | JSX.Element[]
}

type ExampleContextProps = {}

const ExampleContext = createContext<ExampleContextProps | null>(null)

export default function ExampleContextComponent({ children }: ExampleContextComponentProps) {
    const [ loading, setLoading ] = useState<boolean>(false)

    if (loading) {
        return (
            <Screen>
                <Loading />
            </Screen>
        )
    }

    return (
        <ExampleContext.Provider value={{}}>
            { children }
        </ExampleContext.Provider>
    )
}

export function useExampleContext() {
    const context = useContext(ExampleContext)
    if (!context) throw new Error("ExampleContext chamado fora do provider.")
    return context
}
