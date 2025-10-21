import { StyleProp, View, ViewStyle } from "react-native"
import { JSX } from "react"

type CustomBoxProps<T> = {
    children: JSX.Element | JSX.Element[]
    style?: StyleProp<T>
    onPress?: () => void
}

type BoxProps = {
    Column: (props: CustomBoxProps<ViewStyle>) => JSX.Element
    Center: (props: CustomBoxProps<ViewStyle>) => JSX.Element
    Row: (props: CustomBoxProps<ViewStyle>) => JSX.Element
}

const Box: BoxProps = { 
    Column: ({ children, style, onPress }) => {
        return <View
            style={{
                display: "flex",
                flexDirection: "column",
                ...style as any,
            }}
            onTouchStart={ () => { onPress ? onPress() : null }}
        >
            { children }
        </View>
    },
    Center: ({ children, style, onPress }) => {
        return <View
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                ...style as any,
            }}
            onTouchStart={ () => { onPress ? onPress() : null }}
        >
            { children }
        </View>
    },
    Row: ({ children, style, onPress }) => {
        return <View
            style={{
                display: "flex",
                flexDirection: "row",
                ...style as any,
            }}
            onTouchStart={ () => { onPress ? onPress() : null }}
        >
            { children }
        </View>
    },
}

export default Box