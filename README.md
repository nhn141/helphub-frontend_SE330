This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```
helphub-frontend_SE330
├─ AGENTS.md
├─ app
│  ├─ (portal)
│  │  ├─ dashboard
│  │  │  ├─ dashboard-client.tsx
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ social
│  │  │  ├─ page.tsx
│  │  │  └─ social-client.tsx
│  │  └─ support-requests
│  │     ├─ new
│  │     │  ├─ new-support-request-client.tsx
│  │     │  └─ page.tsx
│  │     ├─ page.tsx
│  │     ├─ support-requests-client.tsx
│  │     └─ [id]
│  │        ├─ edit
│  │        │  ├─ edit-support-request-client.tsx
│  │        │  └─ page.tsx
│  │        ├─ page.tsx
│  │        └─ support-request-detail-client.tsx
│  ├─ auth-client.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ CLAUDE.md
├─ components
│  ├─ app-shell.tsx
│  ├─ auth-provider.tsx
│  ├─ social
│  │  ├─ social_comment_section.tsx
│  │  ├─ social_post_card.tsx
│  │  └─ social_post_form.tsx
│  ├─ support-needs-section.tsx
│  ├─ support-request-card.tsx
│  ├─ support-request-form.tsx
│  ├─ support-ui.tsx
│  └─ volunteer-assignments-section.tsx
├─ eslint.config.mjs
├─ lib
│  ├─ api.ts
│  ├─ session.ts
│  ├─ social-api.ts
│  └─ support-request-ui.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ helphub-auth-hero.png
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
└─ tsconfig.json

```