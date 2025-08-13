// === ADVANCED COMPONENT PATTERNS ===
// Centralized exports for all advanced component patterns

// === COMPOUND COMPONENTS ===
export {
  Select,
  Accordion,
  Tabs,
} from './CompoundComponents';

// === POLYMORPHIC COMPONENTS ===
export {
  Text,
  Box,
  PolymorphicButton,
  PolymorphicLink,
  Heading,
  type PolymorphicComponentProp,
  type PolymorphicComponentPropWithRef,
  type PolymorphicRef,
} from './PolymorphicComponents';

// === RENDER PROP PATTERNS ===
export {
  Toggle,
  Counter,
  Form,
  AsyncData,
  Intersection,
  Mouse,
} from './RenderPropPatterns';

// === SLOT-BASED COMPOSITION ===
export {
  SlotProvider,
  Slot,
  SlotFill,
  CardLayout,
  SidebarLayout,
  ModalLayout,
  GridLayout,
  StackLayout,
} from './SlotComposition';

// === CONTEXT-BASED THEMING ===
export {
  ThemeProvider,
  useTheme,
  ThemedCard,
  ThemedButton,
  ThemedText,
  ThemedInput,
  ThemeSwitcher,
} from './ContextTheming';

// === PATTERN CATEGORIES ===
// Export patterns by category for easier consumption

import {
  Select as SelectComponent,
  Accordion as AccordionComponent,
  Tabs as TabsComponent,
} from './CompoundComponents';

import {
  Text as TextComponent,
  Box as BoxComponent,
  PolymorphicButton as PolymorphicButtonComponent,
  PolymorphicLink as PolymorphicLinkComponent,
  Heading as HeadingComponent,
} from './PolymorphicComponents';

import {
  Toggle as ToggleComponent,
  Counter as CounterComponent,
  Form as FormComponent,
  AsyncData as AsyncDataComponent,
  Intersection as IntersectionComponent,
  Mouse as MouseComponent,
} from './RenderPropPatterns';

import {
  SlotProvider as SlotProviderComponent,
  Slot as SlotComponent,
  SlotFill as SlotFillComponent,
  CardLayout as CardLayoutComponent,
  SidebarLayout as SidebarLayoutComponent,
  ModalLayout as ModalLayoutComponent,
  GridLayout as GridLayoutComponent,
  StackLayout as StackLayoutComponent,
} from './SlotComposition';

import {
  ThemeProvider as ThemeProviderComponent,
  useTheme as useThemeHook,
  ThemedCard as ThemedCardComponent,
  ThemedButton as ThemedButtonComponent,
  ThemedText as ThemedTextComponent,
  ThemedInput as ThemedInputComponent,
  ThemeSwitcher as ThemeSwitcherComponent,
} from './ContextTheming';

export const CompoundComponents = {
  Select: SelectComponent,
  Accordion: AccordionComponent,
  Tabs: TabsComponent,
};

export const PolymorphicComponents = {
  Text: TextComponent,
  Box: BoxComponent,
  PolymorphicButton: PolymorphicButtonComponent,
  PolymorphicLink: PolymorphicLinkComponent,
  Heading: HeadingComponent,
};

export const RenderPropComponents = {
  Toggle: ToggleComponent,
  Counter: CounterComponent,
  Form: FormComponent,
  AsyncData: AsyncDataComponent,
  Intersection: IntersectionComponent,
  Mouse: MouseComponent,
};

export const SlotComponents = {
  SlotProvider: SlotProviderComponent,
  Slot: SlotComponent,
  SlotFill: SlotFillComponent,
  CardLayout: CardLayoutComponent,
  SidebarLayout: SidebarLayoutComponent,
  ModalLayout: ModalLayoutComponent,
  GridLayout: GridLayoutComponent,
  StackLayout: StackLayoutComponent,
};

export const ThemingComponents = {
  ThemeProvider: ThemeProviderComponent,
  useTheme: useThemeHook,
  ThemedCard: ThemedCardComponent,
  ThemedButton: ThemedButtonComponent,
  ThemedText: ThemedTextComponent,
  ThemedInput: ThemedInputComponent,
  ThemeSwitcher: ThemeSwitcherComponent,
};

// === USAGE EXAMPLES ===
/*
// Import individual components:
import { Select, Text, Toggle, CardLayout, ThemeProvider } from '@/components/advanced';

// Import by category:
import { CompoundComponents, PolymorphicComponents } from '@/components/advanced';
const { Select, Accordion } = CompoundComponents;
const { Text, Box } = PolymorphicComponents;

// Import specific pattern modules:
import { CompoundComponents } from '@/components/advanced/CompoundComponents';
import { PolymorphicComponents } from '@/components/advanced/PolymorphicComponents';
*/
