const template = document.createElement("template");
template.innerHTML = `
    <div class="added-chord">
        <div class="chord-label"> <span><slot></slot></span> 
        </div>
        <div class="selected-color">
        </div>
        <div class="color-picker-container">
            <div class="select-color">
            </div>
        </div>
        <div class="delete-chord">
            <svg fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="M261-120q-24.75 0-42.375-17.625T201-180v-570h-41v-60h188v-30h264v30h188v60h-41v570q0 24-18 42t-42 18H261Zm438-630H261v570h438v-570ZM367-266h60v-399h-60v399Zm166 0h60v-399h-60v399ZM261-750v570-570Z"/></svg>
        </div>
    </div>
`;


export default class extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("link");

        style.setAttribute("rel", "stylesheet");
        style.setAttribute("href", "js/components/SelectedChord.css");

        shadow.appendChild(style);
        shadow.appendChild(template.content.cloneNode(true));

        this.colorDiv = shadow.querySelector(".selected-color");
        this.container = shadow.querySelector('.color-picker-container');
        this.selectColor = shadow.querySelector('.select-color');
        this.containerWidth = 150;
        this.draggableWidth = 30;
        this.xPosition = 0;
        this.currentColor = null;
        this.setColor({red: 0, green: 255, blue: 255});

        this.deleteButton = shadow.querySelector(".delete-chord");
    }

    setColor(rgb) {
        let hsl = this.#convertRGBToHSL(rgb);
        let nValue = hsl.hue/360;
        const rgbString = `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
        this.selectColor.style.borderColor = rgbString;
        this.currentColor = rgb;
        this.selectColor.style.left = (nValue)*(this.containerWidth+this.draggableWidth/2) + 'px';
        this.changeColor(rgbString);

        this.dispatchEvent(new CustomEvent("oncolorchange", {
            detail: `hsl(${hsl.hue}%, ${hsl.saturation}, ${hsl.lightness})`,
            bubbles: true,
            cancelable: false,
            composed: true
        }));
    }

    #convertToHsl = function(spectrumValue) {
        const hue = spectrumValue * 360;
        const saturation = 100;
        const lightness = 50;

        return {
            hue,
            saturation,
            lightness,
        };
    }

    #convertHSLToRGB = function(hslColor) {
        const hue = hslColor.hue / 360;
        const saturation = hslColor.saturation / 100;
        const lightness = hslColor.lightness / 100;

        const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;

        const hueAngle = hue * 2 * Math.PI;

        const red = lightness + chroma * Math.cos(hueAngle);
        const green = lightness + chroma * Math.cos(hueAngle - (2 * Math.PI / 3));
        const blue = lightness + chroma * Math.cos(hueAngle + (2 * Math.PI / 3));

        return {
            red: Math.round(red * 255),
            green: Math.round(green * 255),
            blue: Math.round(blue * 255),
        };
    }

    #convertRGBToHSL(rgbColor) {
        const red = rgbColor.red / 255;
        const green = rgbColor.green / 255;
        const blue = rgbColor.blue / 255;

        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);

        let hue;
        if (max === min) {
            hue = 0;
        } else if (max === red) {
            hue = (60 * (green - blue)) / (max - min);
        } else if (max === green) {
            hue = (120 + 60 * (blue - red)) / (max - min);
        } else if (max === blue) {
            hue = (240 + 60 * (red - green)) / (max - min);
        }

        const saturation = (max - min) / max;

        const lightness = (max + min) / 2;

        return {
            hue,
            saturation: saturation * 100,
            lightness: lightness * 100,
        };
    }

    #getMousePosition = (e) => {
        if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
            var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
            var touch = evt.touches[0] || evt.changedTouches[0];
            return touch.pageX;
        } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
            return e.clientX;
        }
    }

    changeColor(color) {
        this.colorDiv.style.backgroundColor = color;
    }

    static get observedAttributes() { 
        return ['chord-color']; 
    }

    connectedCallback() {

        const self = this;

        this.colorDiv.addEventListener("click", function(e) {
            self.container.style.visibility = "visible";
        });

        this.handleMouseDown = function(e) {
            let mouseX = self.#getMousePosition(e);
            let adj = (self.container.getBoundingClientRect().left) + self.draggableWidth/2;
            if(e.target === self.selectColor) {
                adj = mouseX - self.selectColor.offsetLeft;
            }

            self.selectColor.classList.add("active");

            self.handleMouseMove(mouseX, adj)
            const handleMoveAction = (e) => {
                self.handleMouseMove(self.#getMousePosition(e), adj);
                e.stopPropagation();
            }

            self.container.addEventListener('mousemove', handleMoveAction);
            self.container.addEventListener('touchmove', handleMoveAction);
    
            self.container.addEventListener('mouseup', function(e) {
                e.stopPropagation();
                self.container.removeEventListener('mousemove', handleMoveAction);
                self.selectColor.classList.remove("active");
                self.container.style.visibility = "hidden";
            });

            self.container.addEventListener('touchend', function(e) {
                e.stopPropagation();
                self.container.removeEventListener('touchmove', handleMoveAction);
                self.selectColor.classList.remove("active");
                self.container.style.visibility = "hidden";
            });

            e.stopPropagation();
        }

        this.handleMouseMove = function(clientX, adj) {
            const newX = clientX - adj;
            let xPosition = newX;
            
            if(newX > self.containerWidth - self.draggableWidth)
                xPosition = self.containerWidth - self.draggableWidth;

            if(newX < 0)
                xPosition = 0;

            self.selectColor.style.left = xPosition + 'px';
            let normalizedPosition = (xPosition)/(self.containerWidth+self.draggableWidth/2);
            let hsl = self.#convertToHsl(normalizedPosition);
            const hslString = `hsl(${hsl.hue} ${hsl.saturation}% ${hsl.lightness}%)`;

            self.currentColor = hslString;
            self.selectColor.style.borderColor = hslString;
            self.colorDiv.style.background = hslString;
            this.dispatchEvent(new CustomEvent("oncolorchange", {
                detail: hslString,
                bubbles: true,
                cancelable: false,
                composed: true
            }));
        }

        this.container.addEventListener("mousedown", this.handleMouseDown);
        this.container.addEventListener("touchstart", this.handleMouseDown);

        this.deleteButton.addEventListener("click", function () {
            this.dispatchEvent(new CustomEvent("delete", {
                bubbles: true,
                cancelable: false,
                composed: true
                }));
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "chord-color") {
            let chordColor = newValue;
            if(chordColor.hue === undefined) {
                const hsl = chordColor.match(/(\d+(\.\d+)?)/g).map(Number);
                chordColor = {};

                chordColor.hue = hsl[0];
                chordColor.saturation = hsl[1];
                chordColor.lightness = hsl[2];
            }

            this.setColor(this.#convertHSLToRGB(chordColor), true);
            this.dispatchEvent(new CustomEvent("oncolorchange", {
                detail: `hsl(${chordColor.hue} ${chordColor.saturation}% ${chordColor.lightness}%)`,
                bubbles: true,
                cancelable: false,
                composed: true
                }));
        }
    }
}
    
