import { JSX } from "react"
import AuthContextComponent from "@/contexts/AuthContext"
import ExampleContextComponent from "@/contexts/ExampleContext"

type GlobalProviderProps = {
    children: JSX.Element | JSX.Element[]
}

export default function GlobalProvider({
    children,
}: GlobalProviderProps) {
    return (
        <ExampleContextComponent>
            <AuthContextComponent>
                { children }
            </AuthContextComponent>
        </ExampleContextComponent>
    )
}
