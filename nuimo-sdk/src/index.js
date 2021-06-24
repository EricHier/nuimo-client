import { createBluetooth } from "node-ble";

const config = {
    gattServer: null,
    service: null,
    displayService: null,
    device: null,
    adapter: null,
    debug: false,
    bluetooth: createBluetooth().bluetooth,
    mac: null,
    callbacks: {
        onWheel: () => { },
        onButtonClick: () => { },
        onSwipeRight: () => { },
        onSwipeUp: () => { },
        onSwipeLeft: () => { },
        onSwipeDown: () => { },
        onTouchRight: () => { },
        onTouchTop: () => { },
        onTouchBottom: () => { },
        onTouchLeft: () => { },
    }
}

export async function connectNuimo(mac, debug = false) {
    if (!mac)
        throw new Error("No MAC Address specified")

    const adapter = await config.bluetooth.defaultAdapter();

    config.mac = mac;
    config.adapter = adapter;
    config.debug = debug;

    if (!await adapter.isDiscovering())
        await adapter.startDiscovery();

    config.device = await adapter.waitDevice(mac);
    await config.device.connect();

    config.device.on("disconnect", () => {
        if (debug) console.log("Lost connection to Numio, reconnecting...");
        connectNuimo(mac);
    });

    if (debug)
        console.log("Connection to Nuimo established...")

    config.gattServer = await config.device.gatt();

    if (debug)
        console.log("Activating service...")

    config.service = await config.gattServer.getPrimaryService("f29b1525-cb19-40f3-be5c-7241ecb82fd2");
    config.displayService = await config.gattServer.getPrimaryService("f29b1523-cb19-40f3-be5c-7241ecb82fd1");

    await subscribeCharacteristic(0, async hex => {

        if (hex.slice(1, 2) != 1)
            return;

        config.callbacks.onButtonClick();

    });

    await subscribeCharacteristic(2, async hex => {

        if (debug) console.log(hex);

        switch (hex) {
            case "00": return config.callbacks.onSwipeLeft();
            case "01": return config.callbacks.onSwipeRight();
            case "02": return config.callbacks.onSwipeUp();
            case "03": return config.callbacks.onSwipeDown();
            case "04": return config.callbacks.onTouchLeft();
            case "05": return config.callbacks.onTouchRight();
            case "06": return config.callbacks.onTouchTop();
            case "07": return config.callbacks.onTouchBottom();
        }

    });

    await subscribeCharacteristic(3, async hex => {

        const left = hex.slice(2, 3) !== "0", acceleration = parseInt(`0x${hex.slice(0, 2)}`), factor = (left ? 255 - acceleration : acceleration) / 100;

        config.callbacks.onWheel(factor * (left ? -1 : 1));

    });
}

export async function drawMatrix(matrix) {
    if (!matrix || matrix.length !== 81)
        throw new Error("Invalid matrix");

    const substrings = [];

    for (let i = 0; i < 80; i += 8) substrings.push(matrix.substr(i, 8));

    const array = substrings.map(leds => leds.split('').reduce((acc, led, index) => led !== " " ? acc + (1 << index) : acc, 0));

    array.push(16); // 16 if fading
    array.push(255); // brightness
    array.push(20); // interval

    if (config.debug) console.log("Sending matrix", array);

    const c = await config.displayService.getCharacteristicById(0);

    await c.writeValue(Buffer.from(new Uint8Array(array)));
}

export function subscribe(event, callback) {
    if (!config.callbacks.hasOwnProperty(event))
        throw new Error("Invalid event");

    if (!event || !callback)
        throw new Error("Invalid parameters")

    config.callbacks[event] = callback;
}

async function subscribeCharacteristic(id, callback) {

    const characteristic = await config.service.getCharacteristicById(id);

    const buffer = await characteristic.readValue()

    if (config.debug) console.log("Setting up notifications...")

    await characteristic.startNotifications();

    characteristic.on('valuechanged', buffer => callback(buffer.toString("hex")));

}