const SECONDS_IN_DAY = 24 * 60 * 60;
const TENTHS_IN_DAY = SECONDS_IN_DAY * 10;
const MUSIC_JSON_URL = "./admin/cosmic-radio/music.json";

// Return the shared playlist position with 0.1-second accuracy.
function dateToPlaylistSecond(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new TypeError("dateToPlaylistSecond expects a valid Date");
    }

    const timestamp = Math.floor(date.getTime() / 100);
    const day = Math.floor(timestamp / TENTHS_IN_DAY);
    // Spread consecutive days across different playlist starting points.
    const dailySeed = (Math.imul(day, 0x9e3779b1) >>> 0) % SECONDS_IN_DAY;

    return ((dailySeed * 10 + timestamp) % TENTHS_IN_DAY) / 10;
}

async function loadMusic(url = MUSIC_JSON_URL) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Could not load music manifest: ${response.status}`);
    }

    const tracks = await response.json();
    const isValidTrack = (track) => (
        typeof track.name === "string"
        && typeof track.file === "string"
        && Number.isFinite(track.duration)
        && track.duration > 0
    );

    if (!Array.isArray(tracks) || tracks.length === 0 || !tracks.every(isValidTrack)) {
        throw new TypeError("music.json contains an invalid track");
    }

    return tracks.map((track) => ({
        ...track,
        file: new URL(track.file, response.url).href
    }));
}

function getTrackAtSecond(tracks, second = dateToPlaylistSecond()) {
    const duration = tracks.reduce((sum, track) => sum + track.duration, 0);
    let offset = second % duration;

    for (const track of tracks) {
        if (offset < track.duration) {
            return { track, offset };
        }
        offset -= track.duration;
    }

    throw new Error("Could not find the current track");
}

function connectPlayButton(button) {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.6;
    let tracks = [];

    function setButton(
        playing,
        text = `${playing ? "Pause" : "Play"} Cosmic Radio`
    ) {
        button.setAttribute("aria-pressed", String(playing));
        button.setAttribute("aria-label", text);
        button.title = text;
    }

    async function playSelection(selection) {
        audio.addEventListener("loadedmetadata", () => {
            audio.currentTime = selection.offset;
        }, { once: true });
        audio.src = selection.track.file;
        await audio.play();
    }

    async function playFromCurrentTime() {
        let selection = getTrackAtSecond(tracks);

        // Assign only the selected MP3; the other tracks are never preloaded.
        await playSelection(selection);

        // Loading may take time, so seek again using the current clock.
        selection = getTrackAtSecond(tracks);

        if (audio.src !== selection.track.file) {
            await playSelection(selection);
        }

        audio.currentTime = selection.offset;
        setButton(true);
    }

    function showError(error, label) {
        console.error(error);
        audio.pause();
        setButton(false, label);
    }

    button.disabled = true;
    loadMusic()
        .then((loadedTracks) => {
            tracks = loadedTracks;
            button.disabled = false;
        })
        .catch((error) => {
            showError(error, "Cosmic Radio unavailable");
        });

    button.addEventListener("click", async () => {
        button.disabled = true;

        try {
            if (audio.paused) {
                await playFromCurrentTime();
            } else {
                audio.pause();
                setButton(false);
            }
        } catch (error) {
            showError(error, "Playback error. Try again");
        } finally {
            button.disabled = false;
        }
    });

    // Recalculate the position at track boundaries to prevent clock drift.
    audio.addEventListener("ended", () => {
        playFromCurrentTime().catch((error) => {
            showError(error, "Playback error. Try again");
        });
    });
}

window.CosmicRadio = { dateToPlaylistSecond, loadMusic };

const playButton = document.querySelector("#play-radio");
if (playButton) {
    connectPlayButton(playButton);
}
