import { StyleSheet, ScrollView, StyleProp, ViewStyle } from "react-native"
import { JSX } from "react"

type ScreenProps = {
    children: JSX.Element[] | JSX.Element
    flex?: boolean
    compStyle?: StyleProp<ViewStyle>
}

/** Componente padrão de tela */
export const Screen: React.FC<ScreenProps> = ({
    children,
    flex = true,
    compStyle = {},
}) => {
    return (
        <ScrollView
            contentContainerStyle={{
                ...styles.container,
                ...compStyle as any,
                flex: flex ? 1 : "auto"
            }}
        >
            { children }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 10,
    },
})