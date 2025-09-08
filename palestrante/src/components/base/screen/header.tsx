import { Button } from "@mui/material"
import Box from "../Box"
import theme from "@/config/theme"

export default function Header() {
    return <Box.Row
        style={{
            backgroundColor: theme.primary,
            color: theme.textColor,
            justifyContent: "space-between",
            padding: "10px 20px 10px 20px",
            width: "100%",
            boxShadow: theme.boxShadowBlack,
            zIndex: 1,
        }}
    >
        <h1>HEADER</h1>
        <Box.Row style={{ gap: 10 }}>
            <Button variant="outlined">
                Ação 01
            </Button>
            <Button variant="contained">
                Ação 02
            </Button>
        </Box.Row>
    </Box.Row>
}