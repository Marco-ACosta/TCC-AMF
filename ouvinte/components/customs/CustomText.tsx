import { StyleProp, Text, TextStyle } from "react-native"

interface CustomTextProps {
    children: string | number
    style?: StyleProp<TextStyle>
    size?: "s" | "m" | "l" | "xl" | "xxl"
    isOpposite?: boolean
    weight?: "thin" | "normal" | "bold"
    onPress?: () => void
    selectable?: boolean
}

const CustomText: React.FC<CustomTextProps> = ({
    children,
    style = {},
    size = "m",
    isOpposite = false,
    weight = "normal",
    onPress,
    selectable = false,
}) => {
    const defineTextSize = () => {
        switch (size) {
            case "s": return 12
            case "m": return 14
            case "l": return 16
            case "xl": return 18
            case "xxl": return 20
        }
    }

    const defineTextWeight = () => {
        switch (weight) {
            case "thin": return 300
            case "normal": return 400
            case "bold": return 700
        }
    }

    return (
        <Text
            style={{
                color: isOpposite ? "white" : "black",
                fontSize: defineTextSize(),
                fontWeight: defineTextWeight(),
                ...style as any,
            }}
            onPress={ () => onPress ? onPress() : {} }
            selectable={ selectable }
        >
            { children }
        </Text>
    )
}

export default CustomText