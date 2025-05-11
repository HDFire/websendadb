// wsadb.js - WebSendADB wrapper (requires global Adb and AdbWebUsbTransport)
console.log("WebSendAdb Build 4");
;(function(window) {
  'use strict';
  console.log('WebSendADB wrapper loaded');

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
    google:   [{ vendorId:0x18d1 }],
    meta:     [{ vendorId:0x2833 }],
    samsung:  [{ vendorId:0x04E8 }],
    huawei:   [{ vendorId:0x12D1 }],
    xiaomi:   [{ vendorId:0x2717 }],
    pico:     [{ vendorId:0x2B0E }],
    all:      filters
  };

  WebSendADB.usePreset = function(name) {
    if (!presets[name]) throw new Error(`Preset '${name}' not found`);
    filters = presets[name];
  };

  WebSendADB.connect = async function() {
    console.log('WebSendADB.connect()');
    if (!navigator.usb) throw new Error('WebUSB not supported');
    if (!window.Adb || !window.AdbWebUsbTransport) {
      throw new Error('Host page must include ADB WebUSB library (e.g. webusb.js)');
    }
    adbDevice = await navigator.usb.requestDevice({ filters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);
    // Use global Adb & AdbWebUsbTransport
    const transport = new window.AdbWebUsbTransport(adbDevice);
    const adb = await window.Adb.open(transport);
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
