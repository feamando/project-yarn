import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from '@/components/ui/menubar'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from '@/components/ui/navigation-menu'
import { Toaster } from '@/components/ui/toaster'

describe('UI components smoke render', () => {
  it('renders Accordion', () => {
    const { getByText } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(getByText('Trigger')).toBeTruthy()
  })

  it('renders AlertDialog container', () => {
    const { container } = render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button>Open</button>
        </AlertDialogTrigger>
        <AlertDialogContent />
      </AlertDialog>
    )
    expect(container).toBeTruthy()
  })

  it('renders HoverCard container', () => {
    const { container } = render(
      <HoverCard>
        <HoverCardTrigger asChild>
          <button>Hover</button>
        </HoverCardTrigger>
        <HoverCardContent />
      </HoverCard>
    )
    expect(container).toBeTruthy()
  })

  it('renders Popover container', () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Open</button>
        </PopoverTrigger>
        <PopoverContent />
      </Popover>
    )
    expect(container).toBeTruthy()
  })

  it('renders DropdownMenu container', () => {
    const { container } = render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button>Open</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(container).toBeTruthy()
  })

  it('renders Menubar', () => {
    const { getByText } = render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Menu</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Item</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
    expect(getByText('Menu')).toBeTruthy()
  })

  it('renders NavigationMenu', () => {
    const { getByText } = render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Nav</NavigationMenuTrigger>
            <NavigationMenuContent>Content</NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
    expect(getByText('Nav')).toBeTruthy()
  })

  it('renders Toaster', () => {
    const { container } = render(<Toaster />)
    expect(container).toBeTruthy()
  })
})

