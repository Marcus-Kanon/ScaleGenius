const template = document.createElement("template");
template.innerHTML = /* html */ `
    <div class="end-note-container">
        <div class="end-note">
            <div class="end-note_note-text"></div>

            <svg id="b" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 92.13 41.37">
                <defs>
                    <style>
                    .c {
                        stroke-width: 0px;
                        fill: currentColor;
                    }
                    </style>
                </defs>
                <path class="c" d="m86.62,20.69c-43.21,0-61.28,16.25-64.9,20.04-.48.5-1.17.73-1.85.62-4.39-.74-19.87-4.48-19.87-20.66S15.48.77,19.87.03c.69-.12,1.37.12,1.85.62,3.62,3.78,21.69,20.04,64.9,20.04Z"/>
            </svg>
        </div>
        <div class="end-note-string-container">
            <div class="end-note-string">
            </div>
        </div>
    </div>
`;

export default class extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("link");

        style.setAttribute("rel", "stylesheet");
        style.setAttribute("href", "js/components/EndNote.css");

        shadow.appendChild(style);
        shadow.appendChild(template.content.cloneNode(true));

        this.textDiv = shadow.querySelector(".end-note_note-text");
        this.string = shadow.querySelector(".end-note-string");
        this.container = shadow.querySelector(".end-note-container");
    }

    connectedCallback() {
        this.container.style.opacity = 0;
    }

    static get observedAttributes() { 
        return ['text', 'thickness']; 
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "text") {
            this.setText(newValue);
        }
        if(name === "thickness") {
            this.setThickness(newValue);
        }
    }

    setText(newText) {
        this.textDiv.innerHTML = newText;
    }

    setThickness(newThickness) {
        this.string.style.height = newThickness;
    }
}
    
