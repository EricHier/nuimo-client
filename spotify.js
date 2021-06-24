import { JSONFile, Low } from "lowdb/lib";
import fetch from "node-fetch";

const adapter = new JSONFile("./config.json");
const db = new Low(adapter);

const toUrlEncoded = obj => Object.keys(obj).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k])).join('&');

const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

const requests = {
    player: ["https://api.spotify.com/v1/me/player", { method: "GET", headers }],
    pause: ["https://api.spotify.com/v1/me/player/pause", { method: "PUT", headers }],
    resume: ["https://api.spotify.com/v1/me/player/play", { method: "PUT", headers }],
    next: ["https://api.spotify.com/v1/me/player/next", { method: "POST", headers }],
    volume: ["https://api.spotify.com/v1/me/player/volume", { method: "PUT", headers }]
}

let volume;

// when the db is ready make sure auth is correct
db.read().then(async function refreshAuth() {
    let body = {};

    if (process.env.CODE)
        body = { grant_type: "authorization_code", code: process.env.CODE };
    else
        body = { refresh_token: db.data.code, grant_type: "refresh_token" };

    let requestContent = ["https://accounts.spotify.com/api/token", { method: "POST", headers: { ...headers, Authorization: "Basic MTdmYWYwOWI2NGM2NGYzYWJhMjQyZmMzMzlkYzM5N2Y6NDFkZjQ2YmExNzc0NDJkZWI4OWI3ODU0MzM5ODFjNTM=", "Content-Type": "application/x-www-form-urlencoded" }, body: toUrlEncoded({ ...body, redirect_uri: "https://erichier.tech" }) }];

    const token = await request(requestContent);

    // request successful
    if (token.access_token) {
        db.data.code = token.refresh_token || db.data.code;
        headers.Authorization = `Bearer ${token.access_token}`

        setTimeout(refreshAuth, token.expires_in * 1001);

        console.log("Successful Spotify authentication");
    } else console.log("Unsuccessful Spotify authentication", token)

    await db.write()
})

// refresh volume every couple of seconds
setInterval(async () => {
    volume = await getVolume();
}, 5000);

async function request(type) {
    const body = await fetch(...type), text = await body.text();

    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

export async function changeSpotifyPlaybackState() {

    const { is_playing } = await request(requests.player);

    if (is_playing)
        await request(requests.pause);
    else
        await request(requests.resume);

    console.log(`Changed Spotify playback state ${is_playing}`);
}

async function getVolume() {

    const { device: { volume_percent } } = await request(requests.player);
    return volume_percent / 100;
}

export function getCachedVolume() {
    return volume;
}

export async function setVolume(pVolume) {
    volume = pVolume;

    await request([requests.volume[0] + `?volume_percent=${Math.floor(volume * 100)}`, requests.volume[1]]);

    console.log(`Set Spotify volume to ${volume}`);
}

export async function nextSong() {
    await request(requests.next);

    console.log("Skipped song");
}
