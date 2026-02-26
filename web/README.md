# otherdev

> Digital platforms for pioneering creatives

A modern portfolio and agency website showcasing otherdev's work - a full-service web development and design studio based in Karachi City, specializing in fashion, design, and enterprise digital solutions.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8)](https://tailwindcss.com/)

## Overview

Otherdev produces digital platforms for pioneering creatives across fashion, design, and enterprise sectors. This repository contains our portfolio website, featuring project showcases, client work, and interactive contact capabilities.

### Key Highlights

- **13+ Portfolio Projects** - Showcasing work for clients like Wish Apparels, Lexa, and Groovy
- **Modern Stack** - Built with Next.js 16, React 19, and Tailwind CSS 4
- **AI-Powered Features** - Custom assistant with artifact rendering and RAG capabilities
- **Rich Interactions** - Smooth animations with Framer Motion
- **Responsive Design** - Optimized for all devices
- **Accessibility First** - Built with Radix UI primitives
- **Type Safe** - Full TypeScript coverage with Zod validation

## Tech Stack

### Core

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library with Server Components
- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager

### UI Components & Libraries

- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Lucide React](https://lucide.dev/)** - Icon system
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management

### AI & Assistant

- **[@assistant-ui/react](https://www.assistant-ui.com/)** - Custom AI assistant interface
- **[@ai-sdk/groq](https://sdk.vercel.ai/)** - Groq AI integration
- **[@huggingface/inference](https://huggingface.co/)** - HF model inference
- **Shiki** - Syntax highlighting for code artifacts

### API & Data Fetching

- **[tRPC](https://trpc.io/)** - End-to-end typesafe APIs
- **[TanStack Query](https://tanstack.com/query)** - Async state management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[SuperJSON](https://github.com/blitz-js/superjson)** - Enhanced JSON serialization

### Forms & Validation

- **[React Hook Form](https://react-hook-form.com/)** - Form state management
- **[Zod](https://zod.dev/)** - Schema validation

### Development Tools

- **[Biome](https://biomejs.dev/)** - Fast formatter and linter
- **[Babel React Compiler](https://react.dev/learn/react-compiler)** - Automatic optimization

## Getting Started

### Prerequisites

- **Bun** >= 1.0 (recommended) or Node.js >= 18
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/imossaidqadri/otherdev-v2.git
cd otherdev-v2
```

2. Navigate to the web directory:

```bash
cd web
```

3. Install dependencies:

```bash
bun install
```

4. Start the development server:

```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://otherdev.com

# Canvas API
CANVAS_API_URL=https://client5.otherdev.com/canvas/v1/api/
CANVAS_API_KEY=your-api-key
CANVAS_PROJECT_ID=your-project-id

# Google Services
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id

# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
GMAIL_RECIPIENTS=email1@example.com,email2@example.com

# AI Services
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# RAG Configuration
RAG_SIMILARITY_THRESHOLD=0.1
RAG_MATCH_COUNT=10
```

## Project Structure

```
otherdev-v2/
├── web/                          # Main Next.js application
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── page.tsx          # Homepage with project grid
│   │   │   ├── about/            # About page with team & clients
│   │   │   ├── work/             # Work showcase
│   │   │   │   ├── page.tsx      # Projects listing
│   │   │   │   └── [slug]/       # Individual project pages
│   │   │   ├── blog/             # Blog listing and posts
│   │   │   ├── loom/             # AI assistant chat interface
│   │   │   ├── api/              # API routes
│   │   │   │   └── trpc/[trpc]/  # tRPC HTTP handler
│   │   │   └── layout.tsx        # Root layout
│   │   ├── components/           # React components
│   │   │   ├── ui/               # Radix UI component wrappers
│   │   │   ├── navigation.tsx    # Main navigation
│   │   │   ├── project-card.tsx  # Project display card
│   │   │   ├── contact-dialog.tsx # Contact form modal
│   │   │   ├── chat-widget.tsx   # AI assistant widget
│   │   │   ├── artifact-renderer.tsx # Code artifact display
│   │   │   └── providers.tsx     # tRPC & React Query providers
│   │   ├── server/               # tRPC server code
│   │   │   ├── trpc.ts           # tRPC initialization
│   │   │   └── routers/          # API routers
│   │   │       ├── contact.ts    # Contact form handler
│   │   │       └── content.ts    # Blog/content handler
│   │   ├── hooks/                # Custom React hooks
│   │   └── lib/                  # Utilities & data
│   │       ├── projects.ts       # Project data & types
│   │       ├── trpc.ts           # tRPC client utilities
│   │       └── utils.ts          # Helper functions
│   ├── public/                   # Static assets
│   │   └── images/               # Project images & media
│   ├── scripts/                  # Utility scripts
│   │   └── ingest-documents.ts   # Document ingestion for RAG
│   ├── biome.json                # Biome configuration
│   ├── components.json           # Shadcn UI config
│   ├── next.config.ts            # Next.js configuration
│   ├── package.json              # Dependencies
│   ├── postcss.config.mjs        # PostCSS configuration
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   └── tsconfig.json             # TypeScript configuration
├── .gitignore
└── README.md
```

## Available Scripts

Run these commands from the `web/` directory:

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Create production build |
| `bun start` | Start production server |
| `bun lint` | Run Biome linter |
| `bun format` | Format code with Biome |
| `bun run ingest` | Ingest documents for RAG |
| `bun run clear` | Clear ingested documents |

## Features

### Portfolio Showcase

- **Project Grid** - Responsive masonry layout displaying featured work
- **Project Details** - Individual pages with media galleries and descriptions
- **Categories** - SEO, branding, e-commerce, SaaS platforms, and enterprise solutions

### Blog

- **Dynamic Content** - CMS-powered blog posts via tRPC
- **Markdown Rendering** - Shiki syntax highlighting with rehype/remark
- **Category Filtering** - Organized content by topics

### AI Assistant (Loom)

- **Custom Chat Interface** - Built with @assistant-ui/react
- **Artifact Rendering** - Inline code display with syntax highlighting
- **RAG-Powered** - Context-aware responses from ingested documents
- **Multi-Model Support** - Groq and HuggingFace integrations

### About Section

- **Team Information** - Meet the founders and their background
- **Client List** - Notable brands and organizations worked with
- **Social Links** - Connect via Instagram and LinkedIn

### Contact System

- **Two-Step Dialog** - Streamlined contact form flow
- **Form Validation** - Real-time validation with Zod schemas
- **Responsive Design** - Works seamlessly on mobile and desktop

### Technical Features

- **Server Components** - Leveraging React Server Components for performance
- **tRPC API Layer** - End-to-end type-safe APIs
- **React Query + Zustand** - Optimized data fetching and state management
- **Image Optimization** - Next.js Image component with WebP format
- **Route Transitions** - Smooth navigation with App Router
- **Type Safety** - End-to-end TypeScript coverage
- **Code Quality** - Enforced via Biome linter and formatter

## Notable Projects

otherdev has delivered digital solutions for:

- **Bin Yousuf Group** - Real estate platform for premium waterfront properties
- **Lexa** - AI-powered legal assistant platform
- **Narkins Builders** - SEO optimization & website infrastructure
- **Finlit** - SaaS platform for financial literacy
- **Wish Apparels** - Complete branding & e-commerce solution
- **Groovy Pakistan** - E-commerce platform for menswear brand

*And many more fashion, design, and enterprise clients.*

## Deployment

### Vercel (Recommended)

The easiest way to deploy this Next.js app:

1. Push your code to GitHub
2. Import the project to [Vercel](https://vercel.com/new)
3. Set the root directory to `web/`
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/imossaidqadri/otherdev-v2)

### Other Platforms

This is a standard Next.js application and can be deployed to any platform supporting Node.js:

- **Netlify** - Follow [Next.js on Netlify guide](https://docs.netlify.com/integrations/frameworks/next-js/)
- **AWS Amplify** - Use the [Amplify Next.js deployment](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- **Railway** - Connect your GitHub repo to [Railway](https://railway.app/)
- **Digital Ocean** - Deploy to [App Platform](https://www.digitalocean.com/products/app-platform)

### Docker Deployment

```dockerfile
# Example Dockerfile (create in web/ directory)
FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["bun", "server.js"]
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for consistent code formatting and linting:

- **Format on save** recommended in your editor
- Run `bun lint` before committing
- Run `bun format` to auto-format all files
- Configuration in `biome.json`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Image Optimization**: WebP format with Next.js Image
- **Code Splitting**: Automatic with Next.js App Router

## Contributing

This is a private portfolio project. For collaboration inquiries:

1. Check existing work at [otherdev.com](https://otherdev.com)
2. Contact via the website contact form
3. Connect on [Instagram](https://instagram.com/other.dev) or [LinkedIn](https://linkedin.com/company/theotherdev)

## License

© otherdev - All Rights Reserved

This is proprietary software for otherdev's portfolio. Unauthorized copying, modification, or distribution is prohibited.

## Contact

- **Website**: [otherdev.com](https://otherdev.com)
- **Location**: Karachi City, Pakistan
- **Instagram**: [@otherdev](https://instagram.com/other.dev)
- **LinkedIn**: [otherdev](https://linkedin.com/company/theotherdev)

---

**Built by otherdev** - Digital platforms for pioneering creatives
