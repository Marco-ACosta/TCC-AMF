import { Switch, Text, View, StyleSheet, SwitchProps } from "react-native"

type CustomSwitchProps = {
    label: string
    value: boolean
    onChange: (e: boolean) => any
    innerProps?: SwitchProps
}

export default function CustomSwitch({ label, value, onChange, innerProps }: CustomSwitchProps) {
    return (
        <View style={ styles.switch }>
            <Text>{ label }</Text>
            <Switch
                value={ value }
                onValueChange={ (e) => onChange(e) }
                { ...innerProps }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    switch: {
        display: "flex",
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
    },
})