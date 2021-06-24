import { createBluetooth } from "node-ble";

const config = {
    gattServer: null,
    service: null,
    displayService: null,
    device: null,
    adapter: null,
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

const x =
    "         "
 +  "  *   *  "
 +  "  **  *  "
 +  "  *** *  "
 +  "  *****  "
 +  "  *** *  "
 +  "  **  *  "
 +  "  *   *  "
 +  "         ";

export async function connectNuimo(mac, debug = false) {
    if (!mac)
        throw new Error("No MAC Address specified")

    const adapter = await config.bluetooth.defaultAdapter();

    config.mac = mac;
    config.adapter = adapter;

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

    const substrings = [];

    for (let i = 0; i < 81; i += 8)
        substrings.push(x.substr(i, 8));
    
    const binary = substrings.map(leds => {
        return leds.split('').reduce((acc, led, index) => {
            if (led !== " ")
                return acc + (1 << index);
            else
                return acc;
        }, 0)
    });

    console.log(substrings, binary)

    const c = await config.displayService.getCharacteristicById(0);
    
    c.writeValue(Buffer.from(new Uint8Array([0, 136, 48, 225, 194, 135, 11, 19, 34, 0, 16, 255, 20])));

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

    console.log("Setting up notifications...")

    await characteristic.startNotifications();

    characteristic.on('valuechanged', buffer => callback(buffer.toString("hex")));

}