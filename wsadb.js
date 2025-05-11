/ wsadb.js - WebSendADB Wrapper with vendor presets
;(function(window){
  const WebSendADB = {};
  let adbDevice = null;
  let adbConnection = null;

  // Default filter list
  WebSendADB._filters = [
    { vendorId: 0x18d1 },   // Google (Android)
    { vendorId: 0x2833 },   // Meta/Oculus
    { vendorId: 0x04E8 },   // Samsung
    { vendorId: 0x12D1 },   // Huawei
    { vendorId: 0x2717 },   // Xiaomi
    { vendorId: 0x2B0E },   // Pico
    { classCode: 0xff }     // fallback for ADB interfaces
  ];

  // Preset sets
  WebSendADB.presets = {
    default: ['google','meta','samsung','huawei','xiaomi','pico'],
    google:   [{ vendorId:0x18d1 }],
    meta:     [{ vendorId:0x2833 }],
    samsung:  [{ vendorId:0x04E8 }],
    huawei:   [{ vendorId:0x12D1 }],
    xiaomi:   [{ vendorId:0x2717 }],
    pico:     [{ vendorId:0x2B0E }],
    all:      WebSendADB._filters
  };

  /**
   * Choose a preset by name or custom filter array
   */
  WebSendADB.usePreset = function(name) {
    if (WebSendADB.presets[name]) {
      WebSendADB._currentFilters = WebSendADB.presets[name];
    } else {
      throw new Error(`Preset '${name}' not found`);
    }
  };

  /**
   * Supply custom filter array: [{ vendorId, productId, classCode }...]
   */
  WebSendADB.setCustomFilters = function(filters) {
    if (!Array.isArray(filters)) throw new Error('Filters must be an array');
    WebSendADB._currentFilters = filters;
  };

  // Initialize current filters to default
  WebSendADB._currentFilters = WebSendADB.presets.default.map(key => {
    // convert preset keys into filter objects
    if (typeof key === 'string' && WebSendADB.presets[key]) return WebSendADB.presets[key][0];
    return key;
  });

  /**
   * Connect to device via WebUSB
   */
  WebSendADB.connect = async function() {
    console.log('WebSendADB.connect() called');
    if (!('usb' in navigator)) throw new Error('WebUSB not supported');
    adbDevice = await navigator.usb.requestDevice({ filters: WebSendADB._currentFilters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);
    console.log('Device opened:', adbDevice);
    // Initialize ADB transport (assumes webusb.js loaded)
    const { Adb } = window;
    const transport = await Adb.open(adbDevice);
    adbConnection = await transport.connectAdb();
    console.log('ADB connection established');
  };

  /**
   * Send an ADB shell command
   */
  WebSendADB.sendCommand = async function(cmd) {
    if (!adbConnection) throw new Error('Not connected');
    console.log('Sending command:', cmd);
    const shell = await adbConnection.shell(cmd);
    const result = await shell.readAll();
    const text = new TextDecoder().decode(result);
    console.log('Command output:', text);
    return text;
  };

  WebSendADB.isConnected = () => adbConnection !== null;

  window.WebSendADB = WebSendADB;
})(window);
