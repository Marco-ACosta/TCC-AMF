"use client"

import Box from "@/components/base/Box"
import Screen from "@/components/base/Screen"

type IndividualBoardScreenProps = {
    params: {
        id: string
    }
}

export default function IndividualBoardScreen({ params }: IndividualBoardScreenProps) {
    const { id } = params

    return (
        <Screen>
            <Box.Column>
                <h1>Project Template Web</h1>
                <h2>BOARD id = { id }</h2>
            </Box.Column>
        </Screen>
    )
}