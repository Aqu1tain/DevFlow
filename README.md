# DevFlow - Real-time Code Collaboration SaaS

A real-time collaborative code editing platform built for developers.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Monaco Editor
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (Atlas), Redis (Cache)
- **Real-time:** Socket.io
- **Payments:** Stripe
- **Ops:** Docker

## Project Structure

```
DevFlow/
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Express backend (TypeScript)
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB
- Redis
- Docker (optional)

### Development

```bash
# Install dependencies
cd client && npm install
cd server && npm install

# Run dev servers
cd client && npm run dev
cd server && npm run dev
```

### Docker

```bash
docker-compose up
```

## Branch Workflow

- `main` — Production releases (protected, merge only)
- `dev` — Pre-releases & integration (protected, no force push, squash & merge)
- `feature/*` — Feature branches (branch off `dev`, merge into `dev`)

## License

MIT
