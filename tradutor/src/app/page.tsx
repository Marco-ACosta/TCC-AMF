"use client"

import Box from "@/components/base/Box"
import Header from "@/components/base/screen/header"
import Link from "next/link"
import Screen from "@/components/base/Screen"
import Section from "@/components/base/screen/section"

export default function HomeScreen() {
  return (
    <Screen
      headerComponent={ <Header /> }
      sectionComponent={ <Section /> }
    >
      <Box.Column>
        <h1>Project Template Web</h1>
        <Box.Column>
          <Link href="/admin">ADMIN</Link>
          <Link href="/board">BOARD</Link>
        </Box.Column>
      </Box.Column>
    </Screen>
  )
}