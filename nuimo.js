import { connectNuimo, drawMatrix, subscribe } from "./nuimo-sdk/src";
import { changeSpotifyPlaybackState, nextSong, previousSong, setVolume as setSpotifyVolume, volume, isPlaying } from "./spotify"
import { JSONFile, Low } from "lowdb/lib";
import { lineMatrixFromNumber, next, play, pause, previous } from "./matrices";
import _ from "lodash";

const adapter = new JSONFile("./config.json");
const db = new Low(adapter);


(async function () {

  // - - - - - - - - - - - - - - - - - - 
  //        DB STUFF
  // - - - - - - - - - - - - - - - - - - 

  await db.read();

  const mac = db.data.mac;

  // - - - - - - - - - - - - - - - - - - 
  //        NUIMO STUFF
  // - - - - - - - - - - - - - - - - - - 

  await connectNuimo(mac, false);

  // play pause
  subscribe("onButtonClick", async () => {
    await changeSpotifyPlaybackState();

    if (isPlaying)
      await drawMatrix(pause);
    else
      await drawMatrix(play);
  });

  subscribe("onSwipeRight", async () => {
    await nextSong();
    await drawMatrix(next);
  });

  subscribe("onSwipeLeft", async () => {
    await previousSong();
    await drawMatrix(previous);
  });

  const displayVolume = _.throttle(newVolume => drawMatrix(lineMatrixFromNumber(newVolume)), 300);

  // set volume
  subscribe("onWheel", async factor => {

    if (!isPlaying)
      return false;

    let modifier = (Math.abs(factor) ** 1.8) * (factor < 0 ? -1 : 1) * 0.01, newVolume = volume + modifier;

    if (newVolume < 0) newVolume = 0;
    else if (newVolume > 1) newVolume = 1;

    displayVolume(Math.floor(newVolume * 100));

    setSpotifyVolume(newVolume);
  });

  console.log("Everything set up!")

})();
