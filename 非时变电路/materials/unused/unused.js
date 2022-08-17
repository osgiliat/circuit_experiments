/**在鼠标控制下移动元件
 *
 * @param {number} No 要移动的元件的编号
 */
function moveElement(No = canvasInfo.draggingTarget.NoElement) {
    var oldx = circuitState.elements[No].x,
        oldy = circuitState.elements[No].y;
    circuitState.elements[No].x = canvasInfo.position.x - canvasInfo.offset.x;
    circuitState.elements[No].y = canvasInfo.position.y - canvasInfo.offset.y;
    for (var j of circuitState.elements[No].connectors) {
        var jindex = getIndexOfCons(j);
        circuitState.connectors[jindex].x += circuitState.elements[No].x - oldx;
        circuitState.connectors[jindex].y += circuitState.elements[No].y - oldy;
    }
}

/**旋转元件
 *
 * @param {number} No 要旋转的元件编号
 */
function rotateElement(No = canvasInfo.draggingTarget.NoElement) {
    circuitState.elements[No].angle =
        (circuitState.elements[No].angle + Math.PI / 4) % (2 * Math.PI);
    for (var j = 0; j < circuitState.elements[No].connectors.length; j++) {
        var jindex = getIndexOfCons(circuitState.elements[No].connectors[j]),
            relativeXY = relativeXYs[circuitState.elements[No].class],
            rotatedPoint = getRotatedPoint(
                relativeXY[j][0] + circuitState.elements[No].x,
                relativeXY[j][1] + circuitState.elements[No].y,
                circuitState.elements[No].x,
                circuitState.elements[No].y,
                circuitState.elements[No].angle
            );
        circuitState.connectors[jindex].x = rotatedPoint.x;
        circuitState.connectors[jindex].y = rotatedPoint.y;
    }
}

/**鼠标双击事件
 * 双击修改参数
 */
canvas.ondblclick = function (e) {
    if (!buttonFlag) {
        for (var ele of circuitState.elements) {
            if (ele.draw()) {
                if (ele instanceof Resistor) {
                    allStates.do();
                    if (ele.slide) {
                        ele.R = alertInput("总电阻", ele.R);
                    } else {
                        ele.R = alertInput("电阻", ele.R);
                    }
                } else if (ele instanceof Power) {
                    allStates.do();
                    ele.U = alertInput("电压", ele.U);
                }
            }
        }
    }
};

/**从一个对象中得到并更新电路状态，用以撤销恢复以及从JSON文件读取电路
 *
 * @param {object} state 储存着电路状态的对象
 */
function getCircuitState(state, circuitState) {
    circuitState.clear();
    circuitState.No = copyObject(state.No);
    for (var i = 0; i < state.elements.length; i++) {
        circuitState.elements.splice(
            i,
            1,
            eval(`new ${upperFirst(state.elements[i].class)}()`)
        );
        Object.assign(circuitState.elements[i], state.elements[i]);
    }
    for (var i = 0; i < state.connectors.length; i++) {
        var con = state.connectors[i];
        circuitState.connectors.splice(i, 1, new Connector());
        Object.assign(circuitState.connectors[i], con);
    }
    for (var i = 0; i < state.wires.length; i++) {
        var wire = state.wires[i];
        circuitState.wires[i] = new Wire();
        Object.assign(circuitState.wires[i], wire);
        if ("No" in wire.loc1) {
            circuitState.wires[i].loc1 =
                circuitState.connectors[getIndexFromNo(wire.loc1.No)];
        }
        if ("No" in wire.loc2) {
            circuitState.wires[i].loc2 =
                circuitState.connectors[getIndexFromNo(wire.loc2.No)];
        }
    }
}

/**电路状态，存储着电路的所有信息 */
var circuitState = {
    elements: [],
    connectors: [],
    wires: [],
    No: {
        all: 0,
        voltmeter: 0,
        resistor: 0,
        amperemeter: 0,
        power: 0,
        capacitor: 0,
        inductor: 0,
        // newElementClass: 0
        connector: 0,
        wire: 0,
    },
    max: {
        all: -1,
        voltmeter: -1,
        resistor: -1,
        amperemeter: -1,
        power: -1,
        capacitor: -1,
        inductor: -1,
        // newElementClass: -1
        connector: -1,
        wire: -1,
    },
    clear() {
        this.elements = [];
        this.connectors = [];
        this.wires = [];
        this.No = {
            all: 0,
            voltmeter: 0,
            resistor: 0,
            amperemeter: 0,
            power: 0,
            capacitor: 0,
            inductor: 0,
            // newElementClass: 0
            connector: 0,
            wire: 0
        };
        return this;
    },
    initialize() {
        getCircuitState(initState, this)
        return this;
    }
};