# Confidential Token Transfer DApp — UI/UX Architecture (Framework-Agnostic)

This document provides a complete, framework-agnostic description of the Confidential Token Transfer (cwUSDT) user interface. It is designed to enable a complete pixel-perfect rebuild in any framework (e.g., Vue, Angular, Svelte) without reference to React-specific patterns.

---

## Table of Contents

1. [Global Theme and Design System](#1-global-theme-and-design-system)
2. [Layout Structure](#2-layout-structure)
3. [Header Bar](#3-header-bar)
4. [Sidebar Navigation](#4-sidebar-navigation)
5. [Homepage (Welcome Screen)](#5-homepage-welcome-screen)
6. [Account Overview Screen](#6-account-overview-screen)
7. [Deposit & Withdraw Forms (Toggle Panel)](#7-deposit--withdraw-forms-toggle-panel)
8. [Secure Transfer Form](#8-secure-transfer-form)
9. [Transaction History](#9-transaction-history)
10. [Toast Notifications / Messages](#10-toast-notifications--messages)
11. [Responsive Behavior](#11-responsive-behavior)
12. [CSS Class Reference (Tailwind)](#12-css-class-reference-tailwind)

---

## 1. Global Theme and Design System

### 1.1 Color Palette

**Primary Colors:**
- **Zama Yellow/Accent**: `#FFEB3B` (used for primary CTAs, highlights)
- **Sky Blue Gradient Start**: `#0EA5E9` (gradient sky-500)
- **Teal Gradient End**: `#2DD4BF` (gradient teal-400)
- **Background Base**: `linear-gradient(to bottom right, from sky-50 via white to emerald-50)` — soft, airy gradient
- **Card Background**: Pure white `#FFFFFF`
- **Secondary Background**: Light slate gray `#F8FAFC` (slate-50)

**Neutral/Text Colors:**
- **Primary Text**: `#0F172A` (slate-900) — headings, main labels
- **Secondary Text**: `#64748B` (slate-500) — hints, secondary info
- **Tertiary/Muted Text**: `#94A3B8` (slate-400) — placeholders, disabled states

**Semantic Colors:**
- **Success Green**: `#10B981` (emerald-500), lighter variant `#D1FAE5` (emerald-50) for backgrounds
- **Error Red**: `#EF4444` (red-500), lighter variant `#FEE2E2` (red-50) for backgrounds
- **Warning Amber**: `#F59E0B` (amber-500), lighter variant `#FEF3C7` (amber-50) for backgrounds
- **Info Sky**: `#0EA5E9` (sky-500), lighter variant `#E0F2FE` (sky-50) for backgrounds

### 1.2 Typography

- **Font Family**: System UI stack  
  `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`
  
- **Font Smoothing**: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

**Font Sizes & Weights:**
- **Page Title (H1)**: `3xl` (1.875rem / 30px), `font-bold`, color `sky-700`
- **Section Titles (H2)**: `2xl` (1.5rem / 24px), `font-bold`, color `slate-900`
- **Card Titles (H3)**: `lg` (1.125rem / 18px), `font-semibold`, color `slate-900`
- **Body Text**: `sm` (0.875rem / 14px), `font-normal`, color `slate-700`
- **Captions / Hints**: `xs` (0.75rem / 12px), `font-normal`, color `slate-500`
- **Monospace (Addresses, Hashes)**: `font-mono`, `text-xs` or `text-sm`, color `slate-600` or `slate-700`

### 1.3 Shadows and Borders

- **Card Shadow**: `shadow-md` (medium shadow, typically `0 4px 6px -1px rgba(0,0,0,0.1)`)
- **Hover Button Shadow**: `shadow-lg` with color tint (e.g., `shadow-yellow-500/20` for primary buttons)
- **Border Radius**:
  - Cards: `rounded-xl` (0.75rem / 12px)
  - Buttons: `rounded-full` for CTAs, `rounded-lg` (0.5rem / 8px) for secondary buttons
  - Input Fields: `rounded-lg`
- **Border Color**: `border-slate-100` (very light gray) for card borders, `border-slate-300` for input borders

### 1.4 Spacing & Layouts

- **Page Padding**: `px-6 py-8` (1.5rem horizontal, 2rem vertical)
- **Card Padding**: `p-8` (2rem all sides)
- **Gap Between Elements**: `gap-6` (1.5rem) for major sections, `gap-4` (1rem) for smaller groups, `gap-2` (0.5rem) for tight inline elements
- **Max Content Width**: `max-w-7xl` (80rem / 1280px) centered via `mx-auto`

---

## 2. Layout Structure

### 2.1 Overall Page Layout

The application uses a **12-column grid** layout:

```
┌────────────────────────────────────────────────────────────────┐
│  Header Bar (full width, fixed at top if needed)              │
├────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Top Bar (Title + Wallet Panel)                        │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌─────────────┬──────────────────────────────────────────┐   │
│  │  Sidebar    │  Main Content Area                       │   │
│  │  (3 cols)   │  (9 cols)                                │   │
│  │             │                                           │   │
│  │  - Home     │  [Dynamic page content based on nav]     │   │
│  │  - Overview │                                           │   │
│  │  - Transfer │                                           │   │
│  │  - History  │                                           │   │
│  │             │                                           │   │
│  └─────────────┴──────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Breakpoints:**
- Desktop: 12-column grid (sidebar 3 cols, main 9 cols)
- Tablet/Mobile (< 1024px): Stack sidebar and main content vertically (single column)

### 2.2 Background

- **Body Background**: Soft gradient  
  `bg-gradient-to-br from-sky-50 via-white to-emerald-50`  
  Creates a subtle, professional gradient from top-left (light sky blue) through center (white) to bottom-right (light emerald).

---

## 3. Header Bar

### 3.1 Structure

The header is not a fixed top bar but rather a **top section** inside the main content container. It contains:

- **Left Side**: Application branding  
  - **Title**: "cwUSDT DApp" (text size `3xl`, `font-bold`, color `sky-700`)
  - **Subtitle**: "Confidential Token Transfer via FHEVM" (text size `sm`, color `slate-500`, margin-top `mt-1`)

- **Right Side**: Wallet connection panel (see section 3.2)

**Layout Classes:**
- Flexbox: `flex items-start justify-between mb-6`
- No fixed position; it scrolls with the page.

### 3.2 Wallet Connection Panel (Right Side)

**When Wallet NOT Connected:**
- Display a single **"Connect Wallet"** button:
  - Background: `bg-gradient-to-r from-sky-500 to-teal-400`
  - Text: White, `font-semibold`
  - Padding: `px-8 py-3`
  - Border Radius: `rounded-lg`
  - Shadow: `shadow-md`
  - Hover Effect: `hover:scale-105 transform transition-all duration-300`

**When Wallet IS Connected:**
- Display a compact wallet info card:
  - Background: White (`bg-white`)
  - Border: `border border-slate-200`
  - Border Radius: `rounded-lg`
  - Padding: `p-4`
  - Shadow: `shadow-sm`

- **Contents (vertical stack, `space-y-2`):**
  1. **Connected Address Label** (text `xs`, color `slate-500`): "Connected Address"
  2. **Truncated Wallet Address** (text `sm`, `font-mono`, `font-semibold`, color `sky-600`):  
     Example: `0x1234...5678` (show first 6 and last 4 characters)
  3. **Network Indicator** (text `xs`, color `slate-500`): "Network: Sepolia Testnet"
  4. **FHE Status Badge** (inline chip):
     - If initialized: Background `bg-emerald-100`, text color `text-emerald-700`, label "FHEVM Active"
     - If not initialized: Background `bg-amber-100`, text color `text-amber-700`, label "FHEVM Initializing..."
     - Badge styling: `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`
  5. **Disconnect Button**:
     - Background: `bg-red-600`
     - Text: White, `font-semibold`
     - Padding: `px-4 py-2`
     - Border Radius: `rounded-lg`
     - Hover: `hover:bg-red-700`
     - Size: `text-sm`

---

## 4. Sidebar Navigation

### 4.1 Structure

The sidebar is a **fixed-width column** (3/12 of the grid) with the following visual styling:

- **Background**: Soft gradient  
  `bg-gradient-to-b from-blue-50 to-white/60` (gradient from top light blue to semi-transparent white at bottom)
- **Padding**: `p-6` (1.5rem all sides)
- **Border Radius**: `rounded-2xl` (1rem)
- **Shadow**: `shadow-sm` (subtle shadow)

### 4.2 Logo/Branding Section (Top)

- **Icon**: A circular badge with gradient background  
  - Size: `w-12 h-12`
  - Background: `bg-gradient-to-br from-teal-200 to-blue-200`
  - Border Radius: `rounded-full`
  - Content: A centered Ethereum symbol or "Ξ" (text `blue-700`, `font-bold`)
  
- **Text (next to icon)**:
  - **Primary**: "ZamaSteathPay" (text `lg`, `font-semibold`, color `sky-700`)
  - **Secondary**: "cwUSDT" (text `xs`, color `sky-500`)

- **Layout**: Horizontal flex with gap `gap-3`, margin-bottom `mb-8`

### 4.3 Navigation Links

A vertical list of navigation buttons, each occupying full width of the sidebar:

**Navigation Items:**
1. **Home** — Icon: 🏠
2. **Account Overview** — Icon: 💰
3. **Secure Transfer** — Icon: 🔒
4. **History** — Icon: 📜

**Button Styling:**
- Width: `w-full`
- Text Alignment: `text-left`
- Padding: `px-4 py-2`
- Border Radius: `rounded-full`
- Spacing Between Buttons: `space-y-3`

**Active State:**
- Background: `bg-sky-100`
- Text Color: `text-sky-700`

**Inactive State:**
- Background: Transparent
- Text Color: `text-sky-600`
- Hover: `hover:bg-sky-50`

### 4.4 Footer Section (Bottom of Sidebar)

- **Text**: "Built with Zama FHE"  
  - Size: `text-xs`
  - Color: `text-slate-400`
  - Margin-Top: `mt-8`

- **Illustration Placeholder**:
  - Margin-Top: `mt-6`
  - Opacity: `opacity-40` (semi-transparent)
  - A decorative SVG wave gradient (`bg-gradient-to-t from-teal-50 to-white`, rounded corners `rounded-2xl`, height `h-24`)

---

## 5. Homepage (Welcome Screen)

### 5.1 When Wallet NOT Connected

**Structure**: Centered content card (white background, rounded corners, shadow)

- **Card Styling**:
  - Background: `bg-white`
  - Border: `border border-gray-200`
  - Border Radius: `rounded-xl`
  - Shadow: `shadow-xl`
  - Padding: `p-8`
  - Margin-Bottom: `mb-8`

- **Content (vertical center alignment, `flex flex-col items-center justify-center gap-6 py-12`):**
  1. **Main Title**: "Welcome to cwUSDT DApp"  
     - Size: `text-2xl`, `font-bold`, color `slate-700`, margin-bottom `mb-3`
  2. **Description Paragraph**:  
     - Text: "Connect your wallet to start managing encrypted USDT transfers with full privacy."
     - Size: `text-sm`, color `slate-500`, max-width `max-w-md`, margin-bottom `mb-6`
  3. **Connect Wallet Button** (same as Header section):
     - Background: `bg-gradient-to-r from-sky-500 to-teal-400`
     - Text: White, `font-semibold`
     - Padding: `px-8 py-3`
     - Border Radius: `rounded-lg`
     - Shadow: `shadow-md`
  4. **Info Box** (below button):
     - Background: `bg-sky-50`
     - Border Radius: `rounded-lg`
     - Padding: `p-4`
     - Width: `w-full max-w-md`
     - Margin-Top: `mt-4`
     - Text: "Make sure you're on the Sepolia testnet. You'll be prompted to switch if needed."  
       (size `text-sm`, color `slate-500`)

### 5.2 When Wallet IS Connected but FHE SDK NOT Initialized

**Structure**: Same card styling as above.

- **Content (vertical center alignment):**
  1. **Spinner**: A circular animated spinner  
     - Size: `w-12 h-12`
     - Border: `border-4 border-sky-400 border-t-transparent`
     - Border Radius: `rounded-full`
     - Animation: `animate-spin`
  2. **Loading Text**: "Initializing FHE SDK..."  
     - Size: `text-lg`, `font-semibold`, color `slate-700`

### 5.3 When Wallet Connected AND FHE SDK Initialized

Display the **Home Page** content:

**Structure**: White card with `bg-white rounded-xl shadow-md p-8 border border-slate-100`

**Content:**
1. **Page Title**: "Welcome to Confidential Token Transfer"  
   - Size: `text-2xl`, `font-bold`, color `slate-900`, margin-bottom `mb-6`

2. **Feature Cards (3-Column Grid)**:
   - Grid Layout: `grid grid-cols-3 gap-6`
   - Each card:
     - Background: `bg-white`
     - Border: `border border-slate-200`
     - Border Radius: `rounded-xl`
     - Shadow: `shadow-sm`
     - Padding: `p-6`
     - Hover Effect: `hover:shadow-md transition-shadow`

   **Feature Card 1: End-to-End Encrypted**
   - Icon: 🔐 (or encrypted lock icon)
   - Title: "End-to-End Encrypted" (text `lg`, `font-semibold`, color `slate-900`)
   - Description: "Your transfers are encrypted on-chain using fully homomorphic encryption."  
     (text `sm`, color `slate-600`)

   **Feature Card 2: Private Balances**
   - Icon: 💰 (or balance/wallet icon)
   - Title: "Private Balances"
   - Description: "Token balances remain confidential and only decryptable by authorized users."

   **Feature Card 3: Auditable Privacy**
   - Icon: ✅ (or checkmark icon)
   - Title: "Auditable Privacy"
   - Description: "Full privacy with optional reveal mechanisms for compliance and transparency."

3. **Call-to-Action Button**: "Launch App" or "Go to Account Overview"  
   - Background: `bg-gradient-to-r from-sky-500 to-teal-400`
   - Text: White, `font-semibold`
   - Padding: `px-8 py-3`
   - Border Radius: `rounded-full`
   - Shadow: `shadow-md`
   - Hover: `hover:scale-105 transform transition`

---

## 6. Account Overview Screen

### 6.1 Overall Structure

**Main Card**:
- Background: `bg-white`
- Border Radius: `rounded-xl`
- Shadow: `shadow-md`
- Padding: `p-8`
- Border: `border border-slate-100`

**Page Title**:
- Text: "Account Overview"
- Size: `text-2xl`, `font-bold`, color `slate-900`, margin-bottom `mb-6`

### 6.2 Two-Column Balance Display

**Grid Layout**: `flex flex-col md:flex-row gap-6`

---

#### 6.2.1 Card A: cwUSDT (Confidential) Balance

**Container**:
- Background: `bg-white`
- Border Radius: `rounded-xl`
- Padding: `p-8`
- Flex: `md:flex-1` (equal width on desktop)

**Card Title**:
- Text: "Confidential Balance"
- Size: `text-lg`, `font-semibold`, color `slate-900`, margin-bottom `mb-4`

**Loading State**:
- Display a small spinner with text "Loading..."
  - Spinner: `animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full`
  - Text: `text-slate-600 text-sm`

**Loaded State**:

1. **Encrypted Hash Section**:
   - Label: "Encrypted Hash" (text `xs`, color `slate-500`, margin-bottom `mb-1`)
   - Value: Truncated hex string (e.g., `0xabcd...1234`)
     - Styling: `text-sm font-mono break-all text-slate-700`
     - Background: `bg-slate-50`
     - Padding: `p-3`
     - Border Radius: `rounded-lg`
     - Border: `border border-slate-200`

2. **Decrypted Balance Display** (when revealed):
   - Container:
     - Background: `bg-emerald-50`
     - Border: `border border-emerald-200`
     - Border Radius: `rounded-lg`
     - Padding: `p-4`
     - Margin-Bottom: `mb-4`
   - Label: "Decrypted Amount" (text `xs`, color `slate-600`, margin-bottom `mb-1`)
   - Value: Large numeric display (e.g., "1,234.56")
     - Size: `text-2xl`, `font-bold`, color `emerald-600`
   - Caption: "cwUSDT (visible only locally)"  
     - Size: `text-xs`, color `slate-500`, margin-top `mt-1`

3. **Hint (when not decrypted)**:
   - Text: "Decrypt to reveal balance"
   - Size: `text-xs`, color `slate-500`, margin-bottom `mb-4`

4. **Reveal/Decrypt Button**:
   - Width: `w-full`
   - Padding: `py-2 px-4`
   - Border Radius: `rounded-full`
   - Background: `bg-gradient-to-r from-sky-500 to-teal-400`
   - Text: White, `font-semibold`, size `text-sm`
   - Shadow: `shadow-md`
   - Hover: `hover:scale-105 transform transition`
   - Disabled State: `disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`
   - Content: "Reveal Balance" (or "Decrypting..." with spinner when active)

**Error State**:
- If an error occurs, display an error box:
  - Background: `bg-red-50`
  - Border: `border border-red-200`
  - Border Radius: `rounded-lg`
  - Padding: `p-3`
  - Margin-Top: `mt-4`
  - Text: Error message (size `text-sm`, color `red-600`)

---

#### 6.2.2 Divider (Desktop Only)

- A vertical line between the two balance cards
- Display: `hidden md:block`
- Border: `border-l border-slate-100`
- Width: `w-0` (zero width; only the border is visible)

---

#### 6.2.3 Card B: mUSDT (Public) Balance

**Container**: Same styling as Card A

**Card Title**:
- Text: "Public Balance"
- Size: `text-lg`, `font-semibold`, color `slate-900`, margin-bottom `mb-4`

**Loading State**: Same spinner as Card A

**Loaded State**:

1. **mUSDT Balance Display**:
   - Container:
     - Background: `bg-emerald-50`
     - Border: `border border-emerald-200`
     - Border Radius: `rounded-lg`
     - Padding: `p-4`
   - Label: "mUSDT Balance" (text `xs`, color `slate-600`, margin-bottom `mb-1`)
   - Value: Large numeric display (e.g., "5,000.00")
     - Size: `text-3xl`, `font-bold`, color `emerald-600`
   - Caption: "Standard ERC20 Token (Public)"  
     - Size: `text-xs`, color `slate-500`, margin-top `mt-1`

2. **Informational Text**:
   - Text: "This is your publicly visible mUSDT balance on-chain."
   - Size: `text-xs`, color `slate-500`, margin-top `mt-4`

---

### 6.3 Contract Info Footer

At the bottom of the Account Overview card:

- Border-Top: `border-t border-slate-200`
- Padding-Top: `pt-4`
- Margin-Top: `mt-6`
- Text Size: `text-xs`, color `slate-500`

**Content:**
- Label: "cwUSDT Contract:" (`font-semibold`, color `slate-700`)
- Contract Address: Full address in monospace font (`font-mono break-all text-slate-600 mt-1`)

---

## 7. Deposit & Withdraw Forms (Toggle Panel)

These two forms appear on the **Overview Page** below the Account Overview card.

### 7.1 Overall Structure

Two separate cards displayed side-by-side or stacked (depending on screen size):

- Grid Layout: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Each card:
  - Background: `bg-white`
  - Border Radius: `rounded-xl`
  - Shadow: `shadow-md`
  - Padding: `p-8`
  - Border: `border border-slate-100`

---

### 7.2 Deposit Form Card

**Card Title**:
- Text: "Deposit mUSDT"
- Size: `text-2xl`, `font-bold`, color `slate-900`, margin-bottom `mb-6`

**Form Elements:**

1. **Amount Input Field**:
   - Label: "Amount" (text `sm`, `font-semibold`, color `slate-700`, margin-bottom `mb-2`)
   - Input Container: Flexbox with gap `gap-3`
     - **Text Input**:
       - Type: `number`
       - Placeholder: "0.00"
       - Styling:
         - Background: `bg-white`
         - Border: `border border-slate-300`
         - Border Radius: `rounded-lg`
         - Padding: `px-4 py-2`
         - Text Color: `text-slate-900`
         - Placeholder Color: `placeholder-slate-400`
         - Focus: `focus:outline-none focus:ring-2 focus:ring-sky-500`
         - Disabled: `disabled:opacity-50 disabled:bg-slate-50`
       - Width: `flex-1`
     - **Max Button**:
       - Text: "Max"
       - Background: `bg-slate-100`
       - Hover: `hover:bg-slate-200`
       - Text Color: `text-slate-700`
       - Font Weight: `font-medium`
       - Border Radius: `rounded-lg`
       - Padding: `px-4 py-2`
       - Size: `text-sm`
       - Disabled: `disabled:opacity-50`
   
2. **Available Balance Hint** (below input):
   - Layout: Flex, `flex justify-end items-center mt-2`
   - Text: "Available: 5,000.00 USDT (Public)"
   - Size: `text-sm`, color `slate-500`, alignment `text-right`

3. **Error Message Box** (conditional):
   - Background: `bg-red-50`
   - Border: `border border-red-200`
   - Border Radius: `rounded-lg`
   - Padding: `p-3`
   - Margin-Bottom: `mb-6`
   - Text: Error message (size `text-sm`, color `red-600`)

4. **Primary Action Button** ("Deposit & Encrypt"):
   - Width: `w-full`
   - Padding: `py-3 px-4`
   - Border Radius: `rounded-full`
   - Background: `bg-gradient-to-r from-sky-500 to-teal-400`
   - Text: White, `font-semibold`
   - Shadow: `shadow-md`
   - Hover: `hover:scale-105 transform transition`
   - Disabled: `disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`
   - Content: "Deposit & Encrypt" (or "Approving..." / "Depositing..." with spinner when processing)

5. **Info Text** (below button):
   - Text: "Approval will be requested if needed, then deposit will proceed automatically."
   - Size: `text-xs`, color `slate-500`, margin-top `mt-2`

6. **Success State Box** (when complete):
   - Background: `bg-emerald-50`
   - Border: `border border-emerald-200`
   - Border Radius: `rounded-lg`
   - Padding: `p-4`
   - Text: "✓ Deposit completed successfully!" (`font-semibold`, color `emerald-700`)
   - Subtext: "Your mUSDT has been encrypted and deposited to cwUSDT." (size `text-xs`, color `slate-600`, margin-top `mt-2`)

---

### 7.3 Withdraw Form Card

**Card Title**:
- Text: "Withdraw mUSDT"
- Size: `text-2xl`, `font-bold`, color `slate-900`, margin-bottom `mb-6`

**Form Elements:**

1. **Amount Input Field**: Same styling as Deposit form

2. **Available Balance Hint**:
   - Text: "Available: 0xabcd...1234 cwUSDT"  
     (truncated encrypted hash since we don't know the plaintext balance)
   - Size: `text-sm`, color `slate-500`, alignment `text-right`, margin-top `mt-2`, margin-bottom `mb-2`

3. **Error Message Box**: Same styling as Deposit form

4. **Privacy Acknowledgment Checkbox**:
   - Layout: Flex with gap `gap-3`
   - Alignment: `items-start`
   - Cursor: `cursor-pointer`
   - Margin-Bottom: `mb-6`
   
   - **Checkbox Input**:
     - Size: `w-4 h-4`
     - Accent Color: `accent-sky-500`
     - Margin-Top: `mt-1`
     - Disabled: `disabled:opacity-50`
   
   - **Label Text**:
     - Size: `text-sm`, color `slate-700`
     - Content: "I understand that my withdrawal amount will be visible on-chain and cannot be encrypted."

5. **Primary Action Button** ("Request Withdrawal"):
   - Same styling as Deposit button
   - Content: "Request Withdrawal: 100.00 cwUSDT" (or "Requesting Withdrawal..." with spinner when processing)

6. **Success State Box**: Similar to Deposit form  
   - Text: "✓ Withdrawal request submitted!"
   - Subtext: "Your request has been sent. You will receive mUSDT after confirmation."

7. **Info Box** (when conditions not met):
   - Background: `bg-sky-50`
   - Border: `border border-sky-200`
   - Border Radius: `rounded-lg`
   - Padding: `p-3`
   - Text: "ⓘ Please acknowledge the privacy implications to proceed."  
     (size `text-sm`, color `sky-700`)

---

## 8. Secure Transfer Form

### 8.1 Overall Structure

**Main Card**:
- Background: `bg-white`
- Border Radius: `rounded-xl`
- Shadow: `shadow-md`
- Padding: `p-8`
- Border: `border border-slate-100`

**Page Title**:
- Text: "Encrypted Transfer"
- Size: `text-2xl`, `font-bold`, color `slate-900`, margin-bottom `mb-6`

---

### 8.2 Privacy Notice Banner

Displayed at the top of the form:

- Background: `bg-sky-50`
- Border: `border-2 border-sky-300`
- Border Radius: `rounded-lg`
- Padding: `p-4`
- Margin-Bottom: `mb-6`

**Content:**
- **Icon**: ℹ (info icon)
- **Title**: "Privacy Benefit" (text `sky-800`, `font-bold`, margin-bottom `mb-2`)
- **Description**: "Encrypted transfers keep both amount and recipient private on-chain. Only encrypted ciphertexts are visible."  
  (size `text-sm`, color `sky-700`)

---

### 8.3 Form Fields

1. **Recipient Address Input**:
   - Label: "Recipient Address" (text `sm`, `font-semibold`, color `slate-700`, margin-bottom `mb-2`)
   - Input:
     - Type: `text`
     - Placeholder: "0x..."
     - Styling:
       - Background: `bg-white`
       - Border: `border border-slate-300`
       - Border Radius: `rounded-lg`
       - Padding: `px-4 py-2`
       - Text Color: `text-slate-900`
       - Placeholder Color: `placeholder-slate-400`
       - Font: `font-mono text-sm`
       - Focus: `focus:outline-none focus:ring-2 focus:ring-sky-500`
       - Disabled: `disabled:opacity-50 disabled:bg-slate-50`
     - Width: `w-full`
   - **Validation Error** (if invalid address):
     - Text: "Invalid Ethereum address"
     - Size: `text-xs`, color `red-600`, margin-top `mt-1`

2. **Amount Input**:
   - Label: "Amount to Transfer" (same styling as above)
   - Input: Same styling as Deposit form amount input

---

### 8.4 Action Buttons (Two-Step Process)

**Step 1: Encrypt Button** (shown when amount is not yet encrypted):

- Width: `w-full`
- Padding: `py-3 px-4`
- Border Radius: `rounded-full`
- Background: `bg-gradient-to-r from-sky-500 to-teal-400`
- Text: White, `font-semibold`
- Shadow: `shadow-md`
- Hover: `hover:scale-105 transform transition`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`
- Content: "1. Encrypt Amount" (or "Encrypting..." with spinner)
- Margin-Bottom: `mb-4`

- **Hint** (below button):
  - Text: "Encrypt the transfer amount locally."
  - Size: `text-xs`, color `slate-500`, margin-top `mt-2`

**Step 2: Transfer Button** (shown after encryption):

- Same styling as Encrypt button
- Content: "2. Send Encrypted Transfer: 100.00 cwUSDT" (or "Sending Transfer..." with spinner)

- **Hint** (below button):
  - Text: "Send the encrypted transfer on-chain."
  - Size: `text-xs`, color `slate-500`, margin-top `mt-2`

- **Encrypted Payload Display** (below button):
  - Container:
    - Background: `bg-slate-50`
    - Border: `border border-slate-300`
    - Border Radius: `rounded-lg`
    - Padding: `p-3`
    - Margin-Top: `mt-4`
  - Label: "Encrypted Payload" (text `xs`, color `slate-600`, margin-bottom `mb-1`, `font-semibold`)
  - Value: Truncated hex string (e.g., `0xabcd1234...`)
    - Size: `text-xs`, `font-mono`, color `slate-700`, `break-all`

---

### 8.5 Success State

- Background: `bg-emerald-50`
- Border: `border border-emerald-200`
- Border Radius: `rounded-lg`
- Padding: `p-4`
- Text: "✓ Encrypted transfer sent!" (`font-semibold`, color `emerald-700`)
- Subtext: "Your transfer to 0x1234...5678 has been submitted with full privacy."  
  (size `text-xs`, color `slate-600`, margin-top `mt-2`)

---

### 8.6 Validation Messages

- Container:
  - Background: `bg-sky-50`
  - Border: `border border-sky-200`
  - Border Radius: `rounded-lg`
  - Padding: `p-3`
- Text: Conditional messages (e.g., "⚠ Amount must be greater than 0", "⚠ Invalid recipient address", "Enter recipient address and amount")
  - Size: `text-sm`, color `sky-700`

---

### 8.7 Contract Info Footer

Same styling as Account Overview contract info footer.

---

## 9. Transaction History

### 9.1 Overall Structure

**Main Card**:
- Background: `bg-white`
- Border Radius: `rounded-xl`
- Shadow: `shadow-md`
- Padding: `p-8`
- Border: `border border-slate-100`

**Page Title**:
- Text: "Transaction History"
- Size: `text-2xl`, `font-bold`, color `slate-900`, margin-bottom `mb-6`

---

### 9.2 Loading State

- Display a spinner with text:
  - Spinner: `animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full`
  - Text: "Loading recent events..."  
    (size `text-sm`, color `slate-600`)
  - Layout: Flexbox with gap `gap-2`, alignment `items-center`

---

### 9.3 Empty State

- Text: "No recent events found."
- Size: `text-sm`, color `slate-500`
- Padding: `p-4`
- Alignment: `text-center`

---

### 9.4 Event List (Loaded State)

**Container**: Vertical stack with gap `space-y-3`

**Individual Event Card**:

- **Alternating Row Colors**:
  - Even rows (0, 2, 4, ...): Background `bg-slate-50`, border `border-slate-200`
  - Odd rows (1, 3, 5, ...): Background `bg-white`, border `border-slate-300`

- **Card Styling**:
  - Border Radius: `rounded-lg`
  - Border: `border` (color varies by row)
  - Padding: `p-4`

**Content Layout**: Flexbox with `flex items-start justify-between gap-4`

---

#### 9.4.1 Left Column (Event Details)

Flex: `flex-1`

1. **Event Type Badge + Block Number**:
   - Layout: Flex with gap `gap-2`, alignment `items-center`, margin-bottom `mb-2`
   - **Event Type Badge**:
     - Display: `inline-block`
     - Background: `bg-sky-100`
     - Text Color: `text-sky-700`
     - Font: `font-semibold`, size `text-xs`
     - Padding: `px-2 py-1`
     - Border Radius: `rounded-full`
     - Content: Event name (e.g., "Deposit", "Withdraw", "EncryptedTransfer")
   - **Block Number**:
     - Size: `text-xs`, color `slate-500`
     - Content: "Block 12345" (or "Block n/a")

2. **Transaction Hash**:
   - Font: `font-mono`, size `text-xs`, color `slate-600`
   - Break: `break-all`
   - Margin-Bottom: `mb-2`
   - Content: Full tx hash

3. **Event Arguments (JSON)**:
   - Background: `bg-slate-100`
   - Padding: `p-2`
   - Border Radius: `rounded`
   - Font: `font-mono`, size `text-xs`, color `slate-500`
   - Break: `break-all`
   - Content: Stringified JSON of event args

---

#### 9.4.2 Right Column (Action Buttons / Decrypted Value)

Layout: Flex column with gap `gap-2`, minimum width `min-w-max`, alignment `items-end`

**When Decrypted Value Available:**
- Display the decrypted amount:
  - Font: `font-mono font-semibold`, size `text-sm`, color `emerald-600`
  - Background: `bg-emerald-50`
  - Padding: `px-3 py-2`
  - Border Radius: `rounded-lg`

**When Decrypted Value NOT Available:**
- Display two action buttons:

1. **Reveal Button**:
   - Background: `bg-sky-100`
   - Hover: `hover:bg-sky-200`
   - Text Color: `text-sky-700`
   - Font: `font-semibold`
   - Padding: `px-3 py-2`
   - Border Radius: `rounded-lg`
   - Size: `text-xs`
   - Transition: `transition`
   - Content: "Reveal"

2. **Request Decrypt Button**:
   - Background: `bg-amber-100`
   - Hover: `hover:bg-amber-200`
   - Text Color: `text-amber-700`
   - Font: `font-semibold`
   - Padding: `px-3 py-2`
   - Border Radius: `rounded-lg`
   - Size: `text-xs`
   - Transition: `transition`
   - Content: "Request Decrypt"

---

## 10. Toast Notifications / Messages

### 10.1 Overall Structure

**Container**:
- Position: Fixed at top-right corner of viewport
  - Class: `fixed top-6 right-6`
- Z-Index: `z-50` (above all other content)
- Layout: Vertical stack with gap `space-y-3`
- Max Width: `max-w-sm`

**Individual Message Card**:
- Padding: `p-4`
- Border Radius: `rounded-lg`
- Shadow: `shadow-lg`
- Border-Left: `border-l-4` (colored border based on message type)

---

### 10.2 Message Types

**Success**:
- Background: `bg-emerald-50`
- Border Color: `border-emerald-400`
- Text Color: `text-emerald-700`

**Error**:
- Background: `bg-red-50`
- Border Color: `border-red-400`
- Text Color: `text-red-700`

**Warning**:
- Background: `bg-yellow-50`
- Border Color: `border-yellow-400`
- Text Color: `text-yellow-700`

**Info** (default):
- Background: `bg-sky-50`
- Border Color: `border-sky-400`
- Text Color: `text-sky-700`

---

### 10.3 Message Content

- **Text**: Message content
  - Font: `font-medium`
  - No additional margin/padding within the card

**Auto-Dismiss**: Messages should auto-dismiss after 5 seconds (implementation detail; not a visual property).

---

## 11. Responsive Behavior

### 11.1 Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 11.2 Layout Changes

**Desktop (>1024px):**
- Sidebar and Main Content: 12-column grid (3 cols sidebar, 9 cols main)
- Balance Cards: Side-by-side (flex-row)
- Deposit/Withdraw Forms: Side-by-side (2-column grid)
- Feature Cards: 3-column grid

**Tablet/Mobile (<1024px):**
- Sidebar and Main Content: Single column (stacked)
- Sidebar: Full width, reduced height
- Balance Cards: Stacked vertically (flex-col)
- Deposit/Withdraw Forms: Stacked vertically (1-column grid)
- Feature Cards: Single column or 2-column grid (depending on design choice)

### 11.3 Text and Padding Adjustments

**Mobile (<768px):**
- Reduce page padding: `px-4 py-6` (instead of `px-6 py-8`)
- Reduce card padding: `p-4` or `p-6` (instead of `p-8`)
- Reduce font sizes: Page title `text-2xl` → `text-xl`, section titles `text-xl` → `text-lg`
- Button widths: Full width (`w-full`) for all CTAs

---

## 12. CSS Class Reference (Tailwind)

### 12.1 Common Component Classes

**Primary Button** (`btn-primary` equivalent):
```
bg-gradient-to-r from-sky-500 to-teal-400
text-white font-semibold
px-6 py-3 (or px-8 py-3 for larger buttons)
rounded-full (or rounded-lg)
shadow-md
hover:scale-105 hover:shadow-lg hover:shadow-sky-500/20
transform transition-all duration-200
active:scale-95
disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
flex items-center justify-center gap-2
```

**Secondary Button**:
```
bg-slate-100 hover:bg-slate-200
text-slate-700 font-medium
px-4 py-2
rounded-lg
text-sm
transition
disabled:opacity-50
```

**Danger Button**:
```
bg-red-600 hover:bg-red-700
text-white font-semibold
px-4 py-2
rounded-lg
shadow-md
hover:shadow-lg hover:shadow-red-500/20
transition-all duration-200
active:scale-95
```

**Card Container** (`glass-card` equivalent):
```
bg-white
border border-slate-100
rounded-xl
shadow-md
p-8
```

**Input Field**:
```
bg-white
border border-slate-300
rounded-lg
px-4 py-2
text-slate-900
placeholder-slate-400
focus:outline-none focus:ring-2 focus:ring-sky-500
disabled:opacity-50 disabled:bg-slate-50
```

**Status Badge**:
```
px-3 py-1
rounded-full
text-xs font-bold uppercase tracking-wide
```

**Spinner** (Loading):
```
animate-spin
w-4 h-4 (or w-5 h-5)
border-2 border-sky-500 border-t-transparent
rounded-full
```

---

### 12.2 Utility Classes Summary

- **Spacing**: `gap-2`, `gap-3`, `gap-4`, `gap-6` (0.5rem, 0.75rem, 1rem, 1.5rem)
- **Padding**: `p-2`, `p-3`, `p-4`, `p-6`, `p-8`, `px-4`, `py-2`, etc.
- **Margin**: `mb-2`, `mb-4`, `mb-6`, `mt-1`, `mt-2`, `mt-4`, etc.
- **Text Size**: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- **Font Weight**: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Colors**: `text-slate-{shade}`, `bg-slate-{shade}`, `border-slate-{shade}`, `text-sky-{shade}`, `bg-emerald-{shade}`, etc.
- **Border Radius**: `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`
- **Shadow**: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- **Flex**: `flex`, `flex-col`, `flex-row`, `items-center`, `items-start`, `justify-between`, `justify-center`, `gap-{n}`
- **Grid**: `grid`, `grid-cols-{n}`, `gap-{n}`
- **Width/Height**: `w-full`, `w-4`, `w-12`, `h-4`, `h-12`, `max-w-md`, `max-w-7xl`, `min-w-max`
- **Responsive**: `md:flex-row`, `md:grid-cols-2`, `md:col-span-9`, `hidden md:block`, etc.

---

## Summary

This document provides a complete, pixel-perfect description of the Confidential Token Transfer DApp UI without referencing React-specific implementation details. All styling is described using Tailwind CSS utility classes and semantic descriptions. A development team using Vue, Angular, or any other framework can rebuild this interface exactly by following the structure, styling, and interaction patterns outlined above.

**Key Design Principles:**
- **Soft, Modern Aesthetic**: Gradient backgrounds, rounded corners, subtle shadows
- **Clear Visual Hierarchy**: Bold titles, distinct card structures, color-coded status indicators
- **Privacy-First UX**: Encrypted data is clearly labeled; reveal/decrypt actions are prominent
- **Accessibility**: Good contrast ratios, clear focus states, semantic HTML structure
- **Responsive**: Mobile-first design with stacking layouts and adjusted sizing

---

**End of Document**
