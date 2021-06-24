import CastClient from "castv2-promise";

let chromecastName = "Eric\'s Soundanlage", chromecast, volume;

export let playing;

export async function initChromecast() {

    chromecast = await CastClient.find(chromecastName);
    volume = await chromecast.getVolume();

    setInterval(async () => {
        ensureConnection();
        volume = await chromecast.getVolume();
        playing = !!(await chromecast.getStatus()).applications;
    }, 5000);

    console.log("Successfully connected to Chromecast...");
}

export function getCachedVolume() {
    return volume;
}

export async function setVolume(pVolume) {
    await ensureConnection();

    volume = pVolume;

    await chromecast.setVolume(volume);

    console.log(`Set Chromecast volume to ${volume}`);
}

export async function ensureConnection() {
    if (!chromecast)
        chromecast = await CastClient.find(chromecastName);
}