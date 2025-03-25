"use client"

import * as React from "react"
import { Moon, Sun, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"

export function SwitchTheme() {
  const t = useTranslations("components.switchTheme");
  const { setTheme } = useTheme()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="w-4 h-4 mr-2" /> { t('light') }</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="w-4 h-4 mr-2" /> { t('dark') }</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}><SunMoon className="w-4 h-4 mr-2" /> { t('system') }</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
