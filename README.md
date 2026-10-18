# Matrix SDK Sample (Angular)

A test harness that shows how to use [`matrix-js-sdk`](https://github.com/matrix-org/matrix-js-sdk) from an Angular app, together with the Synapse Admin API, against a Matrix homeserver.

> The UI is a bare, German-language test page — this is a developer sample, not a finished chat client.

## Features

**Client (matrix-js-sdk)** — `src/app/services/matrix-sdk-access.service.ts`

- Log in with username and password and start/sync the client
- List the user's rooms and the messages in a selected room
- Send text messages to a room (unencrypted rooms only)
- Create and delete (leave) rooms; invite a contact to a room
- Auto-join rooms when invited
- List contacts (members of the user's rooms) and direct chats; send direct messages
- Listeners for incoming messages and joined rooms

**User administration (Synapse Admin API)** — `src/app/services/matrix-user-management.service.ts`

- List registered users
- Register new users
- Reset a user's password
- Deactivate (delete) users

These calls obtain an access token for an admin account configured in the environment file.

## Tech stack

- Angular 12.0, Forms (`ngModel`)
- matrix-js-sdk 17 (browser bundle loaded via `angular.json` scripts)
- TypeScript 4.2, RxJS 6.6
- Matrix homeserver running Synapse (for the admin endpoints)

## Getting started

Requires Node.js 12.14+ / 14 and npm.

```bash
npm install
cp src/environments/environment.dev.dist.ts src/environments/environment.dev.ts
```

Edit `src/environments/environment.dev.ts` (git-ignored) and set:

| Key | Purpose |
| --- | --- |
| `matrixServerBaseUrl` | Base URL of your Matrix / Synapse homeserver |
| `adminMatrixAccount` | Username and password of a Synapse admin, used for the user-management features |
| `personalMatrixAccount` | Optional test account credentials |

Then run:

```bash
npm start        # ng serve (development config) -> http://localhost:4200
```

For production builds, `src/environments/environment.prod.ts` is used (`npm run build`).

## Project structure

```
src/app/
├── component/                   # test page (login, rooms, messages, contacts, DMs, admin actions)
├── messenger-interfaces/        # IMessengerUser, IMessengerRoom, IMessengerMessage, IMessengerDirectChat
└── services/
    ├── matrix-sdk-access.service.ts         # wrapper around matrix-js-sdk
    └── matrix-user-management.service.ts    # Synapse Admin API calls
```
