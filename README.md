# WebSendADB

**WebSendADB** is a client-side JavaScript API that allows websites to send ADB (Android Debug Bridge) commands to Android devices directly via WebUSB. It requires no backend server and is perfect for use in GitHub Pages or other static hosting environments.

## 🚀 Features

- ⚡ Send ADB commands directly from the browser
- 🔌 Uses WebUSB to connect to Android devices
- 🔁 Works with all Android devices that support ADB over USB
- 🧱 Easy integration into any website or webapp
- 🔐 No installation, drivers, or backend required

## 📦 Installation

Just include the script in your HTML:

    <script src="https://hdfire.github.io/websendadb/wsadb.js"></script>

## 📚 Basic Usage

    <button onclick="WebSendADB.connect()">Connect Device</button>
    <button onclick="WebSendADB.sendCommand('reboot')">Reboot Device</button>

JavaScript:

    // Connect to the device
    await WebSendADB.connect();

    // Send an ADB command
    await WebSendADB.sendCommand("reboot");

## 🌐 Compatibility

- Android 9+ (USB debugging enabled)
- Chromium-based browsers (Chrome, Edge, Brave, etc.)
- Secure contexts (HTTPS or localhost)

## 📜 License

MIT License

