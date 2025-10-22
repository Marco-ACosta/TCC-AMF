import ExampleContextComponent from "@/contexts/ExampleContext";
import { JSX } from "react";

type GlobalProviderProps = {
  children: JSX.Element | JSX.Element[];
};

export default function GlobalProvider({ children }: GlobalProviderProps) {
  return <ExampleContextComponent>{children}</ExampleContextComponent>;
}
