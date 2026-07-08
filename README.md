# 🚪 CoRoom (CollabCode)

A real-time collaborative code editor — write, run, and debug code together in the same room, live, with your team or friends. Think Google Docs, but for code.

![status](https://img.shields.io/badge/status-active-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **Real-time collaborative editing** — every keystroke syncs instantly across all connected users via CRDTs (Yjs), so multiple people can type in the same file at once without conflicts.
- **Google Sign-In** — quick, secure authentication via Firebase Auth.
- **Room-based sessions** — create a room and share the Room ID or invite link to bring others in.
- **Live presence & cursors** — see who else is in the room, with colored cursors and an active members panel.
- **Multi-language support** — JavaScript, Python, C, C++, and Java, with CodeMirror 6 syntax highlighting for each.
- **In-browser code execution** — hit "Run Code" to compile/execute the current code and see stdout/stderr in a console panel.
- **Live connection status** — clear indicator for Live / Syncing / Connecting / Offline states.
- **Language lock** — once code has been written in a room, the language can't be silently changed out from under it (prevents accidentally re-interpreting the same buffer as a different language).

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, CodeMirror 6 (`@uiw/react-codemirror`) |
| Real-time sync | [Yjs](https://github.com/yjs/yjs) (CRDT) + `y-websocket` + `y-codemirror.next` |
| Auth | Firebase Authentication (Google provider) |
| Collab/execution server | Node.js, Express, `ws` |
| Code execution | Node `child_process`, shelling out to locally installed language toolchains |

---

## ⚠️ How code execution actually works (read this)

The "Run Code" button does **not** run code in the browser and does **not** ship any compilers with the app. When you click Run:

1. The current code is sent from the browser to the local Express server (`server.js`).
2. The server writes it to a temp file and shells out to whatever toolchain is installed **on the machine running the server**:

   | Language | Command the server runs |
   |---|---|
   | JavaScript | `node script.js` |
   | Python | `python`/`python3` (auto-detected) `script.py` |
   | C | `gcc program.c -o out && ./out` |
   | C++ | `g++ program.cpp -o out && ./out` |
   | Java | `javac Main.java && java Main` |

3. stdout/stderr is captured and sent back to the browser.

This means **the server machine needs these installed and available on its `PATH`** for the corresponding language to run:
- Node.js (already required to run the app itself)
- Python 3
- GCC/G++ (e.g. via [MinGW-w64](https://www.mingw-w64.org/) on Windows, or `build-essential` on Linux)
- A JDK (e.g. [Adoptium Temurin](https://adoptium.net/)) providing `javac` and `java`

You can verify each is set up correctly by running `python --version`, `gcc --version`, `g++ --version`, and `javac -version` / `java -version` in your terminal — if any of those fail, that language's "Run" won't work until it's installed and on `PATH`.

### 🔒 Security note

This project currently executes submitted code **directly on the host machine with no sandboxing** — no containerization, no resource isolation beyond an 8-second timeout. This is fine for **local/personal use**, but it is **not safe to deploy publicly** as-is, since anyone in a room could run arbitrary code on your server. If you want to deploy this for others to use, look into a proper sandboxed execution layer (e.g. self-hosting [Piston](https://github.com/engineer-man/piston) or [Judge0](https://github.com/judge0/judge0) in Docker) instead of executing code directly on your own infrastructure.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 14 and npm >= 6
- (Optional, only needed for code execution) Python, GCC/G++, and a JDK installed and on `PATH` — see above

### Installation

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

### Firebase setup

This project uses Firebase Authentication for Google Sign-In. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), enable the Google sign-in provider under **Authentication → Sign-in method**, and drop your web app config into `src/firebaseConfig.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> Firebase web config values aren't secret in the traditional sense (they're safe to ship to the browser), but if you fork this for your own project, make sure your Firebase **Authentication → Settings → Authorized domains** and **Firestore/Realtime Database security rules** (if you add either later) are locked down properly.

### Running locally

Run the collaboration/execution server and the React app together:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
npm run server   # starts the Express + WebSocket server on port 5000
npm start        # starts the React dev server on port 3000
```

Then open [http://localhost:3000](http://localhost:3000), sign in with Google, and create or join a room.

---

## 📁 Project Structure

```
├── server.js                  # Express + WebSocket server: Yjs room sync + code execution
├── src/
│   ├── App.js                 # Auth flow, room join/create, workspace header
│   ├── firebaseConfig.js      # Firebase Auth setup
│   ├── components/
│   │   ├── Editor.js          # CodeMirror editor, language switcher, run/output panels
│   │   └── icons.js           # Small dependency-free inline SVG icon set
│   └── hooks/
│       └── useCollab.js       # Yjs + y-websocket collaboration hook (CollabProvider/useCollab)
└── package.json
```

---

## 🗺️ Roadmap

- [ ] Sandboxed code execution (Docker-based or self-hosted Piston) for safe public deployment
- [ ] More language support (Go, Rust, Ruby, TypeScript)
- [ ] Persistent room history / saved snippets
- [ ] Light theme option
- [ ] Per-user chat alongside the shared editor

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgements

- [Yjs](https://github.com/yjs/yjs) for CRDT-based real-time sync
- [CodeMirror](https://codemirror.net/) for the in-browser editor
- [Firebase](https://firebase.google.com/) for authentication
