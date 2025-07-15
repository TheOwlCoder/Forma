// Forma.js
// Inspired by morphic.js
const forma = {
    "version": "Pre-release Jul 11 25",
    "step": 0
}

class Color {
    constructor(r, g, b, a) {
        this.r = r || 0
        this.g = g || 0
        this.b = b || 0
        this.a = a || ((a == 0) ? 0 : 1)
    }
    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
    }
}

class Rectangle {
    constructor(left, top, right, bottom) {
        this.init(new Point(left, top), new Point(right, bottom));
    }
    init(topLeft, bottomRight) {
        this.topLeft = topLeft
        this.bottomRight = bottomRight
    }
    left() {
        return this.topLeft.x
    }
    top() {
        return this.topLeft.y
    }
    bottom() {
        return this.bottomRight.y
    }
    right() {
        return this.bottomRight.x
    }
    setWidth(width) {
        this.topLeft.x = this.topLeft.x + width;
    }
    setHeight(height) {
        this.bottomRight.y = this.topLeft.y + height;
    }
    width() {
        return this.bottomRight.x - this.topLeft.x
    }
    height() {
        return this.bottomRight.y - this.topLeft.y
    }
    setPosition(point) {
        const oldWidth = this.width()
        const oldHeight = this.height()
        this.topLeft = point;
        this.bottomRight = new Point(point.x + oldWidth, point.y + oldHeight)
    }
}
JSON.clone = function (object) { return JSON.parse(JSON.stringify(object)); }

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function shadowify(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3];
        // console.log(alpha)
        if (alpha > 0) {
            pixels[i] = 0;
            pixels[i+1] = 0;
            pixels[i+2] = 0;
            pixels[i+3] = Math.max(pixels[i+3] - 225, 0)
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}


var Form;
var __CursorForm;
var WorldForm;
var TextForm;

Form.prototype.constructor = Form;
__CursorForm.prototype.constructor = __CursorForm;
WorldForm.prototype.constructor = WorldForm;
TextForm.prototype.constructor = TextForm;

// Form — The base form all other types of forms will be based off of
function Form() {
    this.initVars();
}
Form.prototype.initVars = function () {
    this.color = new Color(255, 0, 0)
    this.children = [];
    this.parent = null;
    this.bounds = new Rectangle(0, 0, 50, 50)
    this.draggable = true;
    this.clickable = true;
    this.__oldDragPos = null;
    this.__lastClicked = false;
    this.__initMousePos = null;
    this.__isBeingDragged = false;
    this.enabledShadows = true
    this.leftClickEvents = []
    this.rightClickEvents = []
    this.middleClickEvents = []
    this.dragEvents = []
}
Form.prototype.append = function (child) {
    if (child.parent) child.parent.disownChild(child)
    this.children.push(child)
    child.parent = this
}
Form.prototype.drawFunc = function (ctx) {
    oldFS = ctx.fillStyle;
    if (this.color) ctx.fillStyle = this.color.toString()
    ctx.fillRect(0, 0, this.bounds.width(), this.bounds.height());
    ctx.fillStyle = oldFS
}
Form.prototype.image = function (popout) {
    const bounds = [this.bounds.width(), this.bounds.height()]
    img = document.createElement("canvas");
    img.width = bounds[0];
    img.height = bounds[1];
    ctx = img.getContext('2d');
    this.drawFunc(ctx);
    if (!popout) return img;
    const tab = window.open('');
    tab.document.write(`<body></body>`)
    tab.document.body.appendChild(img)
};
Form.prototype.step = function (ctx) {
    ctx.save()
    ctx.translate(this.bounds.topLeft.x, this.bounds.topLeft.y)
    if (this.__isBeingDragged && this.enabledShadows) { ctx.drawImage(shadowify(this.image()), 10, 10); }
    if (this.drawFunc) this.drawFunc(ctx);
    ctx.restore()
    this.children.forEach(child => {
        child.step(ctx)
    });

    if (this.clickable && (this.isTouching(cursorForm) || this.__isBeingDragged) && cursorForm.mouseLeftDown) {
        if (this.__oldDragOffset === null) {
            this.__oldDragOffset = new Point(
                cursorForm.bounds.topLeft.x - this.bounds.topLeft.x,
                cursorForm.bounds.topLeft.y - this.bounds.topLeft.y
            );
            this.__initMousePos = new Point(cursorForm.bounds.topLeft.x, cursorForm.bounds.topLeft.y);
        }

        if (!this.__lastClicked) {
            this.leftClickEvents.forEach(e => { e() });
            this.__lastClicked = true;
        }

        if (this.draggable && (currentlyDraggedForm == this || currentlyDraggedForm == null)) {
            let newpos = new Point(
                cursorForm.bounds.topLeft.x - this.__oldDragOffset.x,
                cursorForm.bounds.topLeft.y - this.__oldDragOffset.y
            );
            currentlyDraggedForm = this
            const movementThreshold = 1;
            const hasMoved = Math.abs(cursorForm.bounds.topLeft.x - this.__initMousePos.x) > movementThreshold ||
                Math.abs(cursorForm.bounds.topLeft.y - this.__initMousePos.y) > movementThreshold;

            if (hasMoved) {
                this.bounds.setPosition(newpos);
                this.dragEvents.forEach(e => e());
                this.__isBeingDragged = true;
            }
        }
    } else {
        this.__oldDragOffset = null;
        this.__lastClicked = false;
        this.__initMousePos = null;
        this.__isBeingDragged = false;
        if (currentlyDraggedForm == this) currentlyDraggedForm = null;
    }
}
Form.prototype.isTouching = function (form) {
    const thisBounds = this.bounds;
    const otherBounds = form.bounds;
    const horizontalOverlap = thisBounds.topLeft.x < otherBounds.bottomRight.x && thisBounds.bottomRight.x > otherBounds.topLeft.x;
    const verticalOverlap = thisBounds.topLeft.y < otherBounds.bottomRight.y && thisBounds.bottomRight.y > otherBounds.topLeft.y;
    return horizontalOverlap && verticalOverlap;
};


// CursorForm — Handles cursor events, should typically only be one per world
__CursorForm.prototype = Object.create(Form.prototype)
function __CursorForm() {
    this.init()
}
__CursorForm.prototype.init = function () {
    this.mouseLeftDown = false;
    this.mouseMiddleDown = false;
    this.mouseRightDown = false;
    this.bounds = new Rectangle(0, 0, 10, 10);
    this.children = [];
    this.draggable = false;
    this.clickable = false;
    document.addEventListener('mousemove', (event) => {
        this.bounds.setPosition(new Point(event.clientX, event.clientY));
    });
    document.addEventListener('mousedown', (event) => {
        if (event.button === 0) {
            this.mouseLeftDown = true;
        } else if (event.button === 1) {
            this.mouseMiddleDown = true;
        } else if (event.button === 2) {
            this.mouseRightDown = true;
        }
    });
    document.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            this.mouseLeftDown = false;
        } else if (event.button === 1) {
            this.mouseMiddleDown = false;
        } else if (event.button === 2) {
            this.mouseRightDown = false;
        }
    });
};
// __CursorForm.drawFunc = {} // Prevents CursorForm from drawing the default form

// WorldForm — The actual canvas form
WorldForm.prototype = Object.create(Form.prototype)
function WorldForm(ctx) {
    this.init(ctx);
}
WorldForm.prototype.init = function (ctx) {
    this.canvas = ctx;
    this.ctx = ctx.getContext('2d');
    this.color = new Color(210, 210, 210)
    this.children = []
    this.bounds = new Rectangle(0, 0, ctx.width, ctx.height)
    this.fullScreen = true;
    currentlyDraggedForm = null;
    cursorForm = new __CursorForm();
    this.append(cursorForm)
    ctx.addEventListener("contextmenu", e => { e.preventDefault() })
}
WorldForm.prototype.step = function () {
    if (this.fullScreen) {
        this.canvas.style = "position: absolute; top: 0; left: 0;"
        this.canvas.width = document.documentElement.clientWidth;
        this.canvas.height = document.documentElement.clientHeight;
    }
    this.bounds = new Rectangle(0, 0, this.canvas.width, this.canvas.height)
    this.canvas.style.background = this.color.toString()
    forma.step++;
    this.children.forEach(child => {
        child.step(this.ctx)
    });
}

// TextForm — Text form
TextForm.prototype = Object.create(Form.prototype)
function TextForm(text, color, size, font) {
    this.initVars();
    this.init(text, color, size, font);
}
TextForm.prototype.init = function(text, color, size, font) {
    this.text = text || "aaaa"
    this.color = color || "black"
    this.size = size || 20
    this.font = font || "sans-serif"
    this.draggable = true;
    this.enabledShadows = true;
    const ctx = document.createElement("canvas").getContext("2d")
    ctx.font = `${this.size}px ${this.font}`
    this.bounds = new Rectangle(0, 0, ctx.measureText(this.text)["width"], this.size)
}
TextForm.prototype.drawFunc = function(ctx) {
    ctx.font = `${this.size}px ${this.font}`
    ctx.fillStyle = `${this.color.toString()}`
    ctx.fillText(this.text, 0, this.size)
}