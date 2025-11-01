import { CircularProgress } from "@mui/material";
import Box from "./Box";
import { LoadingBlock } from "./LoadState";

type ScreenProps = {
  children: JSX.Element | JSX.Element[];
  headerComponent?: JSX.Element;
  showHeader?: boolean;
  footerComponent?: JSX.Element;
  showFooter?: boolean;
  sectionComponent?: JSX.Element;
  sectionWidth?: number;
  showSection?: boolean;
  loading?: {
    isLoading: boolean;
    loadingText?: string;
    showHeader?: boolean;
    showFooter?: boolean;
  };
};

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
  const header =
    headerComponent && showHeader ? (
      <header
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}>
        {headerComponent}
      </header>
    ) : (
      <></>
    );

  const footer =
    footerComponent && showFooter ? (
      <footer
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}>
        {footerComponent}
      </footer>
    ) : (
      <></>
    );

  const _section =
    sectionComponent && showSection ? (
      <section
        style={{
          display: "flex",
          flexDirection: "row",
          width: sectionWidth ? `${sectionWidth}%` : "unset",
        }}>
        {sectionComponent}
      </section>
    ) : (
      <></>
    );

  return (
    <div
      className="screen"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
      {loading && loading.isLoading ? (
        <LoadingBlock full />
      ) : (
        <>
          {header}
          <main
            style={{
              flex: 1,
              display: "flex",
              width: "100%",
            }}>
            {_section}
            <div
              style={{
                flex: 1,
                flexGrow: 1,
                flexShrink: 1,
                display: "flex",
              }}>
              {children}
            </div>
          </main>
          {footer}
        </>
      )}
    </div>
  );
}
