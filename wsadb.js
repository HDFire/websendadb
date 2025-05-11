// wsadb.js - WebSendADB Wrapper
// Expose global WebSendADB object
;(function(window){
  const WebSendADB = {};
  let adbDevice = null;
  let adbConnection = null;

  WebSendADB.connect = async function() {
    console.log('WebSendADB.connect() called');
    if (!('usb' in navigator)) {
      throw new Error('WebUSB not supported');
    }
    adbDevice = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x18d1 }] });
    await adbDevice.open();
    await adbDevice.selectConfiguration(1);
    await adbDevice.claimInterface(0);
    console.log('Device opened:', adbDevice);

    // Initialize ADB transport
    const { Adb } = window; // assumes webusb.js loaded
    const transport = await Adb.open(adbDevice);
    adbConnection = await transport.connectAdb();
    console.log('ADB connection established');
  };

  WebSendADB.sendCommand = async function(cmd) {
    if (!adbConnection) {
      throw new Error('Not connected');
    }
    console.log('Sending command:', cmd);
    const shell = await adbConnection.shell(cmd);
    const result = await shell.readAll();
    const text = new TextDecoder().decode(result);
    console.log('Command output:', text);
    return text;
  };

  WebSendADB.isConnected = function() {
    return adbConnection !== null;
  };

  window.WebSendADB = WebSendADB;
})(window);
