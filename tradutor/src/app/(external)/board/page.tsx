"use client"

import Box from "@/components/base/Box"
import Link from "next/link"
import Screen from "@/components/base/Screen"

type CardProps = {
    id: string
}

export default function BoardScreen() {
    const board: CardProps[] = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
        { id: "5" },
    ]

    return (
        <Screen>
            <Box.Column>
                <h1>Project Template Web</h1>
                <h2>BOARD</h2>
                <Box.Column>
                    {
                        board.map((boardCard, i) => <Link href={ `/board/${ boardCard.id }` } key={ i }>Card { boardCard.id }</Link>)
                    }
                </Box.Column>
            </Box.Column>
        </Screen>
    )
}