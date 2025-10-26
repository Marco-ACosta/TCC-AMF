import { CSSProperties } from "react"

type CustomBoxProps = {
    children: JSX.Element | JSX.Element[]
    style?: CSSProperties 
    onClick?: () => void
}

type BoxProps = {
    Column: (props: CustomBoxProps) => JSX.Element
    Center: (props: CustomBoxProps) => JSX.Element
    Row: (props: CustomBoxProps) => JSX.Element
}

const Box: BoxProps = { 
    Column: ({ children, style, onClick }) => {
        return <div
            style={{
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
            onClick={ () => { onClick ? onClick() : null }}
        >
            { children }
        </div>
    },
    Center: ({ children, style, onClick }) => {
        return <div
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                ...style,
            }}
            onClick={ () => { onClick ? onClick() : null }}
        >
            { children }
        </div>
    },
    Row: ({ children, style, onClick }) => {
        return <div
            style={{
                display: "flex",
                flexDirection: "row",
                ...style,
            }}
            onClick={ () => { onClick ? onClick() : null }}
        >
            { children }
        </div>
    },
}

export default Box