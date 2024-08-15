const template = document.createElement("template");
template.innerHTML = /* html */`
    <div class="selected-color">
    </div>
    <div class="color-picker-container">
        <div class="select-color">
        </div>
    </div>
`;


export default class extends HTMLElement {
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("link");

        style.setAttribute("rel", "stylesheet");
        style.setAttribute("href", "js/components/ColorPicker.css");

        shadow.appendChild(style);
        shadow.appendChild(template.content.cloneNode(true));

        this.colorDiv = shadow.querySelector(".selected-color");
        this.container = shadow.querySelector('.color-picker-container');
        this.selectColor = shadow.querySelector('.select-color');
        this.containerWidth = this.container.offsetWidth;
        this.draggableWidth = 30;
        this.xPosition = 0;
        this.currentColor = null;
        this.setColor({red: 0, green: 255, blue: 255});
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
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "chord-color") {
            this.setColor(newValue, true);
            this.dispatchEvent(new CustomEvent("oncolorchange", {
                detail: newValue,
                bubbles: true,
                cancelable: false,
                composed: true
                }));
        }
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
}
    
