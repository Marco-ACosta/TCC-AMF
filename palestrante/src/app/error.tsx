"use client"

import { Button, Modal } from "@mui/material"
import { useState } from "react"
import Box from "@/components/base/Box"
import Screen from "@/components/base/Screen"

export default function Error(error: any) {
    const [ open, setOpen ] = useState<boolean>(false)

    return (
        <Screen>
            <Box.Column>
                <h1>Ocorreu um erro, atualize a página.</h1>
                <h4>{ error.error.message }</h4>
                <Button onClick={() => setOpen(true)}>
                    Detalhes
                </Button>
            </Box.Column>
            <Modal
                open={ open }
                onClose={() => setOpen(false)}
            >
                <p>{ error.error.stack }</p>
            </Modal>
        </Screen>
    )
}