# Buckety – Product Requirements Document (PRD)

## 1. Overview

Buckety is a savings application where users can split their balance into different Buckets (sub-accounts) to organize money for different goals (e.g., vacation, rent, emergency fund).

For the MVP, the project will be frontend-only built with Next.js, shadcn/ui, and TailwindCSS. Later, backend logic will handle deposits, stablecoin custody, rewards (APY), and compliance.

## 2. Problem Statement

Traditional banks and wallets provide either low yields or limited goal-based saving tools. Buckety simplifies personal savings by combining:

- High yield (via stablecoin rewards, abstracted from the user).
- Flexible goal-based savings (Buckets).
- Modern, simple, friendly UX.

## 3. Goals & Non-Goals

### Goals (MVP Frontend)

- Build a modern, responsive UI in Next.js with App Router.
- Use shadcn/ui components for clean, production-ready design.
- Implement screens for:
  - Dashboard: shows total balance, APY, and all Buckets.
  - Bucket Details: view/edit a single Bucket.
  - Create/Edit Bucket Flow: form to add/edit goals.
  - Transfers UI: move money between Buckets (simulated).
  - Rewards Display: show "Estimated Rewards" and monthly crediting (mocked).
- Keep the app modular and easy to integrate with future backend APIs.

### Non-Goals (for now)

- No real deposits, withdrawals, or fiat/stablecoin handling.
- No authentication (use mock/demo user).
- No backend ledger (use local state or mock JSON for now).

## 4. Users

- **Primary**: Retail users who want an easy way to save for multiple goals.
- **Secondary**: Potential investors/partners evaluating the UX.

## 5. Features

### Core Features (Frontend MVP)

#### Buckets
- Create a bucket (name, target amount, emoji/icon).
- Edit/delete bucket.
- See progress toward target.

#### Transfers
- Move balance between buckets (simulated).
- Show instant updates in UI.

#### Rewards
- Show "Estimated Rewards Today" (mock calculation).
- Show "Monthly Rewards" credited (simulation).

#### Dashboard
- Display total balance.
- List all buckets with balances and progress.
- Display APY clearly.

#### UI/UX
- Clean design using shadcn/ui.
- Responsive (desktop + mobile).
- Light/dark mode support.

## 6. Tech Stack

- Next.js 14+ with App Router.
- TypeScript for type safety.
- TailwindCSS for styling.
- shadcn/ui for components (buttons, cards, forms, modals).
- Mock data (local JSON or Zustand/Context) for balances and buckets.

## 7. Future Roadmap (Beyond Frontend MVP)

- Authentication: email/social logins.
- Backend Ledger: real accounting of balances.
- On/Off-ramp: ACH/wire → stablecoin custody.
- Custody: Coinbase Prime (USDC).
- Rewards: APY from stablecoin rewards (Coinbase/Circle).
- Compliance: KYC/AML integration.
- Peer Transfers: instant P2P between Buckety users.

## 8. Success Metrics (MVP)

- Ability to create, edit, and delete buckets seamlessly.
- Smooth transfer simulation between buckets.
- Rewards displayed in a clear and motivating way.
- Clean, modern UI that feels production-ready.

## 9. Deliverables

Frontend app in Next.js with shadcn/ui.

Repository with:
- PRD.md (this document).
- Core pages/components.
- Mock JSON/state management for balances and rewards.