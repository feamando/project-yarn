"use client"
import { ProjectYarnIDE } from "@/components/project-yarn-ide"
import { Inter, Crimson_Text } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
})

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-crimson",
})

export default function Home() {
  return (
    <div className={`h-screen w-full bg-[#1E1E1E] ${inter.variable} ${crimsonText.variable} font-sans`}>
      <ProjectYarnIDE />
    </div>
  )
}
