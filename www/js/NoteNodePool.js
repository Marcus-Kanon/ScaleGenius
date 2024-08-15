const MAX_STRINGS = 10;
export default class NoteNodePool {
    constructor() {
        this.pool = [];
        this.frets = 0;
        this.bounds = {x: 0, y: 0};
        this.loadingCallback = null;
    }

    invokeLoadingCallback(isLoading) {
        if(this.loadingCallback !== null)
            this.loadingCallback(isLoading);
    }
    
    createPool(x, y, nodeCallback) {
        var self = this;
        this.invokeLoadingCallback(true);
        this.bounds.x = x;
        this.bounds.y = y;
        

        for (let i = 0; i < y; i++) {
            self.pool.push([]);
        }

        let currentFret = 0;
        function processFrame() {
            if (currentFret >= x) {
                return;
            }

            for (let currentGuitarString = 0; currentGuitarString < y; currentGuitarString++) {
                self.pool[currentGuitarString].push({
                    guitarString: currentGuitarString,
                    fret: currentFret
                });
                nodeCallback(self.pool[currentGuitarString][currentFret])
            }

            currentFret++;
            requestAnimationFrame(processFrame);
        }

        processFrame();

        this.invokeLoadingCallback(false);
    }

    /**
        Expands the pool
        @param {Number} x The number of frets to add to the pool. A negative value adds to the start of the pool.
        @param {Number} y The number of guitar strings to add to the pool. A negative value adds to the start of the pool.
        @param {function} callback A callback function that is called for each new node that is added to the pool. The callback function takes one argument, which is the new node.
     */
    increase(x, y, callback) {
        this.invokeLoadingCallback(true);

        const OldPoolXLength = this.pool[0].length;
        const addedNodes = [];

        if(y > 0) {
            for (let i = 0; i < y; i++) {
                this.pool.push([]);  
            }
        }

        if(y < 0) {
            for (let i = 0; i < Math.abs(y); i++) {
                this.pool.unshift([]);  
            }
        }

        if(x >= 0) {
            for (let currentY = 0; currentY < this.pool.length; currentY++) {
                const currentYstartXLength = this.pool[currentY].length;
                for (let addToX = 0; addToX < OldPoolXLength - currentYstartXLength + x; addToX++) {
                    this.pool[currentY].push({
                         fret: OldPoolXLength - this.pool[currentY].length + x - 1,
                         guitarString: currentY
                    });
                    addedNodes.push(this.pool[currentY][this.pool[currentY].length-1])
                }
            }
        }

        if(x < 0) {
            for (let currentY = 0; currentY < this.pool.length; currentY++) {
                for (let addToX = 0; addToX < OldPoolXLength - this.pool[currentY].length + Math.abs(x); addToX++) {
                    this.pool[currentY].unshift({});
                    addedNodes.push(this.pool[currentY][0])
                }
            }

            for (let currentY = 0; currentY < this.pool.length; currentY++) {
                for (let currentX = 0; currentX < this.pool[currentY].length; currentX++) {
                    const currentNodeNode = this.pool[currentY][currentX];
                    currentNodeNode.fret = currentX;
                    currentNodeNode.guitarString = currentY;
                }
            }
        }

        addedNodes.forEach(noteNode => callback(noteNode))

        this.invokeLoadingCallback(false);
    }

    shrink(x, y, callback) {
        this.invokeLoadingCallback(true);

        let removedNodes = [];
        if(y > 0) {
            for (let i = 0; i < y; i++) {
                removedNodes.push(
                    this.pool.pop()
                );
            }
        }

        if(y < 0) {
            for (let i = 0; i < Math.abs(y); i++) {
                removedNodes.push(
                    this.pool.shift()
                );
            }
        }

        removedNodes = removedNodes.flat();

        if(x > 0) {
            for (let currentY = 0; currentY < this.pool[currentY].length; currentY++) {
                for (let i = 0; i < x; i++) {
                    removedNodes.push(
                        this.pool[currentY].pop()
                    );
                }
            }
        }

        if(x < 0) {
            for (let currentY = 0; currentY < this.pool[currentY].length; currentY++) {
                for (let i = 0; i < Math.abs(x); i++) {
                    removedNodes.push(
                        this.pool[currentY].shift()
                    );
                }
            }
        }

        this.recalculateIndexes();

        removedNodes.forEach(noteNode => callback(noteNode));

        this.invokeLoadingCallback(false);
    }

    recalculateIndexes() {
        for (let currentY = 0; currentY < this.pool.length; currentY++) {
            for (let currentX = 0; currentX < this.pool[currentY].length; currentX++) {
                const currentNodeNode = this.pool[currentY][currentX];
                currentNodeNode.fret = currentX;
                currentNodeNode.guitarString = currentY;
            }
        }
    }

    *createUsedNodesGenerator() {
        const stringLowerLimit = Math.floor((MAX_STRINGS-this.bounds.y)/2);
        for (let fretIndex = 0; fretIndex < this.pool[0].length; fretIndex++) {
            for (let guitarStringIndex = stringLowerLimit; guitarStringIndex < (this.pool.length - stringLowerLimit); guitarStringIndex++) {
                this.pool[guitarStringIndex][fretIndex].guitarString = guitarStringIndex - stringLowerLimit;
                this.pool[guitarStringIndex][fretIndex].fret = fretIndex;
                yield this.pool[guitarStringIndex][fretIndex];
            }  
        }
    }

    *createBatchedUsedNodesGenerator() {
        const stringLowerLimit = 0;
        for (let fretIndex = 0; fretIndex < this.pool[0].length; fretIndex++) {
            const batch = [];
            for (let guitarStringIndex = stringLowerLimit; guitarStringIndex < (this.pool.length - stringLowerLimit); guitarStringIndex++) {
                this.pool[guitarStringIndex][fretIndex].guitarString = guitarStringIndex - stringLowerLimit;
                this.pool[guitarStringIndex][fretIndex].fret = fretIndex;
                batch.push(this.pool[guitarStringIndex][fretIndex]);
            } 
            yield batch;
        }
    }

    *createBatchedStringPoolGenerator(guitarStringIndexStart, guitarStringIndexEnd) {
        const stringLowerLimit = 0;
        for (let guitarStringIndex = stringLowerLimit + guitarStringIndexStart;
            (guitarStringIndex <= (guitarStringIndexEnd + stringLowerLimit));
            guitarStringIndex++) {
            
            yield this.pool[guitarStringIndex];
        }
    }

    *createFlattenedPoolGenerator() {
        const flattenedPool = this.pool.flat();
        for (let i = 0; i < flattenedPool.length; i++) {
            yield flattenedPool[i];
        }
    }
}