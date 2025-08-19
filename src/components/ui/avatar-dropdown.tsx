"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { AccountMenu } from "@/components/ui/account-menu"

export interface AvatarDropdownProps {
  initial: string
}

export function AvatarDropdown({ initial }: AvatarDropdownProps) {
  return (
    <DropdownMenu
      trigger={
        <Button variant="avatar" initial={initial} />
      }
      className="!p-0 !border-0 !shadow-none !bg-transparent"
    >
      <AccountMenu />
    </DropdownMenu>
  )
}