import { Avatar } from "@mui/material"
import Box from "../Box"
import theme from "@/config/theme"

export default function Section() {
    const sectionListExample = [{name: "CRM", color: "blue"}, {name: "FIN", color: "green"}, {name: "SUP", color: "yellow"}]

    return <Box.Column
        style={{
            backgroundColor: theme.primary,
            color: theme.textColor,
            width: "100%",
            alignItems: "center",
            padding: 10,
            gap: 10,
        }}
    >
        <h3>MÓDULOS</h3>
        <Box.Column style={{ gap: 5 }}>
            {
                sectionListExample.map((example, i) => (
                    <Avatar
                        sx={{ color: theme.textColor, bgcolor: example.color }}
                        style={{ width: 50, height: 50 }}
                        key={ i }
                    >
                        { example.name }
                    </Avatar>
                ))
            }
        </Box.Column>
    </Box.Column>
}