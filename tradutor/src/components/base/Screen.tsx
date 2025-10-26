import { CircularProgress } from "@mui/material"
import Box from "./Box"

/** Propriedades do componente Screen */
type ScreenProps = {
    /** Componentes filhos. */
    children: JSX.Element | JSX.Element[]
    /** Componente personalizado para header. */
    headerComponent?: JSX.Element
    /** Aparição do header. */
    showHeader?: boolean
    /** Componente personalizado para footer. */
    footerComponent?: JSX.Element
    /** Aparição do footer. */
    showFooter?: boolean
    /** Componente personalizado para section. */
    sectionComponent?: JSX.Element
    /** Largura da section. */
    sectionWidth?: number
    /** Aparição do section. */
    showSection?: boolean
    /** Customizações para tela padrão de carregamento. */
    loading?: {
        isLoading: boolean
        loadingText?: string
        showHeader?: boolean
        showFooter?: boolean
    }
}

/**
 * Componente base para telas.
 * */
export default function Screen({
    children,
    headerComponent,
    showHeader = true,
    footerComponent,
    showFooter = true,
    sectionComponent,
    sectionWidth,
    showSection = true,
    loading,
}: ScreenProps) {
    // Se o header existe e deve aparecer, é montado
    const header = headerComponent && showHeader
        ? (
            <header style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
            }}>
                { headerComponent }
            </header>
        )
        : <></>

    // Se o footer existe e deve aparecer, é montado
    const footer = footerComponent && showFooter
        ? (
            <footer style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
            }}>
                { footerComponent }
            </footer>
        )
        : <></>

    // Se o section existe e deve aparecer, é montado
    const _section = sectionComponent && showSection
        ? (
            <section style={{
                display: "flex",
                flexDirection: "row",
                width: sectionWidth ? `${ sectionWidth }%` : "unset",
            }}>
                { sectionComponent }
            </section>
        )
        : <></>

    return (
        <div
            className="screen"
            style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
            }}
        >
            {
                (loading && loading.isLoading)
                    ? <>
                        { loading.showHeader && header }
                        <main style={{
                            flex: 1,
                            display: "flex",
                            width: "100%",
                        }}>
                            <Box.Column
                                style={{
                                    flex: 1,
                                    flexGrow: 1,
                                    flexShrink: 1,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignContent: "center",
                                    alignItems: "center",
                                    gap: 15,
                                }}
                            >
                                <h1>{ loading.loadingText ? loading.loadingText : "Carregando" }</h1>
                                <CircularProgress size={ 30 } />
                            </Box.Column>
                        </main>
                        { loading.showFooter && footer }
                    </>
                    : <>
                        { header }
                        <main style={{
                            flex: 1,
                            display: "flex",
                            width: "100%",
                        }}>
                            { _section }
                            <div style={{
                                flex: 1,
                                flexGrow: 1,
                                flexShrink: 1,
                                display: "flex",
                            }}>
                                { children }
                            </div>
                        </main>
                        { footer }
                    </>
            }
        </div>
    )
}