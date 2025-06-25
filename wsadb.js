// wsadb.js – WebSendADB wrapper build 10 (ESM + smart loader)
console.log("WebSendADB wrapper build 10 loaded");

(async function(global) {
  'use strict';
  console.log('wsadb.js ESM init (build 10)');

  // Smart WebADB loader
  async function loadWebADBModule() {
    const sources = [
      // Module-ready versions (if exist)
      'https://cdn.jsdelivr.net/npm/webadb@6.0.9/webadb.min.js',
      'https://unpkg.com/webadb@6.0.9/webadb.min.js'
    ];
    for (let url of sources) {
      try {
        await import(url);
        if (global.Adb && global.AdbWebUsbTransport) {
          console.log(`webadb module loaded from ${url}`);
          return;
        }
      } catch (e) {
        console.warn(`Module import failed: ${url}`, e);
      }
    }
    throw new Error('Unable to load webadb module from CDNs');
  }

  function loadWebADBScript() {
    return new Promise((resolve, reject) => {
      const urls = [
        'https://cdn.jsdelivr.net/npm/webadb@6.0.9/webadb.js',
        'https://unpkg.com/webadb@6.0.9/webadb.js'
      ];
      (async function attempt(i) {
        if (i >= urls.length) return reject(new Error('All webadb script loads failed'));
        const s = document.createElement('script');
        s.src = urls[i];
        s.onload = () => resolve();
        s.onerror = () => {
          console.warn('Failed script load, trying next CDN:', urls[i]);
          attempt(i + 1);
        };
        document.head.appendChild(s);
      })(0);
    });
  }

  async function ensureWebADB() {
    const modSupport = typeof import === 'function';
    if (!global.Adb || !global.AdbWebUsbTransport) {
      try {
        if (modSupport) await loadWebADBModule();
        else await loadWebADBScript();
      } catch {
        await loadWebADBScript();
      }
      await new Promise(r => setTimeout(r, 50));
      if (!global.Adb || !global.AdbWebUsbTransport) {
        throw new Error('WebADB could not be loaded');
      }
    }
  }

  // Basic wrapper
  const WebSendADB = {};
  let adbDevice = null, adbConnection = null;
  const history = [];

  const defaultFilters = [
    { vendorId: 0x18d1 }, { vendorId: 0x04E8 }, { vendorId: 0x2717 }, { classCode: 0xFF }
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
  WebSendADB.addCustomFilter = f => {
    if (typeof f !== 'object') throw new Error('Filter must be object');
    filters.push(f);
  };
  WebSendADB.getHistory = () => [...history];
  WebSendADB.isConnected = () => !!adbConnection;
  WebSendADB.disconnect = () => {
    if (adbDevice) adbDevice.close();
    adbDevice = adbConnection = null;
  };

  WebSendADB.sendCommand = async cmd => {
    if (!adbConnection) throw new Error('Not connected');
    history.push(cmd);
    const shell = await adbConnection.shell(cmd);
    return new TextDecoder().decode(await shell.readAll());
  };

  WebSendADB.connect = async () => {
    if (!navigator.usb) throw new Error('WebUSB not supported');
    await ensureWebADB();

    const Adb = global.Adb || (global.WebUSB && global.WebUSB.Adb);
    const AdbWebUsbTransport =
      global.AdbWebUsbTransport || (global.WebUSB && global.WebUSB.AdbWebUsbTransport);
    if (!Adb || !AdbWebUsbTransport) throw new Error('WebADB globals not available');

    adbDevice = await navigator.usb.requestDevice({ filters });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);

    const transport = new AdbWebUsbTransport(adbDevice);
    const adb = await Adb.open(transport);
    adbConnection = await adb.connect('host::');

    WebSendADB.sendCommand('getprop ro.product.model')
      .then(m => console.log('Device model:', m.trim()))
      .catch(e => console.warn('Model fetch failed', e));
  };

  global.WebSendADB = WebSendADB;
})(window);
