![ezgif-14cee15a0b890126](https://github.com/user-attachments/assets/15842fc6-3a36-4659-8ce9-d94f7087cfc2)

# Cloudflare Proxy Manager

A CLI tool to manage Cloudflare proxy settings for your DNS records. Easily enable or disable Cloudflare proxy (orange cloud) for your domains.

## Features

- 📋 List all your active Cloudflare zones
- 🔍 View all DNS records with their proxy status
- 🌐 Visual indicators showing which domains are proxied
- ✅ Multi-select records to enable/disable proxy
- 🚀 Interactive interface with @clack/prompts
- 🌍 Automatic language detection (English/Spanish)
- ⚡ Fast and efficient

## Installation

### Using npx (recommended)

No installation required! Just run:

```bash
npx disable-cloudflare
```

### Global installation

```bash
npm install -g disable-cloudflare
```

Then run:

```bash
disable-cloudflare
```

## Prerequisites

- Node.js 18 or higher
- Cloudflare API Token with DNS edit permissions

## Configuration

Set your Cloudflare API token as an environment variable:

```bash
export CLOUDFLARE_TOKEN="your_cloudflare_token"
```

Or create a `.env` file in your project:

```bash
CLOUDFLARE_TOKEN="your_cloudflare_token"
```

### How to get your Cloudflare token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit zone DNS" template or create a custom one with:
   - Zone > DNS > Edit
   - Zone > Zone > Read
4. Copy the generated token and set it as the `CLOUDFLARE_TOKEN` environment variable

## Usage

Simply run:

```bash
npx disable-cloudflare
```

The CLI will guide you through:

1. Selecting a Cloudflare zone/project
2. Choosing whether to enable or disable proxy
3. Selecting which DNS records to modify
4. Confirming the changes

## What does it do?

When you disable Cloudflare proxy on a DNS record:

- Traffic no longer goes through Cloudflare servers
- Your server's real IP is exposed
- You lose Cloudflare's DDoS protection and CDN
- The DNS record works as traditional DNS (DNS only)

This is useful when you need to:

- Connect services that require direct IP access
- Debug network issues
- Use special configurations incompatible with proxy

⚠️ Note that changes may take a few minutes to propagate.

## Development

### Local development

1. Clone the repository:

```bash
git clone https://github.com/midudev/disable-cloudflare-cli.git
cd disable-cloudflare-cli
```

2. Install dependencies:

```bash
bun install
```

3. Run in development mode:

```bash
bun start
```

4. Build for production:

```bash
bun run build
```

## Project structure

```
.
├── index.ts         # Main application
├── i18n.ts         # Internationalization (ES/EN)
├── types.ts        # TypeScript interfaces
├── package.json    # Dependencies and scripts
├── tsconfig.json   # TypeScript configuration
└── README.md       # This file
```

## Security

⚠️ **Important:** Never share your Cloudflare token. Keep `.env` in `.gitignore`.

## License

MIT

## Author

Created by [midudev](https://github.com/midudev)

---

Built with ❤️ using [@clack/prompts](https://github.com/natemoo-re/clack)
