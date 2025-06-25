// wsadb.js – WebSendADB wrapper build 8a (no dynamic loading)
console.log("WebSendADB wrapper build 8a loaded");

;(function(window) {
  'use strict';
  console.log('WebSendADB wrapper initialized (build 8a)');

  const WebSendADB = {};
  let adbDevice = null, adbConnection = null;
  const history = [];

  const defaultFilters = [
    { vendorId: 0x18d1 }, // Google
    { vendorId: 0x04E8 }, // Samsung
    { vendorId: 0x2717 }, // Xiaomi
    { classCode: 0xFF }   // fallback
  ];
  let filters = [...defaultFilters];

  const presets = {
    default: filters,
    google: [{ vendorId: 0x18d1 }],
    samsung: [{ vendorId: 0x04E8 }],
    xiaomi: [{ vendorId: 0x2717 }],
    custom: filters
  };

  WebSendADB.usePreset = name => {
    if (!presets[name]) throw new Error(`Preset '${name}' not found`);
    filters = [...presets[name]];
  };

  WebSendADB.addCustomFilter = filter => {
    if (typeof filter !== 'object') throw new Error('Filter must be object');
    filters.push(filter);
  };

  WebSendADB.connect = async () => {
    if (!navigator.usb) throw new Error('WebUSB not supported');
    const Adb = window.Adb || (window.WebUSB && window.WebUSB.Adb);
    const AdbWebUsbTransport = window.AdbWebUsbTransport || (window.WebUSB && window.WebUSB.AdbWebUsbTransport);
    if (!Adb || !AdbWebUsbTransport) throw new Error('Include webadb.js before wsadb.js');

    adbDevice = await navigator.usb.requestDevice({ filters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);

    const transport = new AdbWebUsbTransport(adbDevice);
    const adb = await Adb.open(transport);
    adbConnection = await adb.connect('host::');

    WebSendADB.sendCommand('getprop ro.product.model')
      .then(model => console.log('Connected device model:', model.trim()))
      .catch(e => console.warn('Info fetch failed', e));
  };

  WebSendADB.sendCommand = async cmd => {
    if (!adbConnection) throw new Error('Not connected');
    history.push(cmd);
    const shell = await adbConnection.shell(cmd);
    const data = await shell.readAll();
    return new TextDecoder().decode(data);
  };

  WebSendADB.getHistory = () => [...history];

  WebSendADB.isConnected = () => !!adbConnection;

  WebSendADB.disconnect = () => {
    if (adbDevice) adbDevice.close();
    adbDevice = adbConnection = null;
  };

  window.WebSendADB = WebSendADB;
})(window);
