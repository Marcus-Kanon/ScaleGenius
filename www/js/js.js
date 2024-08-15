import NoteNodePool from "./NoteNodePool.js";

const MAX_SELECTED_CHORDS = 5;
const ZOOM_AMOUNT = 100;
const bpmText = document.querySelector(".bpm-text");
const bpmSlider = document.querySelector(".bpm-slider");
const loadingModal = document.querySelector(".loading-modal");
const aboutModal = document.querySelector(".about-modal");
const tuningModal = document.querySelector(".tuning-modal");
const metronomeModal = document.querySelector(".metronome-modal");
const metronomeStartButton = document.querySelector(
    ".metronome-modal-start-button"
);
const modalOverlay = document.querySelector(".modal-overlay");
const neck = document.querySelector(".neck");
const chordShapesContainer = document.querySelector(".chord-shapes-container");
const rootNotesContainer = document.querySelector(".root-notes-container");
const selectedChordsContainerDiv = document.querySelector(
    ".selected-chord-shapes-container"
);
const tuningContainer = document.querySelector(".tuning-container");
const presetsDivPool = [];
const scaleViewer = document.querySelector(".scaleviewer-outer-container");
const menus = document.querySelectorAll(".menu-item");
const tuningPresetsContainer = document.querySelector(".tuning-presets");
const tuningFetchedPresets = document.querySelector(
    ".tuning-presets_fetched-tuning-presets"
);
const tuningPickNoteModal = document.querySelector(
    ".tuning-modal_strings_pick-note-modal"
);
const tuningModalModalOverlay = document.querySelector(
    ".tuning-modal_modal-overlay"
);
const guitarStrings = ["E", "A", "D", "G", "B", "E"].reverse();
const noteNodePool = new NoteNodePool();
const frequency = 440; // Frequency in hertz
const noteDivTemplate = document.createElement("div");
noteDivTemplate.classList.add("note");
noteDivTemplate.innerHTML =
    /* html */
    `
                <div class="note_note-text"></div>
                <div class="note_masked-note-div"></div>
                <svg class="note_svg" id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.75 32.25">
                <clipPath id="note-svgPath" clipPathUnits="objectBoundingBox" >
                    <path d="m0,0.34 s0.167,0,0.267,-0.132 C0.345,0.105,0.4,0.011,0.5,0.011 s0.155,0.094,0.233,0.198 c0.1,0.132,0.267,0.132,0.267,0.132 H0" style="stroke-miterlimit: 10;"/>
                    <path d="m1,0.341 s-0.167,0,-0.267,0.132 c-0.078,0.103,-0.133,0.198,-0.233,0.198 s-0.155,-0.094,-0.233,-0.198 C0.167,0.341,0,0.341,0,0.341 h1" style="stroke-miterlimit: 10;"/> 
                </clipPath>   
            </svg>
            `;
const chromaticScale = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
];

let scales = null;
let tunings = null;
let key = null;
let scaleName = null;
let chords = null;
let chordName = null;
let scaleNotes = null;
let selectedChords = [];
let displayAsIntervals = false;
let neckWidth = neck.offsetWidth;
let guitarStringPosition = getStringPositions();
let bpm = 60;
let metronomeDone = true;

//////////////////////////////////////////////
//              EXECUTE
/////////////////////////////////////////////

noteNodePool.createPool(
    document.querySelectorAll(".fret").length,
    guitarStrings.length,
    function (noteNode) {
        createNewNote(noteNode, true);
    }
);

(function addFretNumbers() {
    const frets = document.querySelectorAll(".fret");

    for (let i = 0; i < frets.length; i++) {
        const numDiv = document.createElement("div");
        numDiv.classList.add("fret-number");
        numDiv.innerHTML = i;
        frets[i].appendChild(numDiv);
    }
})();

addTuner();

fetch("scales.json")
    .then((response) => response.json())
    .then((scalesRetreived) => {
        scaleName = "Major";
        key = "A";
        console.log(scalesRetreived);
        drawStrings();

        let scaleMenu = document.querySelector(".scale-dropdown");
        setMenuLabel("#key-name", `Key: ${key}`);
        setMenuLabel("#scale-name", `Scale: ${scaleName}`);

        scales = [];

        Object.keys(scalesRetreived).forEach((groupName) => {
            let scaleGroupNameDiv = document.createElement("div");
            scaleGroupNameDiv.innerHTML = groupName;
            scaleGroupNameDiv.classList.add("scale-group-name");
            scaleMenu.appendChild(scaleGroupNameDiv);

            let scaleGroupContainerDiv = document.createElement("div");
            scaleGroupContainerDiv.classList.add("scale-group-container");
            scaleMenu.appendChild(scaleGroupContainerDiv);

            let rowDiv = null;
            Object.keys(scalesRetreived[groupName]).forEach((scaleName, i) => {
                const scale = scalesRetreived[groupName][scaleName];
                scales = { ...scales, [scaleName]: scale}
                let scaleNameDiv = document.createElement("div");
                scaleNameDiv.innerHTML = scaleName;
                scaleNameDiv.classList.add("scale-dropdown-item");
                scaleNameDiv.addEventListener("click", function (event) {
                    event.stopPropagation();
                    changeScale(scaleName);
                });

                if (i % 2 === 0) {
                    rowDiv = document.createElement("div");
                    rowDiv.classList.add("scale-dropdown-row");
                }
                rowDiv.appendChild(scaleNameDiv);
                scaleGroupContainerDiv.appendChild(rowDiv);
            });
        });

        changeScale(scaleName);
    });

fetch("chords.json")
    .then((response) => response.json())
    .then((chordsRetreived) => {
        chords = chordsRetreived;
        chordName = "-";
        setMenuLabel("#chord-name", `Chords/Triads: ${chordName}`);

        if (scaleNotes) addNotesToChordMenu(scaleNotes);
    });

fetch("tunings.json")
    .then((response) => response.json())
    .then((tuningsRetreived) => {
        tunings = tuningsRetreived;

        addTuningPresetsToMenu(tunings);
    });

function createPresetDiv(preset) {
    const presetDiv = document.createElement("div");
    presetDiv.classList.add("tuning-presets_preset-text");
    presetDiv.innerHTML = /* html */ `${preset.name}`;
    presetDiv.addEventListener("click", function () {
        // document.querySelectorAll(".tuning-presets_preset-text--disabled").forEach(e => {
        //     e.classList.remove("tuning-presets_preset-text--disabled");
        // })
        // presetDiv.classList.add("tuning-presets_preset-text--disabled");
        changeTuning(preset.strings);
        updateTuningPresets(preset.strings);
    });

    return presetDiv;
}

function addTuningPresetsToMenu(newTunings) {
    tuningFetchedPresets.innerHTML = "";
    presetsDivPool.length = 0;
    newTunings.forEach((tuningPreset) => {
        const element = createPresetDiv(tuningPreset);
        presetsDivPool.push({
            node: element,
            name: tuningPreset.name,
            strings: tuningPreset.strings,
        });
        tuningFetchedPresets.appendChild(element);
    });
}

function changeTuning(newGuitarStrings) {
    const stringDiff = newGuitarStrings.length - guitarStrings.length;
    guitarStrings.length = 0;
    newGuitarStrings.map((newGuitarString) =>
        guitarStrings.push(newGuitarString)
    );
    guitarStrings.reverse();

    if (stringDiff > 0) {
        noteNodePool.increase(0, stringDiff, createNewNote);
    } else if (stringDiff < 0) {
        noteNodePool.shrink(0, Math.abs(stringDiff), (noteNode) =>
            noteNode.node.remove()
        );
    }

    computeFretNotes(scaleNotes);
    drawStrings();
    addTuner();
}

function updateTuningPresets(newGuitarStrings) {
    presetsDivPool.forEach((preset) => {
        if (
            JSON.stringify(preset.strings) === JSON.stringify(newGuitarStrings)
        ) {
            preset.node.classList.add("tuning-presets_preset-text--disabled");
        } else {
            preset.node.classList.remove(
                "tuning-presets_preset-text--disabled"
            );
        }
    });
}

//////////////////////////////////////////////
//          EVENTS
/////////////////////////////////////////////

addEventListener("resize", (event) => {
    if (neckWidth < window.innerWidth) {
        neckWidth = window.innerWidth;
        neck.style.width = neckWidth + "px";
    }
});

document.addEventListener("click", function (event) {
    let close = true;
    menus.forEach((menu) => {
        const dropdown = menu.querySelector(".menu-dropdown");
        if (!dropdown) {
            return;
        }

        if (menu.contains(event.target)) {
            openMenuDropdown(dropdown);
            close = false;
        } else {
            closeDropdown(dropdown);
        }
    });
});

noteNodePool.loadingCallback = function (isLoading) {
    if (isLoading) {
        loadingModal.style.visibility = "visible";
    } else {
        loadingModal.style.visibility = "hidden";
    }
};

bpmSlider.oninput = function () {
    bpmText.innerHTML = this.value;
    bpm = this.value;
};

modalOverlay.addEventListener("click", () => {
    aboutModal.style.visibility = "hidden";
    metronomeModal.style.display = "none";
    tuningModal.style.display = "none";
    modalOverlay.classList.remove("modal-overlay-open");
});

metronomeStartButton.addEventListener("click", () => {
    if (metronomeDone) {
        startMetronome();
        metronomeStartButton.innerHTML = "Stop";
    } else {
        stopMetronome();
        metronomeStartButton.innerHTML = "Start";
    }
});

tuningModalModalOverlay.addEventListener("click", function (event) {
    closeTuningPickNoteModal();
});

function newNoteProps(newNoteDiv) {
    const newNote = {
        node: newNoteDiv,
        text: "",
        active: false,
        chords: [],
        maskedDiv: newNoteDiv.querySelector(".note_masked-note-div"),
        noteTextDiv: newNoteDiv.querySelector(".note_note-text"),
    };

    return newNote;
}

function createNewNote(noteNode, reposition = false) {
    const fretDiv = document.querySelector(".fret" + noteNode.fret);
    const newNoteDiv = noteDivTemplate.cloneNode(true);
    Object.assign(noteNode, newNoteProps(newNoteDiv));

    if (reposition) {
        const guitarStringPositions = getStringPositions();
        noteNode.node.style.top =
            guitarStringPositions[noteNode.guitarString].top + "%";
    }
    fretDiv.appendChild(newNoteDiv);
}

function closeAllDropdowns() {
    var dropdowns = document.querySelectorAll(".menu-dropdown");
    dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove("open");
    });
    chordShapesContainer.innerHTML = "";
}

/////////////////////////////////////////////////
//          EXPORTS
/////////////////////////////////////////////////

export function openAboutModal() {
    aboutModal.style.visibility = "visible";
    modalOverlay.classList.add("modal-overlay-open");
}

export function openMetronomeModal() {
    metronomeModal.style.display = "block";
    modalOverlay.classList.add("modal-overlay-open");
}

export function openTuningModal() {
    tuningModal.style.display = "grid";
    modalOverlay.classList.add("modal-overlay-open");
}

export function asIntervals() {
    if (!displayAsIntervals) {
        document.querySelector("#as-intervals-button").style.display = "none";
        document.querySelector("#as-notes-button").style.display = "block";
        displayAsIntervals = true;
        refreshStringNoteNodes(scaleNotes, 0, guitarStrings.length - 1);
    }
}

export function asNotes() {
    if (displayAsIntervals) {
        document.querySelector("#as-intervals-button").style.display = "block";
        document.querySelector("#as-notes-button").style.display = "none";
        displayAsIntervals = false;
        refreshStringNoteNodes(scaleNotes, 0, guitarStrings.length - 1);
    }
}

export function zoomOutNeck() {
    if (neckWidth - ZOOM_AMOUNT < window.innerWidth) {
        if (neckWidth === window.innerWidth) return;

        neckWidth = window.innerWidth;
        neck.style.width = neckWidth + "px";
        return;
    }

    neckWidth -= ZOOM_AMOUNT;
    neck.style.width = neckWidth + "px";
}

export function addHighString() {
    if (guitarStrings.length > 9) return;

    guitarStrings.unshift(
        chromaticScale[
            (chromaticScale.indexOf(guitarStrings[0]) + 5) %
                chromaticScale.length
        ]
    );
    noteNodePool.increase(0, 1, createNewNote);
    drawStrings();
    addTuner();
    computeFretNotes(scaleNotes);
}

export function removeHighString() {
    if (guitarStrings.length <= 1) return;

    guitarStrings.shift();
    noteNodePool.shrink(0, 1, (noteNode) => noteNode.node.remove());
    drawStrings();
    addTuner();
    computeFretNotes(scaleNotes);
}

export function addLowString() {
    if (guitarStrings.length > 9) return;

    guitarStrings.push(
        chromaticScale[
            (chromaticScale.indexOf(guitarStrings[guitarStrings.length - 1]) -
                5 +
                chromaticScale.length) %
                chromaticScale.length
        ]
    );
    noteNodePool.increase(0, -1, createNewNote);
    drawStrings();
    addTuner();
    computeFretNotes(scaleNotes);
}

export function removeLowString() {
    if (guitarStrings.length <= 1) return;

    guitarStrings.pop();
    noteNodePool.shrink(0, -1, (noteNode) => noteNode.node.remove());
    drawStrings();
    addTuner();
    computeFretNotes(scaleNotes);
}

export function changeKey(chosenKey) {
    key = chosenKey;

    if (scales[scaleName]) {
        scaleNotes = buildScale(key, scales[scaleName]);
        computeFretNotes(scaleNotes);
    }

    closeAllDropdowns();
    setMenuLabel("#key-name", `Key: ${key}`);
    addNotesToChordMenu(scaleNotes);
}

export function zoomInNeck() {
    neckWidth += ZOOM_AMOUNT;
    neck.style.width = neckWidth + "px";
}

function createSound(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0);
    oscillator.start(audioContext.currentTime);
    return { gainNode, oscillator };
}

//////////////////////////////////
//      OTHER METHODS
//////////////////////////////////

function openTuningPickNoteModal(guitarStringIndex, btnElement) {
    tuningModalModalOverlay.style.visibility = "visible";
    tuningPickNoteModal.innerHTML = "";
    tuningPickNoteModal.style.opacity = 0;

    for (
        let currentNoteIndex = 0;
        currentNoteIndex < chromaticScale.length;
        currentNoteIndex++
    ) {
        const chromaticNoteDiv = document.createElement("div");
        chromaticNoteDiv.classList.add(
            "tuning-modal_strings_pick-note-modal_note"
        );
        chromaticNoteDiv.innerHTML = chromaticScale[currentNoteIndex];
        chromaticNoteDiv.addEventListener("click", function (event) {
            const newGuitarStrings = [...guitarStrings];
            newGuitarStrings[guitarStringIndex] =
                chromaticScale[currentNoteIndex];
            newGuitarStrings.reverse();
            changeTuning(newGuitarStrings);
            closeTuningPickNoteModal();
        });

        tuningPickNoteModal.appendChild(chromaticNoteDiv);
    }

    tuningPresetsContainer.style.opacity = 0.2;
    tuningPickNoteModal.style.top =
        btnElement.getBoundingClientRect().top -
        tuningModal.getBoundingClientRect().top +
        btnElement.offsetHeight / 2 +
        "px";
    tuningPickNoteModal.style.visibility = "visible";
    requestAnimationFrame(function () {
        tuningPickNoteModal.style.opacity = 1;
    });
}

function closeTuningPickNoteModal() {
    tuningPickNoteModal.style.visibility = "hidden";
    tuningModalModalOverlay.style.visibility = "hidden";
    tuningPickNoteModal.style.opacity = 0;
    tuningPresetsContainer.style.opacity = 1;
}

function startMetronome() {
    const audioContext = new AudioContext();
    metronomeDone = false;
    let previousTimeStamp;
    let elapsed = 0;
    const { gainNode, oscillator } = createSound(audioContext);

    function playMetronome(timeStamp) {
        if (previousTimeStamp !== undefined) {
            elapsed += timeStamp - previousTimeStamp;
        }
        if (elapsed >= 60000 / bpm) {
            gainNode.gain.setTargetAtTime(1, audioContext.currentTime, 0.015);
            gainNode.gain.setTargetAtTime(
                0,
                audioContext.currentTime + 0.08,
                0.005
            );
            elapsed = elapsed - 60000 / bpm;
        }

        if (metronomeDone) {
            oscillator.stop(audioContext.currentTime);
        }

        previousTimeStamp = timeStamp;

        if (!metronomeDone) requestAnimationFrame(playMetronome);
    }

    playMetronome();
}

function stopMetronome() {
    metronomeDone = true;
}

function closeDropdown(dropdown) {
    dropdown.classList.remove("open");
}

function openMenuDropdown(dropdown) {
    dropdown.classList.add("open");

    if (!dropdown.classList.contains("chord-dropdown"))
        chordShapesContainer.innerHTML = "";
}

function setMenuLabel(id, label) {
    let menuNameSpan = document.querySelector(id);
    menuNameSpan.innerHTML = label;
}

////////////////////////////////////
//SCALE
////////////////////////////////////

function addTuner() {
    setMenuLabel("#tuning-name", "Tuning: " + guitarStrings.join());
    tuningContainer.innerHTML = "";
    const stringPositions = getStringPositions();

    const addStringDiv = document.createElement("div");
    addStringDiv.innerHTML = /* html */ `
        <div class="add-strings">
            <end-note-outlined></end-note-outlined>
            <div class="end-note-string-container">
                <div class="end-note-string end-note-string--secondary"></div>
                <div class="end-note-string_text">
                    add string
                </div>
                <div class="end-note-string end-note-string--secondary"></div>
            </div>
        </div>
    `;
    const addHighStringDiv = addStringDiv.cloneNode(true);
    const addLowStringDiv = addStringDiv.cloneNode(true);

    addHighStringDiv.addEventListener("click", addHighString);
    addLowStringDiv.addEventListener("click", addLowString);

    if (guitarStrings.length < 10)
        tuningContainer.appendChild(addHighStringDiv);

    for (let i = 0; i < guitarStrings.length; i++) {
        const stringContainerDiv = document.createElement("div");
        stringContainerDiv.classList.add("string-container");

        const endNoteElement = document.createElement("end-note");
        const removeButton = document.createElement("div");

        removeButton.innerHTML = /* html */ `
        <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M261-120q-24.75 0-42.375-17.625T201-180v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438v-570ZM367-266h60v-399h-60v399Zm166 0h60v-399h-60v399ZM261-750v570-570Z"/></svg>
        `;

        endNoteElement.setAttribute("text", guitarStrings[i]);
        endNoteElement.setAttribute(
            "thickness",
            stringPositions[i].height + "px"
        );
        endNoteElement.addEventListener("click", function () {
            openTuningPickNoteModal(i, endNoteElement);
        });

        removeButton.classList.add("delete-string");
        removeButton.addEventListener("click", function (event) {
            const newGuitarStrings = [...guitarStrings];
            newGuitarStrings.splice(i, 1);
            newGuitarStrings.reverse();
            changeTuning(newGuitarStrings);
        });

        stringContainerDiv.appendChild(endNoteElement);

        if (guitarStrings.length > 1)
            stringContainerDiv.appendChild(removeButton);

        tuningContainer.appendChild(stringContainerDiv);
    }

    if (guitarStrings.length < 10) tuningContainer.appendChild(addLowStringDiv);
}

function changeScale(chosenScaleName) {
    closeAllDropdowns();
    scaleName = chosenScaleName;
    setMenuLabel("#scale-name", scaleName);

    if (scales[scaleName]) {
        let scaleAsNotes = buildScale(key, scales[scaleName]);
        scaleNotes = scaleAsNotes;

        computeFretNotes(scaleAsNotes);
    }

    if (scaleNotes) addNotesToChordMenu(scaleNotes);
}

function buildScale(rootNote, intervals) {
    let scale = [rootNote];
    let currentIndex = chromaticScale.indexOf(rootNote);

    for (let interval of intervals) {
        currentIndex =
            (currentIndex + Number(interval[0])) % chromaticScale.length;
        scale.push(chromaticScale[currentIndex]);
    }

    return scale;
}

function applyNodeStyle(scale, noteNode, reposition) {
    const currentNoteIndex = chromaticScale.indexOf(
        guitarStrings[noteNode.guitarString]
    );
    const note =
        chromaticScale[
            (currentNoteIndex + noteNode.fret) % chromaticScale.length
        ];
    guitarStringPosition = getStringPositions();

    if (scale.includes(note)) {
        if (reposition) {
            const adjustTop =
                Math.round(
                    (guitarStringPosition[noteNode.guitarString]
                        .heightAsPercentage /
                        2) *
                        10
                ) /
                    10 -
                0.5;
            noteNode.node.style.top =
                guitarStringPosition[noteNode.guitarString].top +
                adjustTop +
                "%";
        }

        noteNode.active = true;
        noteNode.chords = [];
        noteNode.maskedDiv.style.background = "";
        noteNode.node.style.opacity = 1;
        noteNode.text = note;
        noteNode.interval = scale.indexOf(note) + 1;
        noteNode.noteTextDiv.innerHTML = displayAsIntervals
            ? noteNode.interval
            : noteNode.text;
    } else {
        noteNode.active = false;
        noteNode.node.style.opacity = 0;
    }
}

function computeFretNotes(scale) {
    const nodeGenerator = noteNodePool.createBatchedUsedNodesGenerator(
        guitarStrings.length
    );
    function processFrame() {
        const next = nodeGenerator.next();
        if (next.done) {
            return;
        }

        next.value.forEach((currentNoteNode) => {
            applyNodeStyle(scale, currentNoteNode, true);
        });

        requestAnimationFrame(processFrame);
    }

    processFrame();

    selectedChordsContainerDiv.innerHTML = "";
    selectedChords = [];
    setMenuLabel("#chord-name", `Chords/Triads: -`);
}

function refreshStringNoteNodes(scale, guitarStringStart, guitarStringEnd) {
    const nodeGenerator = noteNodePool.createBatchedStringPoolGenerator(
        guitarStringStart,
        guitarStringEnd,
        guitarStrings.length
    );
    function processFrame() {
        const next = nodeGenerator.next();
        if (next.done) {
            selectNewChords();
            return;
        }

        next.value.forEach((currentNoteNode) => {
            applyNodeStyle(scale, currentNoteNode, false);
        });

        requestAnimationFrame(processFrame);
    }

    processFrame();

    function selectNewChords() {
        const flattenedNodesGenerator =
            noteNodePool.createFlattenedPoolGenerator();
        const noteNodes = Array.from(flattenedNodesGenerator).filter(
            (e) => e.active
        );
        selectedChordsContainerDiv.innerHTML = "";
        selectedChords.forEach((chord) => {
            const chordNodes = flagChordNoteNodes(noteNodes, chord);
            addChordToSelectedMenu(chord, chordNodes, chord.color);
        });
    }
}

function drawStrings() {
    const existingStrings = document.querySelectorAll(".string");
    if (existingStrings)
        existingStrings.forEach((e) => {
            e.remove();
        });

    getStringPositions().forEach((guitarStringPosition) => {
        const guitarString = document.createElement("div");
        guitarString.classList.add("string");
        guitarString.style.top = `${guitarStringPosition.top}%`;
        guitarString.style.height = `${guitarStringPosition.height}px`;
        neck.appendChild(guitarString);
    });
}

function getStringPositions() {
    const positions = [];
    const stringPaddingTop = 17;
    const stringPaddingBottom = 20;
    const neckHeight = neck.offsetHeight;
    for (let i = 0; i < guitarStrings.length; i++) {
        const delta =
            ((neckHeight - stringPaddingTop - stringPaddingBottom) /
                ((guitarStrings.length - 1) * neckHeight)) *
            100;
        positions.push({
            top: (stringPaddingTop / neckHeight) * 100 + delta * i,
            height: 0.3 * (i + 1),
            heightAsPercentage: ((0.3 * (i + 1)) / neckHeight) * 100,
        });
    }

    if (guitarStrings.length === 1) positions[0].top = 50;

    return positions;
}

////////////////////////////
//CHORDS
////////////////////////////

const standardColors = [
    "hsl(0, 100%, 50%)", // red
    "hsl(30, 100%, 50%)", // orange
    "hsl(60, 100%, 50%)", // yellow
    "hsl(120, 100%, 50%)", // green
    "hsl(240, 100%, 50%)", // blue
    "hsl(270, 100%, 50%)", // indigo
    "hsl(300, 100%, 50%)", // violet
];

function addNotesToChordMenu(scale) {
    rootNotesContainer.innerHTML = "";
    scale.forEach((note) => {
        let itemDiv = document.createElement("div");
        itemDiv.innerHTML = note;

        if (selectedChords.length >= MAX_SELECTED_CHORDS) {
            itemDiv.classList.add("disablehover");
            itemDiv.style.opacity = 0.4;
        } else {
            itemDiv.addEventListener("click", () =>
                addShapesToMenu(note, scale)
            );
        }

        rootNotesContainer.appendChild(itemDiv);
    });
}

function addShapesToMenu(note, scale) {
    chordShapesContainer.innerHTML = "";
    findChords(note, scale).forEach((chord) => {
        let shapeDiv = document.createElement("div");
        shapeDiv.innerHTML = chord.chordType;

        if (selectedChords.some((e) => note + chord.chordType == e.name)) {
            shapeDiv.classList.add("disablehover");
            shapeDiv.style.opacity = 0.4;
        } else {
            shapeDiv.addEventListener("click", () => selectChord(chord));
        }

        chordShapesContainer.appendChild(shapeDiv);
    });
}

function selectChord(chord, addToList = true) {
    const nodeGenerator = noteNodePool.createFlattenedPoolGenerator();
    const chordNodes = flagChordNoteNodes(
        Array.from(nodeGenerator).filter((e) => e.active),
        chord
    );
    chordShapesContainer.innerHTML = "";

    if (addToList) {
        selectedChords.push({
            name: chord.chordNotes[0] + chord.chordType,
            chordNotes: chord.chordNotes,
            chordType: chord.chordType,
            rootNote: chord.chordNotes[0],
            nodes: chordNodes,
        });
    }
    addChordToSelectedMenu(chord, chordNodes);
    let chordNames = selectedChords.map((e) => e.name).join(", ");
    if (selectedChords.length > 2) {
        chordNames =
            "... " +
            selectedChords
                .slice(selectedChords.length - 2)
                .map((e) => e.name)
                .join(", ");
    }
    setMenuLabel("#chord-name", `Chords/Triads: ${chordNames}`);
    addNotesToChordMenu(scaleNotes);
}

function addChordToSelectedMenu(chord, chordNodes, color) {
    const selectedChordDiv = document.createElement("selected-chord");
    selectedChordDiv.innerHTML = chord.chordNotes[0] + chord.chordType;

    selectedChordDiv.addEventListener("oncolorchange", function (event) {
        const previousChord = selectedChords.find(
            (e) => e.name === chord.chordNotes[0] + chord.chordType
        );
        previousChord.color = event.detail;

        const colorArray = generateColorArray(
            event.detail,
            chord.chordNotes.length
        );
        for (let i = 0; i < chordNodes.length; i++) {
            changeNoteNodesColor(chordNodes[i], colorArray[i], chord);
        }
    });

    selectedChordDiv.addEventListener("delete", function (event) {
        const nodeGenerator = noteNodePool.createFlattenedPoolGenerator();
        selectedChordDiv.remove();
        for (let i = 0; i < chordNodes.length; i++) {
            removeNoteNodesColor(chordNodes[i], chord);
        }
        unFlagChordNoteNodes(Array.from(nodeGenerator.next().value), chord);
        selectedChords = selectedChords.filter(
            (e) => e.name != chord.chordNotes[0] + chord.chordType
        );
        let chordNames = selectedChords.map((e) => e.name).join(", ");
        if (selectedChords.length > 2) {
            chordNames =
                "... " +
                selectedChords
                    .slice(selectedChords.length - 2)
                    .map((e) => e.name)
                    .join(", ");
        }
        setMenuLabel("#chord-name", `Chords/Triads: ${chordNames}`);
        addNotesToChordMenu(scaleNotes);
    });

    if (color) {
        selectedChordDiv.setAttribute("chord-color", color);
    } else {
        selectedChordDiv.setAttribute(
            "chord-color",
            standardColors[selectedChords.length]
        );
    }

    selectedChordsContainerDiv.appendChild(selectedChordDiv);
}

function findChords(rootNote, scale) {
    let availableChords = [];

    for (let chordType in chords) {
        let chord = chords[chordType];
        let chordNotes = [];
        let currentIndex = chromaticScale.indexOf(rootNote);

        for (let interval of chord.Intervals) {
            let noteIndex = (currentIndex + interval) % chromaticScale.length;
            chordNotes.push(chromaticScale[noteIndex]);
        }

        if (chordNotes.every((note) => scale.includes(note))) {
            availableChords.push({ rootNote, chordType, chordNotes });
        }
    }

    return availableChords;
}

function flagChordNoteNodes(noteNodes, chord) {
    let chordNoteNodes = [];
    for (
        let chordNoteIndex = 0;
        chordNoteIndex < chord.chordNotes.length;
        chordNoteIndex++
    ) {
        chordNoteNodes.push([]);

        noteNodes.forEach((noteNode) => {
            if (chord.chordNotes[chordNoteIndex] === noteNode.text) {
                chordNoteNodes[chordNoteIndex].push(noteNode);

                const chordName = chord.rootNote + chord.chordType;

                if (
                    !noteNode.chords.map((e) => e.chordName).includes(chordName)
                )
                    noteNode.chords.push({ chordName: chordName });
            }
        });
    }

    return chordNoteNodes;
}

function unFlagChordNoteNodes(noteNodes, chord) {
    const chordName = chord.rootNote + chord.chordType;
    noteNodes.forEach((noteNode) => {
        if (noteNode.chords.includes(chordName)) {
            noteNode.chords = noteNode.chords.filter(
                (e) => e.chordName !== chordName
            );
        }
    });
}

function removeNoteNodesColor(noteNodes, chord) {
    noteNodes.forEach((note) => {
        const chordName = chord.rootNote + chord.chordType;
        const noteMaskedDiv = note.node.querySelector(".note_masked-note-div");

        note.chords
            .filter((e) => e.chordName === chordName)
            .forEach((e) => {
                e.color = null;

                if (note.chords.length <= 1)
                    noteMaskedDiv.style.background = "";
            });

        note.chords = note.chords.filter((e) => e.chordName !== chordName);

        let gradient = note.chords
            .map((e) => e.color)
            .map((color, index, array) => {
                return `${color} ${(index / array.length) * 100}% ${
                    ((index + 1) / array.length) * 100
                }%`;
            })
            .join(",");
        noteMaskedDiv.style.background = `linear-gradient(to right, ${gradient})`;
    });
}

function changeNoteNodesColor(noteNodes, color, chord) {
    noteNodes.forEach((noteNode) => {
        const chordName = chord.rootNote + chord.chordType;
        const noteMaskedDiv = noteNode.node.querySelector(
            ".note_masked-note-div"
        );

        noteNode.chords
            .filter((e) => e.chordName === chordName)
            .forEach((e) => {
                e.color = color;
            });

        let gradient = noteNode.chords
            .map((e) => e.color)
            .map((color, index, array) => {
                return `${color} ${(index / array.length) * 100}% ${
                    ((index + 1) / array.length) * 100
                }%`;
            })
            .join(",");
        noteMaskedDiv.style.background = `linear-gradient(to right, ${gradient})`;
    });
}

function generateColorArray(hslColor, numColors) {
    const hsl = hslColor.match(/(\d+(\.\d+)?)/g).map(Number);
    const hue = hsl[0];
    const saturation = hsl[1];
    const lightness = hsl[2];

    if (numColors === 0) {
        return [hslColor];
    }

    const deltaLightness = 50 / numColors;

    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const newLightness = deltaLightness + i * deltaLightness;
        colors.push(`hsl(${hue}, ${saturation}%, ${newLightness.toFixed(2)}%)`);
    }

    return colors;
}
