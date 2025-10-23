# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8a228405-44d1-415b-934a-f99c0c77e486

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8a228405-44d1-415b-934a-f99c0c77e486) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Payments (Razorpay) setup

This project integrates Razorpay Checkout via Supabase Edge Functions to offer Free and Pro pricing tiers.

Never commit live API keys to source control. Configure them as environment secrets for your Supabase Edge Functions:

1) Collect the following values:

- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- SUPABASE_URL (your project URL)
- SUPABASE_SERVICE_ROLE_KEY (service role key)

2) Set them as Supabase Function secrets:

```sh
# From your project folder with the Supabase CLI installed
supabase functions secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
supabase functions secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
```

3) Deploy the functions (or run locally):

```sh
# Deploy both functions
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment

# Or run locally for testing
supabase functions serve --env-file supabase/.env
```

Client flow:

- The Pricing page calls `create-razorpay-order` to create an order and receive `order_id` and your publishable `key_id`.
- Razorpay Checkout opens in the browser and completes payment.
- The client then calls `verify-razorpay-payment` to verify the signature server-side, activate the subscription, and set the user's role to `pro`.

Free vs Pro limits:

- Free: up to 3 flipbooks, 10MB per PDF.
- Pro: Unlimited flipbooks, 50MB per PDF.

Note: If you need to change pricing or limits, update `src/pages/Pricing.tsx` and `src/components/dashboard/CreateFlipbookDialog.tsx` accordingly.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8a228405-44d1-415b-934a-f99c0c77e486) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
