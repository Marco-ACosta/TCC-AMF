"use client"

import { AuthContextProvider } from "../../contexts/AuthContext"
import { redirect } from "next/navigation"
import { useLayoutEffect } from "react"
import Screen from "./Screen"

type AuthRouteProps = {
    children: JSX.Element | JSX.Element[]
}

export default function AuthRoute({ children }: AuthRouteProps) {
    const { isLogged } = AuthContextProvider()

    useLayoutEffect(() => {
        if (!isLogged) {
            redirect("/")
        }
    }, [])

    if (!isLogged) {
        return <Screen>
            <h1>Nao logado</h1>
        </Screen>
    }

    return children
}