# HelpSathi

HelpSathi is a monorepo containing a Next.js web application and a Socket.io realtime server, managed using npm workspaces.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A PostgreSQL database (you can use local Postgres or a cloud provider like [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))

## Project Structure

This project uses npm workspaces to manage multiple packages in a single repository.

- `apps/web`: The Next.js web application frontend and API routes.
- `apps/realtime`: The Node.js + Socket.io server for real-time features (chat, notifications).
- `packages/shared`: Shared resources, including the Prisma database schema and client.

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Install Dependencies

Install all dependencies for all workspaces from the root directory:

```bash
npm install
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env` in the root directory:

```bash
cp .env.example .env
```

Open the newly created `.env` file and configure the environment variables:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random string for JWT signing.
- `NEXT_PUBLIC_APP_URL`: The URL of the Next.js app (default: `http://localhost:3000`).
- `NEXT_PUBLIC_SOCKET_URL`: The URL of the realtime server (default: `http://localhost:4000`).
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials for login.

### 3. Database Setup

The project uses Prisma as the ORM, which is located in the `packages/shared` directory. To initialize your database, you need to push the schema and generate the Prisma Client.

Navigate to the `packages/shared` directory and run the Prisma commands:

```bash
cd packages/shared
npx prisma generate
npx prisma db push
cd ../..
```
*(Alternatively, you can run `npx prisma db push --schema=packages/shared/prisma/schema.prisma` from the root directory)*

### 4. Running the Development Servers

You can start both the Next.js web application and the realtime server simultaneously using the root script:

```bash
npm run dev
```

This command uses `concurrently` to run:
- The web app (Next.js) on [http://localhost:3000](http://localhost:3000)
- The realtime server (Socket.io) on port 4000 (or the port specified in your `.env`)

## Building for Production

To build all workspaces for production, run:

```bash
npm run build
```

To start the production builds, run:

```bash
npm run start
```
