/**@type {HTMLCanvasElement} */
const canvas = document.getElementById("circuit"),
    ctx = canvas.getContext("2d"),
    buttons = document.getElementsByClassName("buttons"),
    buttonUndo = document.getElementById("undo"),
    buttonRedo = document.getElementById("redo");

const initState = new CircuitState(),
    emptyState = new CircuitState();

/**鼠标在画布上的状态常量 */
const stateConfig = {
    /**闲置 */
    IDLE: 0,
    /**点击 */
    CLICKING: 1,
    /**拖拽 */
    DRAGGING: 2,
};

var buttonFlag = false, // 按下按钮的标志
    buttonPressed = "", // 按下按钮的id
    shiftFlag = false, // 按下键盘shift键的标志
    altFlag = false,
    ctrlFlag = false,
    calculateFlag = false; // 按下开始实验按钮的标志

var newElement = new BlankElement(),
    fakeElement = new BlankElement(),
    newWire = new BlankElement(),
    fakeWire = new BlankElement();
// newConnector = new BlankElement(),
// fakeConnector = new BlankElement();

var fakeElementAngle = 0;

/**画布相关信息 */
var canvasInfo = {
    /**鼠标在画布中的状态 */
    state: stateConfig.IDLE,
    /**鼠标位置 */
    position: { x: null, y: null },
    /**鼠标指针目标，-1表示无目标 */
    target: {
        NoElement: -1,
        NoConnector: -1,
        NoWire: -1,
        NoWireConnector: -1,
        clear() {
            this.NoElement = -1;
            this.NoConnector = -1;
            this.NoWire = -1;
            this.NoWireConnector = -1;
        },
    },
    /**鼠标拖拽目标，-1表示无目标 */
    draggingTarget: {
        NoElement: -1,
        NoConnector: -1,
        NoWire: -1,
        NoWireConnector: -1,
        /**鼠标与目标元件中心之间的偏移 */
        offset: { x: null, y: null },
        clear() {
            this.NoElement = -1;
            this.NoConnector = -1;
            this.NoWire = -1;
            this.NoWireConnector = -1;
            this.offset = { x: null, y: null };
        },
    },
};

/**储存电路状态，实现撤销恢复 */
var allStates = {
    undoState: [],
    redoState: [],
    lastState: null,
    updateUndoState(state = copyObject()) {
        this.undoState.push(state);
        buttonUndo.disabled = this.undoState.length === 0;
        buttonRedo.disabled = this.redoState.length === 0;
    },
    updateRedoState(state = copyObject()) {
        this.redoState.push(state);
        buttonUndo.disabled = this.undoState.length === 0;
        buttonRedo.disabled = this.redoState.length === 0;
    },
    updateLastState(state = copyObject()) {
        this.lastState = state;
    },
    undo(state = copyObject()) {
        circuitState.getStateFrom(this.undoState.pop());
        this.updateRedoState(state);
    },
    redo(state = copyObject()) {
        circuitState.getStateFrom(this.redoState.pop());
        this.updateUndoState(state);
    },
    do(state = copyObject()) {
        this.updateUndoState(state);
        this.redoState = [];
        buttonRedo.disabled = true;
    },
    clear() {
        this.undoState = [];
        this.redoState = [];
        this.lastState = null;
        buttonUndo.disabled = true;
        buttonRedo.disabled = true;
    },
};

/**创建导线时需要的相关信息 */
var createWireInfo = {
    loc1: {},
    loc2: {},
    turningPoints: [],
    shift: shiftFlag,
    clickCount: 0,
    clickNoConnector: -1,
    clear() {
        this.loc1 = {};
        this.loc2 = {};
        this.turningPoints = [];
        this.shift = shiftFlag;
        this.clickCount = 0;
        this.clickNoConnector = -1;
    },
};

/**移动导线时需要的相关信息 */
var moveWireInfo = {
    oldLoc1: {},
    oldLoc2: {},
    loc1: {},
    loc2: {},
    shift: false,
};

/**提示框 */
var tooltip = {
    height: 100,
    width: 200,
    offsetLeft: canvasInfo.position.x + 5,
    offsetTop: canvasInfo.position.y + 5,
    getPropertyList(element) {
        let propertyList = [];
        for (let item in element) {
            if (item != "unknownProperties") {
                if (element["unknownProperties"].includes(item)) {
                    propertyList.push(item + " : " + "unknown");
                } else if (item == "I" || item == "U" || item == "P") {
                    propertyList.push(
                        item + " : " + element[item].toFixed(2) + "\n"
                    ); // U、I、P值保留2位小数
                } else {
                    propertyList.push(item + " : " + element[item] + "\n");
                }
            }
        }
        return propertyList;
    },
    draw(element) {
        var propertyList = this.getPropertyList(element);
        this.height = shiftFlag ? propertyList.length * 20 + 20 : 100;
        this.offsetTop =
            canvasInfo.position.y + this.height > canvas.height - 10
                ? canvas.height - this.height - 5
                : canvasInfo.position.y + 5;
        this.offsetLeft =
            canvasInfo.position.x + this.width > canvas.width - 10
                ? canvasInfo.position.x - 5 - this.width
                : canvasInfo.position.x + 5;

        ctx.save();

        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#191990";
        ctx.rect(this.offsetLeft, this.offsetTop, this.width, this.height);
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fill();
        ctx.stroke();

        ctx.font = "16px Cambria Math";
        ctx.fillStyle = "white";
        if (shiftFlag) {
            for (var i = 0; i < propertyList.length; i++) {
                ctx.fillText(
                    propertyList[i],
                    this.offsetLeft + 15,
                    this.offsetTop + 25 + i * 20
                );
            }
        } else {
            for (var i = 0; i < 3; i++) {
                ctx.fillText(
                    propertyList[i],
                    this.offsetLeft + 15,
                    this.offsetTop + 25 + i * 20
                );
            }
            ctx.font = "italic 16px Cambria Math";
            ctx.fillText(
                "<press shift for details>",
                this.offsetLeft + 15,
                this.offsetTop + 25 + 3 * 20
            );
        }

        ctx.restore();
    },
};

//Events
for (var i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function () {
        if (buttonFlag && this.getAttribute("id") == buttonPressed) {
            buttonFlag = false;
            this.style.backgroundColor = "";
            wireClickCount = 0;
            buttonPressed = "";
        } else {
            buttonFlag = true;
            buttonPressed = this.getAttribute("id");
            for (let j = 0; j < buttons.length; j++) {
                buttons[j].style.backgroundColor = "";
            }
            this.style.backgroundColor = "#c2c2c2";
        }
        fakeElementAngle = 0;
        createElementEvent();
        createWireEvent();
        deleteEvent();
    };
}

$("#undo").on("click", function () {
    allStates.undo();
});

$("#redo").on("click", function () {
    allStates.redo();
});

$("#calculate").on("click", function () {
    if (calculateFlag) {
        //按钮启用
        calculateFlag = false;
        this.style.backgroundColor = "";
    } else {
        //按钮禁用
        calculateFlag = true;
        this.style.backgroundColor = "#c2c2c2";
    }
});

$("#reset").on("click", function () {
    if (confirm("是否确认重置？")) {
        if (JSON.stringify(circuitState) != JSON.stringify(initState)) {
            allStates.do();
            circuitState.getStateFrom(copyObject(initState));
        }
    }
});

$("#clear").on("click", function () {
    if (confirm("是否确认清空？")) {
        if (JSON.stringify(circuitState) != JSON.stringify(emptyState)) {
            allStates.do();
            circuitState.getStateFrom(emptyState);
        }
    }
});

document.onkeydown = function (e) {
    var keyCode = e.keyCode || e.which || e.charCode,
        ctrlKey = e.ctrlKey || e.metaKey,
        escKey = e.key === "Escape";
    if (e.shiftKey) {
        shiftFlag = true;
    }
    if (escKey) {
        if (buttonFlag) {
            buttonFlag = false;
            $("#" + buttonPressed).css("backgroundColor", "");
            wireClickCount = 0;
            buttonPressed = "";
            fakeElementAngle = 0;
            createElementEvent();
            createWireEvent();
            deleteEvent();
        }
    }
    if (e.altKey) {
        altFlag = true;
    }
    if (ctrlKey) {
        ctrlFlag = true;
    }
    if (ctrlKey && keyCode == 90) {
        // ctrl+Z撤销
        allStates.undo();
    } else if (ctrlKey && keyCode == 89) {
        // ctrl+Y恢复
        allStates.redo();
    }
    if (e.altKey && keyCode == 77) {
        // alt+M旋转
        fakeElementAngle = (fakeElementAngle + 45) % 360;
        if (
            canvasInfo.state == stateConfig.CLICKING ||
            canvasInfo.state == stateConfig.DRAGGING
        ) {
            rotateElement();
        }
    }
    // e.preventDefault();  // 阻止浏览器默认快捷键，防止冲突
};

document.onkeyup = function (e) {
    shiftFlag = false;
    altFlag = false;
    ctrlFlag = false;
};

canvas.onmousemove = function (e) {
    controlCursorStyle();

    canvasInfo.position = { x: e.offsetX, y: e.offsetY };

    if (canvasInfo.state == stateConfig.CLICKING) {
        canvasInfo.state = stateConfig.DRAGGING;
    }

    // 元素移动
    else if (canvasInfo.state == stateConfig.DRAGGING) {
        if (canvasInfo.draggingTarget.NoWire !== -1) {
            moveWire();
        } else if (canvasInfo.draggingTarget.NoElement !== -1) {
            moveElement();
        }
    }
};

canvas.onmousedown = function (e) {
    // 阻止浏览器默认行为，防止双击画布选中其他文字
    e.preventDefault();

    if (!buttonFlag && ctrlFlag) {
        if (addIClosed) {
            addI_cross();
        }
        let targetNo = circuitState.elements[canvasInfo.target.NoElement].No;
        if (!sidenavDetailShow.includes(targetNo)) {
            sidenavDetailShow.push(targetNo);
        }
        let targetDiv = document.querySelector("#element" + targetNo);
        targetDiv.scrollIntoView({
            behavior: "smooth",
        });
    }

    //元素拖动判定
    if (!buttonFlag) {
        draggingJudgement();
    }
};

canvas.onmouseup = function (e) {
    canvasInfo.draggingTarget.clear();

    updateConnectWith();

    if (canvasInfo.state === stateConfig.DRAGGING) {
        allStates.do(allStates.lastState);
    }

    canvasInfo.state = stateConfig.IDLE;
    fakeElementAngle = 0;
};

canvas.ondblclick = function (e) {
    if (!buttonFlag && canvasInfo.target.NoElement !== -1) {
        let NoEle = canvasInfo.target.NoElement;
        let element = circuitState.elements[NoEle];
        if (
            element instanceof PowerIAC ||
            element instanceof PowerIDC ||
            element instanceof PowerVAC ||
            element instanceof PowerVDC
        ) {
            element.ON = !element.ON;
        }
    }
};

/**DOM树加载完毕后初始化 */
jQuery(function () {
    allStates.clear();
    draws();
});
