import CustomModal, { CustomModalProps } from "../customs/CustomModal"
import Box from "./Box"
import { StyleSheet, Text } from "react-native"
import { JSX } from "react"

type ModalBoxProps = Omit<CustomModalProps, "children">  & {
    title?: string
    description: string[] | JSX.Element[] | JSX.Element
    children?: JSX.Element
    alignDescriptionInCenter?: boolean
}

export default function ModalBox({ title, description, children, alignDescriptionInCenter = true, ...customModalProps }: ModalBoxProps) {
    const renderModalContent = (): JSX.Element => {
        if (description instanceof Array) {
            if (description.length === 0)
                return <></>
            if (typeof description[0] === "string") {
                return (
                    <Box.Column style={ styles.contentContainer }>
                        {
                            (description as string[])
                                .map((text, i) => (
                                    <Text style={ styles.contentText } key={ i }>{ text }</Text>
                                ))
                        }
                    </Box.Column>
                )
            }
            else {
                return (
                    <Box.Column style={ styles.contentContainer }>
                        { description as JSX.Element[] }
                    </Box.Column>
                )
            }
        }
        else {
            return (
                <Box.Column style={ styles.contentContainer }>
                    { description }
                </Box.Column>
            )
        }
    }

    return (
        <>
            <CustomModal { ...customModalProps }>
                <Box.Column style={{
                    ...styles.container,
                    alignItems: alignDescriptionInCenter ? "center" : "flex-start",
                }}>
                    {
                        title
                            ? <>
                                <Box.Row style={ styles.titleContainer }>
                                    <Text style={ styles.titleText }>{ title }</Text>
                                </Box.Row>
                                { renderModalContent() }
                            </>
                            : renderModalContent()
                    }
                </Box.Column>
            </CustomModal>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "darkblue",
        width: "80%",
        gap: 10,
        padding: 10,
        borderRadius: 15,
    },
    titleContainer: {
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "white",
    },
    contentContainer: {
        gap: 5,
    },
    titleText: {
        color: "white",
        fontSize: 22,
        width: "100%",
    },
    contentText: {
        color: "white",
        fontSize: 18,
    },
})