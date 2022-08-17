/**在鼠标控制下移动元件
 *
 * @param {Number} No 要移动的元件编号
 */
function moveElement(No = canvasInfo.draggingTarget.NoElement) {
    circuitState.elements[No].x =
        canvasInfo.position.x - canvasInfo.draggingTarget.offset.x;
    circuitState.elements[No].y =
        canvasInfo.position.y - canvasInfo.draggingTarget.offset.y;
}

/**在鼠标控制下移动导线
 *
 * @param {Number} No 要移动的导线编号
 */
function moveWire(No = canvasInfo.draggingTarget.NoWire) {
    if (canvasInfo.draggingTarget.NoWireConnector == 1) {
        moveWireInfo.loc1 = canvasInfo.position;
        moveWireInfo.loc2 = moveWireInfo.oldLoc2;
        if (
            "No" in moveWireInfo.oldLoc2 &&
            canvasInfo.target.NoConnector != -1
        ) {
            if (
                (canvasInfo.target.NoConnector !=
                    getIndexFromNo(moveWireInfo.loc2.No) &&
                    !circuitState.connectors[
                        getIndexFromNo(moveWireInfo.loc2.No)
                    ].connectWith.includes(canvasInfo.target.NoConnector)) ||
                canvasInfo.target.NoConnector ==
                    getIndexFromNo(moveWireInfo.oldLoc1.No)
            ) {
                moveWireInfo.loc1 =
                    circuitState.connectors[canvasInfo.target.NoConnector];
            }
        } else if (canvasInfo.target.NoConnector != -1) {
            moveWireInfo.loc1 =
                circuitState.connectors[canvasInfo.target.NoConnector];
        }
    } else if (canvasInfo.draggingTarget.NoWireConnector == 2) {
        moveWireInfo.loc2 = canvasInfo.position;
        moveWireInfo.loc1 = moveWireInfo.oldLoc1;
        if ("No" in moveWireInfo.loc1 && canvasInfo.target.NoConnector != -1) {
            if (
                (canvasInfo.target.NoConnector !=
                    getIndexFromNo(moveWireInfo.loc1.No) &&
                    !circuitState.connectors[
                        getIndexFromNo(moveWireInfo.loc1.No)
                    ].connectWith.includes(canvasInfo.target.NoConnector)) ||
                canvasInfo.target.NoConnector ==
                    getIndexFromNo(moveWireInfo.oldLoc2.No)
            ) {
                moveWireInfo.loc2 =
                    circuitState.connectors[canvasInfo.target.NoConnector];
            }
        } else if (canvasInfo.target.NoConnector != -1) {
            moveWireInfo.loc2 =
                circuitState.connectors[canvasInfo.target.NoConnector];
        }
    }
    circuitState.wires[No].shift = moveWireInfo.shift ^ shiftFlag;
    circuitState.wires[No].loc1 = moveWireInfo.loc1;
    circuitState.wires[No].loc2 = moveWireInfo.loc2;
}

/**删除编号为No的元件，同时删除对应的接线柱，并更新与接线柱连接的导线的信息
 *
 * @param {Number} No 要删除的元件的编号，默认为鼠标指向的元件
 */
function deleteElement(No = canvasInfo.target.NoElement) {
    if (!circuitState.elements[No].deletable) {
        alert("该元件不可删除！");
        return;
    }
    allStates.do();
    let connectorIndexArr = circuitState.elements[No].connectors.map(
        (NoCon) => {
            return getIndexFromNo(NoCon);
        }
    );
    connectorIndexArr.sort((a, b) => {
        a - b;
    });
    // 删除元件后，将接线柱连接的导线两端的信息更新
    connectorIndexArr.forEach((connectorIndex) => {
        let wireIndexArr = circuitState.connectors[
            connectorIndex
        ].connectedWires.map((NoWire) => {
            return getIndexFromNo(NoWire, circuitState.wires);
        });
        wireIndexArr.forEach((wireIndex) => {
            if (
                circuitState.connectors[connectorIndex] ==
                circuitState.wires[wireIndex].loc1
            ) {
                circuitState.wires[wireIndex].loc1 = {
                    x: circuitState.connectors[connectorIndex].x,
                    y: circuitState.connectors[connectorIndex].y,
                };
            } else if (
                circuitState.connectors[connectorIndex] ==
                circuitState.wires[wireIndex].loc2
            ) {
                circuitState.wires[wireIndex].loc2 = {
                    x: circuitState.connectors[connectorIndex].x,
                    y: circuitState.connectors[connectorIndex].y,
                };
            }
        });
    });
    // 删除元件对应的接线柱
    for (var j = connectorIndexArr.length - 1; j > -1; j--) {
        circuitState.connectors.splice(connectorIndexArr[j], 1);
    }
    // 删除元件侧栏显示标签
    if (sidenavDetailShow.includes(circuitState.elements[No].No)) {
        sidenavDetailShow.splice(
            sidenavDetailShow.indexOf(circuitState.elements[No].No),
            1
        );
    }
    // 删除元件本身
    circuitState.elements.splice(No, 1);
    circuitState.updateCount();
}

/**删除编号为No的导线
 *
 * @param {Number} No 要删除的导线编号，默认为鼠标指向的导线
 */
function deleteWire(No = canvasInfo.target.NoWire) {
    if (!circuitState.wires[No].deletable) {
        alert("该导线不可删除！");
        return;
    }
    allStates.do();
    circuitState.wires.splice(No, 1);
    circuitState.updateCount();
}

/**元件的接线柱自动跟随元件
 *
 * @param {Number} No 元件编号
 */
function connectorFollow(No) {
    for (var j = 0; j < circuitState.elements[No].connectors.length; j++) {
        var jIndex = getIndexFromNo(circuitState.elements[No].connectors[j]),
            relativeXY = circuitState.elements[No].connectorsXY,
            rotatedPoint = getRotatedPoint(
                relativeXY[j].x + circuitState.elements[No].x,
                relativeXY[j].y + circuitState.elements[No].y,
                circuitState.elements[No].x,
                circuitState.elements[No].y,
                angleToArc(circuitState.elements[No].angle)
            );
        circuitState.connectors[jIndex].x = rotatedPoint.x;
        circuitState.connectors[jIndex].y = rotatedPoint.y;
    }
}

/**输入参数提示 */
function alertInput(str, defaultNum = 10) {
    var num = prompt("为新元件设置: " + str, defaultNum);
    if (num === null) {
        return;
    }
    var regPos = /^\d+(\.\d+)?$/, //非负浮点数
        regNeg =
            /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
    if (regPos.test(num) || regNeg.test(num)) {
        return parseFloat(num);
    } else {
        return alertInput(str);
    }
}

/**根据条件改变鼠标样式 */
function controlCursorStyle() {
    if (!buttonFlag && canvasInfo.target.NoElement != -1) {
        canvas.style.cursor = "move";
    } else if (
        !buttonFlag &&
        canvasInfo.state === stateConfig.DRAGGING &&
        canvasInfo.draggingTarget.NoWire !== -1 &&
        canvasInfo.target.NoConnector != -1
    ) {
        canvas.style.cursor = "pointer";
    } else if (!buttonFlag && canvasInfo.target.NoWire != -1) {
        canvas.style.cursor = "move";
    } else if (
        buttonFlag &&
        buttonPressed == "delete" &&
        canvasInfo.target.NoElement != -1
    ) {
        canvas.style.cursor = "pointer";
    } else if (
        buttonFlag &&
        buttonPressed == "delete" &&
        canvasInfo.target.NoWire != -1
    ) {
        canvas.style.cursor = "pointer";
    } else if (
        buttonFlag &&
        buttonPressed == "wire" &&
        canvasInfo.target.NoConnector != -1
    ) {
        canvas.style.cursor = "pointer";
    } else if (
        buttonFlag &&
        buttonPressed != "wire" &&
        buttonPressed != "delete"
    ) {
        canvas.style.cursor = "pointer";
    } else {
        canvas.style.cursor = "";
    }
}

/**通过编号获得其在数组的下标
 * （删除后元素的编号仍将后继，不会填补被删除元素的空缺编号，
 * 因此编号与其在数组的下标可能不对应）
 *
 * @param {Number} No 编号
 * @param {Array.<Object>} consArr 数组，默认是接线柱数组
 * @returns {Number} 通过编号得到的数组的下标
 */
function getIndexFromNo(No, consArr = circuitState.connectors) {
    let connectorsNoList = consArr.map((connector) => {
        return connector.No;
    });
    return connectorsNoList.indexOf(No);
}

/**旋转元件
 *
 * @param {Number} No 要旋转元件的编号，默认为鼠标拖拽的元件
 */
function rotateElement(No = canvasInfo.draggingTarget.NoElement) {
    circuitState.elements[No].angle =
        (circuitState.elements[No].angle + 45) % 360;
}

/**硬拷贝一个对象
 *
 * @param {Object} obj 要拷贝的对象，默认为电路状态
 * @param {Boolean} transform 拷贝时将字符串"Infinity"转为数值Infinity
 * @returns {Object} 拷贝后的对象，可赋值给其他变量
 */
function copyObject(obj = circuitState, transform = false) {
    var copiedObj = {};
    if (obj instanceof Array) {
        copiedObj = [];
    }
    if (obj instanceof CircuitElement) {
        Object.defineProperties(obj, {
            state: {
                enumerable: true,
            },
            put: {
                enumerable: true,
            },
            connectorsXY: {
                enumerable: true,
            },
            propertiesEditType: {
                enumerable: true,
            },
            rd: {
                enumerable: true,
            },
        });
    }
    for (var key in obj) {
        var value = obj[key];
        if (transform) {
            value = value === "Infinity" ? Infinity : value;
        }
        copiedObj[key] = typeof value === "object" ? copyObject(value) : value;
    }
    if (obj instanceof CircuitElement) {
        Object.defineProperties(obj, {
            state: {
                enumerable: false,
            },
            put: {
                enumerable: false,
            },
            connectorsXY: {
                enumerable: false,
            },
            propertiesEditType: {
                enumerable: false,
            },
            rd: {
                enumerable: false,
            },
        });
    }
    return copiedObj;
}

/**绘制画布内容 */
function draws() {
    requestAnimFrame(draws);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fakeElement.angle = fakeElementAngle;
    fakeElement.draw();
    fakeElement.drawText();
    for (var connector of fakeElement.addConnectors()) {
        connector.draw();
    }
    fakeWire.shift = shiftFlag;
    fakeWire.draw();

    canvasInfo.target.clear();
    for (var i = 0; i < circuitState.elements.length; i++) {
        connectorFollow(i);
        circuitState.elements[i].drawText();
        if (circuitState.elements[i].draw()) {
            canvasInfo.target.NoElement = i;
        }
    }
    if (
        canvasInfo.state == stateConfig.CLICKING ||
        canvasInfo.state == stateConfig.DRAGGING ||
        buttonFlag ||
        $("#showConnectors").prop("checked")
    ) {
        for (var i = 0; i < circuitState.connectors.length; i++) {
            if (circuitState.connectors[i].draw()) {
                canvasInfo.target.NoConnector = i;
            }
        }
    }
    for (var i = 0; i < circuitState.wires.length; i++) {
        if (circuitState.wires[i].draw().isMouseIn1) {
            canvasInfo.target.NoWire = i;
            canvasInfo.target.NoWireConnector = 1;
        } else if (circuitState.wires[i].draw().isMouseIn2) {
            canvasInfo.target.NoWire = i;
            canvasInfo.target.NoWireConnector = 2;
        }
    }
    if (canvasInfo.draggingTarget.NoWire !== -1) {
        circuitState.wires[canvasInfo.draggingTarget.NoWire].shift =
            moveWireInfo.shift ^ shiftFlag;
    }

    //tooltip
    if (
        canvasInfo.target.NoElement != -1 &&
        $("#showTooltip").prop("checked")
    ) {
        tooltip.draw(circuitState.elements[canvasInfo.target.NoElement]);
    }
    if (
        canvasInfo.target.NoConnector != -1 &&
        $("#showTooltip").prop("checked")
    ) {
        tooltip.draw(circuitState.connectors[canvasInfo.target.NoConnector]);
    }

    //循环计算
    if (calculateFlag) {
        getResults();
    }
}

/**更新接线柱连接状态 */
function updateConnectWith() {
    circuitState.connectors.forEach((connector) => {
        connector.connectWith = [];
        connector.connectedWires = [];
    });
    circuitState.wires.forEach((wire) => {
        if (wire.loc1 instanceof Connector && wire.loc2 instanceof Connector) {
            wire.loc1.connectWith.push(wire.loc2.No);
            wire.loc2.connectWith.push(wire.loc1.No);
        }
        if (wire.loc1 instanceof Connector) {
            wire.loc1.connectedWires.push(wire.No);
        }
        if (wire.loc2 instanceof Connector) {
            wire.loc2.connectedWires.push(wire.No);
        }
    });
}

/**创建fakeWire，显示要添加导线的虚影 */
function createFakeWire(e) {
    fakeWire = new Wire(
        false,
        createWireInfo.shift,
        canvasInfo.position,
        canvasInfo.position,
        checkingGenerated ? "red" : "black"
    );
    if (createWireInfo.clickCount == 0) {
        createWireInfo.loc1 =
            canvasInfo.target.NoConnector == -1
                ? canvasInfo.position
                : circuitState.connectors[canvasInfo.target.NoConnector];
        fakeWire.loc1 = createWireInfo.loc1;
        fakeWire.loc2 = createWireInfo.loc1;
    } else {
        createWireInfo.loc2 =
            canvasInfo.target.NoConnector != createWireInfo.clickNoConnector &&
            canvasInfo.target.NoConnector != -1 &&
            !circuitState.connectors[
                canvasInfo.target.NoConnector
            ].connectWith.includes(createWireInfo.clickNoConnector)
                ? circuitState.connectors[canvasInfo.target.NoConnector]
                : canvasInfo.position;
        fakeWire.loc1 = createWireInfo.loc1;
        fakeWire.loc2 = createWireInfo.loc2;
        fakeWire.shift = shiftFlag;
        fakeWire.turningPoints = [
            {
                x: fakeWire.loc1.x,
                y: fakeWire.loc1.y,
                shift: false,
            },
            ...createWireInfo.turningPoints,
            {
                x: fakeWire.loc2.x,
                y: fakeWire.loc2.y,
                shift: fakeWire.shift,
            },
        ];
    }
}

/**设定导线的端点和弯折点位置，创建真实导线 */
function setWireConnectors(e) {
    if (createWireInfo.clickCount == 0) {
        allStates.updateLastState();
        createWireInfo.clickCount = 1;
        createWireInfo.clickNoConnector = canvasInfo.target.NoConnector;
    } else if (altFlag) {
        createWireInfo.turningPoints.push({
            x: canvasInfo.position.x,
            y: canvasInfo.position.y,
            shift: shiftFlag,
        });
        createWireInfo.clickCount++;
    } else {
        newWire = fakeWire;
        fakeWire = new BlankElement();
        newWire.put = true;
        circuitState.wires.push(newWire);
        createWireInfo.clear();
        circuitState.No.wire++;
        allStates.do(allStates.lastState);
        circuitState.updateCount();
        if (circuitState.max.wire - circuitState.count.wire <= 0) {
            buttonFlag = false;
            $(`#${buttonPressed}`).css("background-color", "");
            buttonPressed = "";
        }
        createWireEvent();
    }
}

/**当鼠标移出画布时，移除导线虚影 */
function removeFakeWire(e) {
    fakeWire = new BlankElement();
}

/**创建导线时的事件监听 */
function createWireEvent() {
    if (buttonFlag && buttonPressed == "wire") {
        canvas.addEventListener("mousemove", createFakeWire);
        canvas.addEventListener("mousedown", setWireConnectors);
        canvas.addEventListener("mouseout", removeFakeWire);
    } else {
        canvas.removeEventListener("mousemove", createFakeWire);
        canvas.removeEventListener("mousedown", setWireConnectors);
        canvas.removeEventListener("mouseout", removeFakeWire);
        fakeWire = new BlankElement();
        newWire = new BlankElement();
        createWireInfo.clear();
    }
}

/**创建fakeElement，显示要添加元件的虚影 */
function createFakeElement(e) {
    fakeElement = eval(`new ${upperFirst(buttonPressed)}()`);
    fakeElement.angle = fakeElementAngle;
    fakeElement.addConnectors();
}

/**创建真实元件 */
function createRealElement(e) {
    allStates.do();
    fakeElement = new BlankElement();

    if (buttonPressed == "resistor") {
        var newElementProperty = alertInput("电阻");
    } else if (buttonPressed == "powerVDC") {
        var newElementProperty = alertInput("电压");
    }
    if (newElementProperty === null) {
        return null;
    }
    newElement = eval(`new ${upperFirst(buttonPressed)}(true)`);
    // circuitState.No[buttonPressed]++;
    if (buttonPressed == "resistor") {
        newElement.R = newElementProperty;
    } else if (buttonPressed == "powerVDC") {
        newElement.U = newElementProperty;
    }
    newElement.angle = fakeElementAngle;
    newElement.create();
    // newElement.addConnectors();
    // circuitState.elements.push(newElement);
    // circuitState.No.connector += 2;
    // circuitState.No.element++;
    circuitState.updateCount();

    if (circuitState.max[buttonPressed] <= circuitState.count[buttonPressed]) {
        buttonFlag = false;
        $(`#${buttonPressed}`).css("background-color", "");
        wireClickCount = 0;
        buttonPressed = "";
    }
    createElementEvent();
}

/**当鼠标移出画布时，移出元件虚影 */
function removeFakeElement(e) {
    fakeElement = new BlankElement();
}

/**创建元件时的事件监听 */
function createElementEvent() {
    if (buttonFlag && buttonPressed != "wire" && buttonPressed != "delete") {
        canvas.addEventListener("mousemove", createFakeElement);
        canvas.addEventListener("mousedown", createRealElement);
        canvas.addEventListener("mouseout", removeFakeElement);
    } else {
        canvas.removeEventListener("mousemove", createFakeElement);
        canvas.removeEventListener("mousedown", createRealElement);
        canvas.removeEventListener("mouseout", removeFakeElement);
        fakeElement = new BlankElement();
        newElement = new BlankElement();
    }
}

/**删除元素的事件句柄 */
function deleteHandle(e) {
    if (canvasInfo.target.NoWire !== -1) {
        deleteWire();
    } else if (canvasInfo.target.NoElement !== -1) {
        deleteElement();
    }
}

/**删除元素时的事件监听 */
function deleteEvent() {
    if (buttonFlag && buttonPressed == "delete") {
        canvas.addEventListener("mousedown", deleteHandle);
    } else {
        canvas.removeEventListener("mousedown", deleteHandle);
    }
}

/**元素的拖动判定 */
function draggingJudgement() {
    if (canvasInfo.target.NoElement !== -1) {
        let i = canvasInfo.target.NoElement;
        allStates.updateLastState();
        canvasInfo.state = stateConfig.CLICKING;
        canvasInfo.draggingTarget.NoElement = i;
        canvasInfo.draggingTarget.offset.x =
            canvasInfo.position.x - circuitState.elements[i].x;
        canvasInfo.draggingTarget.offset.y =
            canvasInfo.position.y - circuitState.elements[i].y;
    }
    if (canvasInfo.target.NoConnector !== -1) {
        let i = canvasInfo.target.NoConnector;
        allStates.updateLastState();
        canvasInfo.state = stateConfig.CLICKING;
        canvasInfo.draggingTarget.NoConnector = i;
    }
    if (canvasInfo.target.NoWire !== -1) {
        let i = canvasInfo.target.NoWire;
        allStates.updateLastState();
        canvasInfo.state = stateConfig.CLICKING;
        canvasInfo.draggingTarget.NoWire = i;
        moveWireInfo.oldLoc1 = circuitState.wires[i].loc1;
        moveWireInfo.oldLoc2 = circuitState.wires[i].loc2;
        moveWireInfo.shift = circuitState.wires[i].shift;
        canvasInfo.draggingTarget.NoWireConnector =
            canvasInfo.target.NoWireConnector;
    }
}
