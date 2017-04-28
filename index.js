(() => {
    const fs = require("fs");
    const outputPath = "./output/"
    let ourInterval = null;

    let songs = {};

    document.getElementById("radio-URL-submit").addEventListener("click", (e) => {
        debug("boop!");
        if (ourInterval) {
            clearInterval(ourInterval);
        }

        const radioURL = document.getElementById("radio-URL-input").value;
        const radioIframe = document.getElementById("radio-iframe");
        radioIframe.setAttribute("src", radioURL);

        const ourFilename = "output-" + radioURL.replace(/[^A-Za-z]/g, "") + ".json";
        if(checkIfOutputFileExists(ourFilename)) {
            songs = JSON.parse(fs.readFileSync(outputPath + ourFilename));
        } else if (Object.keys(songs).length === 0) {
            songs = {
                ourFilename: ourFilename,
                radioURL: radioURL,
                startTime: Date.now(),
                endTime: Date.now(),
                lastSongText: "",
                totalPlayed: 0,
                songList: {}
            };
        }


        radioIframe.onload = () => {
            ourInterval = setInterval(saveProgress, 1000 * 60 * 2);

            const radioDocument = radioIframe.contentWindow.document || radioIframe.contentDocument;

            const songTextElement = radioDocument.getElementsByClassName("song-text")[0];
            songTextElement.addEventListener("DOMSubtreeModified", addSongToList);
            addSongToList();
            function addSongToList() {
                const songText = songTextElement.innerHTML;
                if(songText === songs.lastSongText) {
                    return;
                }
                const songTextSanitised = songText.replace(/[^A-za-z_]/g, "")
                let ourSong = (songs.songList[songTextSanitised] ? songs.songList[songTextSanitised] : {
                    name: songText,
                    frequency: 0,
                    timesPlayed: []
                });

                ourSong.frequency += 1;
                ourSong.timesPlayed.push(Date.now());
                console.log(ourSong);
                console.log(songs.songList);
                songs.songList[songTextSanitised] = ourSong;
                debug("Added song " + songText);
                songs.lastSongText = songText;
            }
        };
    });

    function saveProgress() {
        songs.endTime = Date.now();
        fs.writeFile(outputPath + songs.ourFilename, JSON.stringify(songs, null, 4), (err) => {
            console.log("Wrote to output file");
            debug("saved to " + songs.ourFilename + " at " + Date.now());
        });
    }

    function debug(message) {
        if (document.getElementById("debug").innerHTML.length > 10000) {
            document.getElementById("debug").innerHTML = "";
        }
        document.getElementById("debug").innerHTML += message + "<br>";
    }

    function checkIfOutputFileExists(filename) {
        return fs.existsSync(outputPath + filename);
    }

    window.onbeforeunload = (e) => {
        saveProgress(songs.ourFilename);
    };
})();