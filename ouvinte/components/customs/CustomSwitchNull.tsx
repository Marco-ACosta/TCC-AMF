import { View, Text, Switch } from "react-native"
import CustomButton from "./CustomButton"

type SwitchNullProps = {
    /** Nome do switch */
    label: string
    /** Nome do botão de anulação do switch */
    btnTitle: string
    /** O valor do switch é nulo (não é falso ou verdadeiro) */
    isSwitchNull: boolean
    /** Set State para se o valor do switch é nulo */
    setSwitchNull: React.Dispatch<React.SetStateAction<boolean>>
    /** Valor do switch */
    switchValue: any
    /** Set State do valor do switch */
    setSwitchValue: (value: any) => void
}

export default function SwitchNull({
    label,
    btnTitle,
    isSwitchNull,
    setSwitchNull,
    switchValue,
    setSwitchValue,
}: SwitchNullProps) {
    return (
        <View>
            <Text>{ label }</Text>
            <CustomButton
                title={ btnTitle }
                onPress={ () => {
                    setSwitchNull(!isSwitchNull)
                    // Caso anulação do switch, o valor do switch é nulo
                    if (!isSwitchNull) setSwitchValue(null)
                }}
            />
            {
                isSwitchNull
                    ? <></>
                    : (
                        <Switch
                            value={ switchValue! }
                            onValueChange={ (e) => setSwitchValue(e) }
                        />
                    )
            }
        </View>
    )
}