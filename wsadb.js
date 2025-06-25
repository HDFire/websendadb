// wsadb.js – WebSendADB wrapper Build 11b (loads webusb.js raw from GitHub)
console.log("WebSendADB wrapper Build 11b loaded");

(function(window) {
  'use strict';

  const WebSendADB = {};
  let adbDevice = null, adbConnection = null;
  const history = [];

  // USB device filters for ADB
  const filters = [
    { vendorId: 0x18d1 }, // Google
    { vendorId: 0x04E8 }, // Samsung
    { vendorId: 0x2717 }, // Xiaomi
    { classCode: 0xFF }   // Fallback
  ];

  const presets = {
    default: filters,
    google: [{ vendorId: 0x18d1 }],
    samsung: [{ vendorId: 0x04E8 }],
    xiaomi: [{ vendorId: 0x2717 }],
    custom: filters
  };

  WebSendADB.usePreset = function(name) {
    if (!presets[name]) throw new Error(`Preset '${name}' not found`);
    filters.length = 0;
    filters.push(...presets[name]);
  };

  WebSendADB.addCustomFilter = function(filter) {
    if (typeof filter === 'object') filters.push(filter);
  };

  WebSendADB.getHistory = () => [...history];
  WebSendADB.isConnected = () => !!adbConnection;
  WebSendADB.disconnect = () => {
    if (adbDevice) adbDevice.close();
    adbDevice = adbConnection = null;
  };

  WebSendADB.sendCommand = async function(cmd) {
    if (!adbConnection) throw new Error('Not connected');
    history.push(cmd);
    const shell = await adbConnection.shell(cmd);
    const data = await shell.readAll();
    return new TextDecoder().decode(data);
  };

  WebSendADB.connect = async function() {
    if (!navigator.usb) throw new Error('WebUSB not supported');

    if (!window.Adb || !window.AdbWebUsbTransport) {
      await loadWebUSB();
    }

    const Adb = window.Adb;
    const AdbWebUsbTransport = window.AdbWebUsbTransport;

    adbDevice = await navigator.usb.requestDevice({ filters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);

    const transport = new AdbWebUsbTransport(adbDevice);
    const adb = await Adb.open(transport);
    adbConnection = await adb.connect('host::');

    console.log("Connected to ADB device.");
  };

  async function loadWebUSB() {
    // Using GitHub raw URL for webusb.js
    const urls = [
      'https://raw.githubusercontent.com/webadb/webusb/main/webadb.js'
    ];

    for (let url of urls) {
      try {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = url;
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });

        if (window.Adb && window.AdbWebUsbTransport) return;
      } catch (e) {
        console.warn("Failed to load WebUSB from", url);
      }
    }

    throw new Error("WebUSB could not be loaded from any source.");
  }

  window.WebSendADB = WebSendADB;
})(window);
