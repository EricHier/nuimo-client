import { initChromecast, getCachedVolume as getCachedChromecastVolume, setVolume as setChromecastVolume, playing as isChromecastPlaying } from "./chromecast"
import { connectNuimo, subscribe } from "./nuimo-sdk/src";
import { changeSpotifyPlaybackState, nextSong, getCachedVolume as getCachedSpotifyVolume, setVolume as setSpotifyVolume } from "./spotify"
import { JSONFile, Low } from "lowdb/lib";

const adapter = new JSONFile("./config.json");
const db = new Low(adapter);


(async function () {

  // - - - - - - - - - - - - - - - - - - 
  //        DB STUFF
  // - - - - - - - - - - - - - - - - - - 

  await db.read();

  const mac = db.data.mac;

  // - - - - - - - - - - - - - - - - - - 
  //        CHROMECAST STUFF
  // - - - - - - - - - - - - - - - - - - 

  await initChromecast();

  // - - - - - - - - - - - - - - - - - - 
  //        NUIMO STUFF
  // - - - - - - - - - - - - - - - - - - 

  await connectNuimo(mac, true);

  // play pause
  subscribe("onButtonClick", async () => {
    await changeSpotifyPlaybackState();
  });

  subscribe("onSwipeRight", async () => {
    await nextSong();
  });

  // set volume
  subscribe("onWheel", async factor => {

    let modifier = (Math.abs(factor) ** 1.8) * (factor < 0 ? -1 : 1) * 0.01, newVolume = (isChromecastPlaying ? getCachedChromecastVolume() : getCachedSpotifyVolume()) + modifier;

    if (newVolume < 0) newVolume = 0;
    else if (newVolume > 1) newVolume = 1;

    if (isChromecastPlaying || getCachedSpotifyVolume() == NaN)
      await setChromecastVolume(newVolume);
    else
      await setSpotifyVolume(newVolume);
  });

  console.log("Everything set up!")

})();
