import {
    DimensionValue,
    Pressable,
    PressableProps,
    Text,
    TextStyle,
    TouchableHighlight,
    TouchableHighlightProps,
    TouchableOpacity,
    TouchableOpacityProps,
} from "react-native"

export type CustomButtonProps = {
    /** Título do botão */
    title: string
    /** Ação realizada após clique no botão */
    onPress: () => any
    /** Animação de clique no botão */
    btnAnimation?: "none" | "opacity" | "highlight" 
    /** Botão ativo */
    active?: boolean
    /** Cor de fundo do botão */
    btnColor?: string
    /** Cor do texto do botão */
    btnTextColor?: string
    /** Largura do botão */
    btnWidth?: DimensionValue
    /** Altura do botão */
    btnHeight?: DimensionValue
    /** Estilo do texto */
    titleStyle?: {
        fontWeight: TextStyle["fontWeight"]
        fontSize: number
    }
    /** Propriedades do botão (irão sobrepor as outras) */
    innerProps?: PressableProps | TouchableHighlightProps | TouchableOpacityProps
}

/** Componente customizado para botão */
export default function CustomButton({
    title,
    onPress,
    btnAnimation = "opacity",
    active = true,
    btnColor = "#38B4E1",
    btnTextColor = "black",
    btnWidth = "auto",
    btnHeight = "auto",
    titleStyle = {
        fontWeight: "light",
        fontSize: 16,
    },
    innerProps = {},
}: CustomButtonProps) {
    const btnStyle: any = {
        width: btnWidth,
        height: btnHeight,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: active ? btnColor : "gray",
        borderStyle: "solid",
        justifyContent: "center",
        alignItems: "center",
        padding: 3,
    }
    const btnText = <Text style={{ color: btnTextColor, fontWeight: titleStyle.fontWeight, fontSize: titleStyle.fontSize, padding: 5 }}>{ title }</Text>

    if (btnAnimation === "highlight") {
        return (
            <TouchableHighlight
                style={ btnStyle }
                disabled={ !active }
                onPress={ async () => { await onPress() }}
                { ...innerProps as any }
            >
                { btnText }
            </TouchableHighlight>
        )
    }

    if (btnAnimation === "opacity") {
        return (
            <TouchableOpacity
                style={ btnStyle }
                disabled={ !active }
                onPress={ async () => { await onPress() }}
                { ...innerProps as any }
            >
                { btnText }
            </TouchableOpacity>
        )
    }

    return (
        <Pressable
            style={ btnStyle }
            disabled={ !active }
            onPress={ async () => { await onPress() } }
            { ...innerProps as any }
        >
            { btnText }
        </Pressable>
    )
}