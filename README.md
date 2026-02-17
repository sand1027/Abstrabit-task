# Smart Bookmark App

A personal bookmark manager where you can save, view, and delete your favorite links — all synced in real-time across browser tabs.

**Live URL:** [abstrabit-task-seven.vercel.app](https://abstrabit-task-seven.vercel.app)

---

## What Does This App Do?

1. **Sign in with Google** — No passwords, no email signup. Just click "Sign in with Google" and you're in.
2. **Save bookmarks** — Add any URL with a title to your personal collection.
3. **Private bookmarks** — Your bookmarks are only visible to you. No one else can see them.
4. **Real-time sync** — Open the app in two browser tabs. Add a bookmark in one tab, and it instantly appears in the other — no page refresh needed.
5. **Delete bookmarks** — Remove any bookmark you no longer need.

---

## How Real-Time Sync Works

This is the most interesting part of the app. Here's how it works in simple terms:

When you add or delete a bookmark, two things happen:

1. **Your current tab updates immediately** — The app doesn't wait for the server. It updates the list right away (this is called an "optimistic update").

2. **Other tabs get notified** — The app uses Supabase's **Broadcast** feature, which is like a walkie-talkie between browser tabs. When Tab A adds a bookmark, it sends a message saying "hey, I just added this bookmark." Tab B is listening for these messages and adds the bookmark to its list when it hears one.

There's also a backup system using **Postgres Changes** — Supabase can watch the database for changes and notify connected clients. This handles edge cases like deletes from other sessions.

The flow looks like this:

```
Tab A: User clicks "Add Bookmark"
  → Bookmark saved to database
  → Tab A's list updates immediately
  → Tab A sends broadcast: "new bookmark added"
  → Tab B receives broadcast
  → Tab B adds the bookmark to its list
```

No polling. No page refresh. It just works.

---

## Tech Stack

| Technology | What it does |
|---|---|
| **Next.js 16** (App Router) | The web framework — handles pages, routing, and server-side rendering |
| **Supabase** | Backend-as-a-service — provides the database, authentication, and real-time features |
| **Tailwind CSS** | Utility-first CSS framework for styling |
| **Vercel** | Hosting platform where the app is deployed |

---

## Folder Structure

Here's every file and why it exists:

```
abstrabit-task/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout — wraps every page with HTML structure
│   ├── page.tsx                  # Home page — checks if user is logged in, shows bookmarks
│   ├── globals.css               # Global styles (background color, fonts)
│   ├── login/
│   │   └── page.tsx              # Login page — "Sign in with Google" button
│   └── auth/
│       └── callback/
│           └── route.ts          # OAuth callback — Google redirects here after login
│
├── components/                   # Reusable UI components
│   ├── BookmarkManager.tsx       # Main component — manages bookmark state + real-time sync
│   ├── AddBookmarkForm.tsx       # Form to add a new bookmark (URL + title)
│   ├── BookmarkList.tsx          # Displays the list of bookmarks with delete buttons
│   └── SignOutButton.tsx         # Sign out button
│
├── lib/                          # Shared utilities
│   ├── supabase/                 # Supabase client setup (3 files for 3 contexts)
│   │   ├── client.ts             # Browser client — used in components (client-side)
│   │   ├── server.ts             # Server client — used in server components/API routes
│   │   └── middleware.ts         # Middleware client — used in Next.js middleware
│   ├── types.ts                  # TypeScript type definitions (Bookmark interface)
│   └── validation.ts             # Input validation (URL and title checks)
│
├── middleware.ts                  # Next.js middleware — redirects unauthenticated users to /login
│
├── supabase/
│   └── schema.sql                # Database schema — run this in Supabase SQL Editor to set up tables
│
├── .env.local.example            # Template for environment variables
└── package.json                  # Dependencies and scripts
```

### Why Three Supabase Client Files?

Next.js runs code in three different environments, and each needs its own Supabase client:

- **`client.ts`** — Runs in the browser. Used by components like `BookmarkManager` and `AddBookmarkForm` to talk to Supabase directly.
- **`server.ts`** — Runs on the server during page rendering. Used by `app/page.tsx` to check if the user is logged in before showing the page.
- **`middleware.ts`** — Runs in Next.js middleware (edge runtime). Used to intercept requests and redirect unauthenticated users to the login page.

Each one handles cookies differently because the browser, server, and middleware have different APIs for reading/writing cookies.

---

## How Authentication Works

```
1. User clicks "Sign in with Google"
2. App redirects to Google's OAuth page
3. User approves access
4. Google redirects to Supabase's callback URL
5. Supabase creates/finds the user and generates a session
6. Supabase redirects to our app's /auth/callback route
7. Our app exchanges the code for a session cookie
8. User is redirected to the home page, now logged in
```

The middleware (`middleware.ts`) protects all pages except `/login` and `/auth/*`. If you're not logged in and try to visit the home page, you get redirected to `/login`.

---

## Database Design

There's one table: `bookmarks`

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Unique identifier (auto-generated) |
| `user_id` | UUID | Links to the authenticated user |
| `url` | TEXT | The bookmark URL |
| `title` | TEXT | The bookmark title |
| `created_at` | TIMESTAMP | When it was created |

**Row Level Security (RLS)** is enabled, which means:
- You can only **see** your own bookmarks
- You can only **add** bookmarks under your own user ID
- You can only **delete** your own bookmarks

This is enforced at the database level — even if someone tried to hack the API, they couldn't access another user's bookmarks.

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- A Supabase project
- A Google Cloud project with OAuth credentials

### Steps

1. Clone the repo and install dependencies:
```bash
cd abstrabit-task
npm install
```

2. Create a `.env.local` file (copy from the example):
```bash
cp .env.local.example .env.local
```

3. Fill in your Supabase credentials in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the database schema in Supabase SQL Editor:
   - Go to your Supabase dashboard → SQL Editor
   - Paste the contents of `supabase/schema.sql` and run it

5. Enable Google OAuth:
   - Google Cloud Console → Create OAuth credentials → get Client ID and Secret
   - Supabase Dashboard → Authentication → Providers → Google → paste credentials

6. Start the dev server:
```bash
npm run dev
```

7. Open `http://localhost:3000`

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the repo in Vercel
3. Add environment variables in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update Supabase's Site URL to your Vercel URL (Authentication → URL Configuration)
5. Add your Vercel URL to Supabase's Redirect URLs
6. Deploy

---

## Test Cases

| # | Requirement | Test Steps | Expected Result | Status |
|---|-------------|------------|-----------------|--------|
| 1 | User can sign up and log in using Google (no email/password) | Visit the app → Click "Sign in with Google" → Approve on Google | User is redirected back to the app and sees their bookmark dashboard. No email/password fields exist on the login page. | Pass |
| 2 | A logged-in user can add a bookmark (URL + title) | Log in → Enter a title and URL in the form → Click "Add Bookmark" | Bookmark appears in the list immediately. Form clears after submission. | Pass |
| 3 | Bookmarks are private to each user | Log in as User A and add bookmarks. Open incognito, log in as User B | User B sees an empty list. User A's bookmarks are not visible to User B. | Pass |
| 4 | Bookmark list updates in real-time without page refresh | Log in → Open two tabs → Add a bookmark in Tab 1 | Bookmark appears in Tab 2 automatically without refreshing the page | Pass |
| 5 | User can delete their own bookmarks | Log in → Click "Delete" on an existing bookmark | Bookmark is removed from the list immediately |  Pass |
| 6 | App must be deployed on Vercel with a working live URL | Visit [abstrabit-task-seven.vercel.app](https://abstrabit-task-seven.vercel.app) | App loads, login works, full add/delete/realtime flow works on the live URL | Pass |
