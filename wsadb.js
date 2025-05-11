// wsadb.js - WebSendADB ES Module with embedded WebUSB-ADB
import { Adb, AdbWebUsbTransport } from 'https://unpkg.com/@yume-chan/adb@0.34.0/dist/esm/webusb.js';

const WebSendADB = (() => {
  let adbDevice = null;
  let adbConnection = null;
  let filters = [
    { vendorId: 0x18d1 },   // Google
    { vendorId: 0x2833 },   // Meta/Oculus
    { vendorId: 0x04E8 },   // Samsung
    { vendorId: 0x12D1 },   // Huawei
    { vendorId: 0x2717 },   // Xiaomi
    { vendorId: 0x2B0E },   // Pico
    { classCode: 0xFF }     // ADB interface fallback
  ];

  const presets = {
    default: filters,
    google:   [{ vendorId:0x18d1 }],
    meta:     [{ vendorId:0x2833 }],
    samsung:  [{ vendorId:0x04E8 }],
    huawei:   [{ vendorId:0x12D1 }],
    xiaomi:   [{ vendorId:0x2717 }],
    pico:     [{ vendorId:0x2B0E }],
    all:      filters
  };

  async function connect() {
    if (!('usb' in navigator)) throw new Error('WebUSB not supported');
    adbDevice = await navigator.usb.requestDevice({ filters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);
    const transport = new AdbWebUsbTransport(adbDevice);
    const adb = await Adb.open(transport);
    adbConnection = await adb.connect('host::');
  }

  async function sendCommand(cmd) {
    if (!adbConnection) throw new Error('Not connected');
    const shell = await adbConnection.shell(cmd);
    const data = await shell.readAll();
    return new TextDecoder().decode(data);
  }

  function usePreset(name) {
    if (!presets[name]) throw new Error(`Preset '${name}' not found`);
    filters = presets[name];
  }

  function setCustomFilters(array) {
    if (!Array.isArray(array)) throw new Error('Filters must be array');
    filters = array;
  }

  function isConnected() {
    return adbConnection !== null;
  }

  return { connect, sendCommand, usePreset, setCustomFilters, isConnected };
})();

// Expose on window
window.WebSendADB = WebSendADB;
