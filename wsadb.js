// wsadb.js - auto-load webadb if missing, then run wrapper
;(function(window) {
  'use strict';
  console.log('WebSendADB wrapper build 7 loaded');

  const WEBADB_URL = 'https://cdn.jsdelivr.net/npm/webadb@6.0.9/webadb.js';

  const WebSendADB = {};
  let adbDevice = null;
  let adbConnection = null;

  // Default USB filters
  let filters = [
    { vendorId: 0x18d1 }, // Google
    { vendorId: 0x2833 }, // Meta/Oculus
    { vendorId: 0x04E8 }, // Samsung
    { vendorId: 0x12D1 }, // Huawei
    { vendorId: 0x2717 }, // Xiaomi
    { vendorId: 0x2B0E }, // Pico
    { classCode: 0xFF }  // ADB fallback
  ];

  const presets = {
    default: filters,
    google:   [{ vendorId: 0x18d1 }],
    meta:     [{ vendorId: 0x2833 }],
    samsung:  [{ vendorId: 0x04E8 }],
    huawei:   [{ vendorId: 0x12D1 }],
    xiaomi:   [{ vendorId: 0x2717 }],
    pico:     [{ vendorId: 0x2B0E }],
    all:      filters
  };

  WebSendADB.usePreset = function(name) {
    if (!presets[name]) throw new Error(`Preset '${name}' not found`);
    filters = presets[name];
  };

  // Load webadb.js script dynamically if needed
  function loadWebADB() {
    return new Promise((resolve, reject) => {
      if (window.Adb && window.AdbWebUsbTransport) {
        // Already loaded
        resolve();
        return;
      }
      console.log('Loading webadb.js dynamically...');
      const script = document.createElement('script');
      script.src = WEBADB_URL;
      script.onload = () => {
        console.log('webadb.js loaded');
        // Wait a tiny bit for globals to initialize
        setTimeout(() => {
          if (window.Adb && window.AdbWebUsbTransport) {
            resolve();
          } else {
            reject(new Error('webadb.js loaded but WebADB globals not found'));
          }
        }, 50);
      };
      script.onerror = () => reject(new Error('Failed to load webadb.js'));
      document.head.appendChild(script);
    });
  }

  WebSendADB.connect = async function() {
    if (!navigator.usb) throw new Error('WebUSB not supported');

    await loadWebADB();

    const Adb = window.Adb || (window.WebUSB && window.WebUSB.Adb);
    const AdbWebUsbTransport = window.AdbWebUsbTransport || (window.WebUSB && window.WebUSB.AdbWebUsbTransport);

    adbDevice = await navigator.usb.requestDevice({ filters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);

    const transport = new AdbWebUsbTransport(adbDevice);
    const adb = await Adb.open(transport);
    adbConnection = await adb.connect('host::');
  };

  WebSendADB.sendCommand = async function(cmd) {
    if (!adbConnection) throw new Error('Not connected');
    const shell = await adbConnection.shell(cmd);
    const data = await shell.readAll();
    return new TextDecoder().decode(data);
  };

  WebSendADB.isConnected = () => !!adbConnection;

  window.WebSendADB = WebSendADB;
})(window);
