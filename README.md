# Nostec

A decentralized, privacy-focused messaging platform that combines the Nostr protocol with Aztec's privacy technology, ENS usernames, and zkPassport verification.

## Overview

Nostec enables users to create encrypted and plaintext posts on a decentralized network. Users can subscribe to content creators, with automatic decryption of encrypted posts for subscribers only. The platform integrates:

- **Nostr Protocol**: Decentralized messaging with cryptographic signatures
- **Aztec Blockchain**: Privacy-preserving smart contracts via Obsidion wallet
- **ENS Integration**: Human-readable usernames (username.nostec.eth)
- **zkPassport**: Zero-knowledge age verification
- **Supabase**: Decentralized-ready backend storage

## Key Features

### 🔐 Privacy-First Messaging
- Create plaintext or encrypted posts
- AES-GCM encryption for content security
- ECDH key exchange for subscriber access
- Zero-knowledge age verification

### 👤 Identity & Authentication
- Nostr keypair-based authentication
- ENS subname registration (username.nostec.eth)
- Aztec address integration
- Persistent login via localStorage

### 📝 Subscription System
- Subscribe to content creators on-chain
- Automatic decryption for subscribers
- Encryption keys encrypted per-subscriber
- Database + blockchain dual storage

### 🛂 Age Verification
- zkPassport integration
- QR code verification flow
- Proof of age 18+ without revealing identity
- Privacy-preserving credential verification

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL)
- **Blockchain**: Aztec Protocol, Obsidion Wallet SDK
- **Cryptography**: @noble/secp256k1, Web Crypto API
- **Identity**: ENS, Nostr Protocol (NIPs 01, 04)
- **Verification**: zkPassport SDK

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Obsidion wallet (for Aztec transactions)
- zkPassport app (for age verification)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nostr-fe2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**

   Run the SQL schema from `supabase-schema.sql`:
   ```sql
   -- Posts table
   CREATE TABLE IF NOT EXISTS posts (
     id BIGSERIAL PRIMARY KEY,
     event_id TEXT UNIQUE NOT NULL,
     pubkey TEXT NOT NULL,
     created_at BIGINT NOT NULL,
     kind INTEGER NOT NULL,
     tags JSONB DEFAULT '[]'::jsonb,
     content TEXT NOT NULL,
     sig TEXT NOT NULL,
     ens_username TEXT,
     inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Subscriptions table
   CREATE TABLE IF NOT EXISTS subscriptions (
     id BIGSERIAL PRIMARY KEY,
     from_aztec_key TEXT NOT NULL,
     from_nostr_pubkey TEXT NOT NULL,
     to_aztec_key TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(from_aztec_key, to_aztec_key)
   );

   -- Indexes
   CREATE INDEX IF NOT EXISTS idx_posts_pubkey ON posts(pubkey);
   CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_posts_kind ON posts(kind);
   CREATE INDEX IF NOT EXISTS idx_posts_ens_username ON posts(ens_username) WHERE ens_username IS NOT NULL;
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Creating an Account

1. Navigate to the home page
2. Enter a desired username (will become `username.nostec.eth`)
3. Enter your Aztec address
4. Click "Create Account"
5. Your Nostr keypair is generated automatically
6. Save your private key securely!

### Logging In

1. Paste your Nostr private key (hex format)
2. Click "Login"
3. Your keys are stored in localStorage for auto-login

### Creating Posts

#### Plaintext Post
1. Enter your message
2. Leave encryption toggle off
3. Click "Submit Post"

#### Encrypted Post (Subscribers Only)
1. Enter your message
2. Toggle encryption ON
3. Click "Submit Post"
4. Encryption key is automatically generated
5. All subscribers receive encrypted keys in post tags
6. Non-subscribers see "Encrypted content - subscribers only"

### Subscribing to Users

1. Click "Subscribe to view" on an encrypted post
2. Navigate to the subscription page
3. Connect your Obsidion wallet
4. (Optional) Complete zkPassport age verification
5. Click "Subscribe" to:
   - Write subscription to database
   - Submit on-chain transaction
6. Return to feed to see auto-decrypted posts

### How Auto-Decryption Works

When viewing the feed:
1. For each encrypted post, check if your Nostr pubkey is in the tags
2. If found, extract your encrypted key
3. Decrypt the key using ECDH (sender's pubkey + your privkey)
4. Use the decrypted key to decrypt the content
5. Display with "Auto-decrypted (Subscriber)" badge

## Project Structure

```
nostr-fe2/
├── app/
│   ├── page.tsx              # Home page (login, create account, post creation)
│   ├── subscribe/
│   │   └── [username]/
│   │       └── page.tsx      # Subscription page (wallet, zkPassport, subscribe)
│   └── test/
│       └── page.tsx          # Test page (Obsidion wallet, ENS fetch, contracts)
├── components/
│   ├── event-card.tsx        # Post display with auto-decrypt
│   ├── event-feed.tsx        # Feed container
│   ├── navbar.tsx            # Navigation bar
│   ├── post-form.tsx         # Post creation form
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── crypto/
│   │   └── encryption.ts     # AES-GCM & ECDH encryption utilities
│   ├── nostr/
│   │   └── crypto.ts         # Nostr event signing
│   ├── obsidian/
│   │   └── sdk.ts            # Obsidion wallet SDK initialization
│   ├── services/
│   │   ├── posts.ts          # Supabase post operations
│   │   ├── subscriptions.ts  # Subscription database operations
│   │   ├── namespace.ts      # ENS subname creation
│   │   └── ens-fetch.ts      # ENS record fetching
│   └── supabase/
│       └── client.ts         # Supabase client configuration
└── types/
    └── nostr.ts              # Nostr event type definitions
```

## Encryption Architecture

### Content Encryption (AES-GCM)
1. Generate random 256-bit key
2. Encrypt post content with AES-GCM
3. Store encrypted content in post

### Key Distribution (ECDH)
1. Query subscribers from database
2. For each subscriber:
   - Derive shared secret: `ECDH(sender_privkey, subscriber_pubkey)`
   - Encrypt the content key with shared secret
   - Store as tag: `["e", subscriber_pubkey, encrypted_key]`

### Auto-Decryption Flow
1. User's browser checks post tags for their pubkey
2. If found, extract encrypted key
3. Derive same shared secret: `ECDH(user_privkey, sender_pubkey)`
4. Decrypt the content key
5. Decrypt the post content

## Smart Contract Integration

### Counter Contract
- **Address**: `0x1f16073628f6a2740a1e86621db02fa3cf29b8f45a86d0d61d076a956fac8d2d`
- **Method**: `add_follower_note_nocheck(subscriber, owner)`
- **Purpose**: On-chain subscription records

### Subscription Flow
1. Write to Supabase database (off-chain indexing)
2. Submit `add_follower_note_nocheck` transaction (on-chain proof)
3. Transaction includes:
   - Subscriber's Aztec address
   - Creator's Aztec address

## zkPassport Integration

### Age Verification Flow
1. User clicks "Generate Verification QR Code"
2. QR code is displayed with deep link
3. User scans with zkPassport mobile app
4. User generates zero-knowledge proof of age ≥ 18
5. Browser receives verification callbacks
6. Result displayed with unique user ID

### Privacy Features
- No personal information disclosed
- Only proves age ≥ 18
- Cryptographic proof without revealing birthdate
- Unique identifier for this session only

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Custom configuration
NEXT_PUBLIC_COUNTER_CONTRACT_ADDRESS=0x1f16073628f6a2740a1e86621db02fa3cf29b8f45a86d0d61d076a956fac8d2d
```

## Security Considerations

### ⚠️ Production Readiness

This is a **prototype/demo application**. Before production deployment:

1. **Private Key Storage**: Implement secure key management (hardware wallets, encrypted storage)
2. **Database Security**: Enable Row Level Security (RLS) in Supabase
3. **Rate Limiting**: Add API rate limiting for post creation and subscriptions
4. **Input Validation**: Enhance validation for all user inputs
5. **Error Handling**: Implement comprehensive error boundaries
6. **HTTPS Only**: Enforce HTTPS in production
7. **Content Moderation**: Implement content filtering/reporting
8. **Backup Strategy**: Regular backups of Supabase data

### Current Security Features

✅ Cryptographic signatures (Nostr protocol)
✅ End-to-end encryption for posts
✅ ECDH key exchange
✅ Zero-knowledge proofs (zkPassport)
✅ On-chain verification (Aztec)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Direct messaging (NIP-04)
- [ ] Media attachments (images, videos)
- [ ] Post reactions and comments
- [ ] User profiles with bio
- [ ] Follow/follower system
- [ ] Notification system
- [ ] Search functionality
- [ ] Content discovery feed
- [ ] Export/import keypairs

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Nostr Protocol](https://github.com/nostr-protocol/nostr) - Decentralized messaging protocol
- [Aztec Protocol](https://aztec.network/) - Privacy-focused blockchain
- [zkPassport](https://zkpassport.id/) - Zero-knowledge identity verification
- [ENS](https://ens.domains/) - Ethereum Name Service
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) - UI component library

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review closed issues for solutions

---

Built with ❤️ using Next.js, Aztec, and Nostr
