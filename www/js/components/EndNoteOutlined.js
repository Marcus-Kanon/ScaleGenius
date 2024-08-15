const template = document.createElement("template");
template.innerHTML = /* html */ `
    <div class="end-note">
        <div class="end-note_note-text"></div>
        
        <svg id="b" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92.63 43">
        <defs>
            <style>
            .c {
                fill: var(--bg);
                stroke: currentColor;
                stroke-width: 2px;
                stroke-miterlimit: 10;
            }
            </style>
        </defs>
        <path class="c" d="m87.12,21.19c-43.21,0-61.28,16.25-64.9,20.04-.48.5-1.17.73-1.85.62-4.39-.74-19.87-4.48-19.87-20.66S15.98,1.27,20.37.53c.69-.12,1.37.12,1.85.62,3.62,3.78,21.69,20.04,64.9,20.04Z"/>
        <line class="c" x1="11.32" y1="21.19" x2="25.53" y2="21.19"/>
        <line class="c" x1="18.43" y1="28.29" x2="18.43" y2="14.08"/>     
        </svg>
    </div>
`;

export default class extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("link");

        style.setAttribute("rel", "stylesheet");
        style.setAttribute("href", "js/components/EndNoteOutlined.css");

        shadow.appendChild(style);
        shadow.appendChild(template.content.cloneNode(true));

        this.textDiv = shadow.querySelector(".end-note_note-text");
        this.container = shadow.querySelector(".end-note");
    }

    connectedCallback() {
        this.container.style.opacity = 1;
    }

    static get observedAttributes() { 
        return ['text']; 
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "text") {
            this.setText(newValue);
        }
    }

    setText(newText) {
        this.textDiv.innerHTML = newText;
    }
}
    
