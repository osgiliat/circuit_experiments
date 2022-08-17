class CircuitState {
    constructor() {
        this.elements = [];
        this.connectors = [];
        this.wires = [];
        this.No = {
            element: 0,
            voltmeter: 0,
            resistor: 0,
            ammeter: 0,
            powerVDC: 0,
            powerIDC: 0,
            powerVAC: 0,
            powerIAC: 0,
            capacitor: 0,
            inductor: 0,
            // newElementClass: 0,
            connector: 0,
            wire: 0,
        };
        this.max = {
            element: Infinity,
            voltmeter: Infinity,
            resistor: Infinity,
            ammeter: Infinity,
            powerVDC: Infinity,
            powerIDC: Infinity,
            powerVAC: Infinity,
            powerIAC: Infinity,
            capacitor: Infinity,
            inductor: Infinity,
            // newElementClass: Infinity,
            connector: Infinity,
            wire: Infinity,
        };
        this.count = {
            element: 0,
            voltmeter: 0,
            resistor: 0,
            ammeter: 0,
            powerVDC: 0,
            powerIDC: 0,
            powerVAC: 0,
            powerIAC: 0,
            capacitor: 0,
            inductor: 0,
            // newElementClass: 0,
            connector: 0,
            wire: 0,
        };
    }
    clear() {
        this.elements = [];
        this.connectors = [];
        this.wires = [];
        this.No = {
            element: 0,
            voltmeter: 0,
            resistor: 0,
            ammeter: 0,
            powerVDC: 0,
            powerIDC: 0,
            powerVAC: 0,
            powerIAC: 0,
            capacitor: 0,
            inductor: 0,
            // newElementClass: 0,
            connector: 0,
            wire: 0,
        };
        return this;
    }
    getStateFrom(state) {
        this.clear();
        this.No = copyObject(state.No);
        this.max = copyObject(state.max, true);
        this.count = copyObject(state.count);
        for (var i = 0; i < state.elements.length; i++) {
            this.elements.splice(
                i,
                1,
                eval(`new ${upperFirst(state.elements[i].class)}()`)
            );
            Object.assign(this.elements[i], state.elements[i]);
        }
        for (var i = 0; i < state.connectors.length; i++) {
            var con = state.connectors[i];
            this.connectors.splice(i, 1, new Connector());
            Object.assign(this.connectors[i], con);
        }
        for (var i = 0; i < state.wires.length; i++) {
            var wire = state.wires[i];
            this.wires[i] = new Wire();
            Object.assign(this.wires[i], wire);
            if ("No" in wire.loc1) {
                this.wires[i].loc1 =
                    this.connectors[
                        getIndexFromNo(wire.loc1.No, this.connectors)
                    ];
            }
            if ("No" in wire.loc2) {
                this.wires[i].loc2 =
                    this.connectors[
                        getIndexFromNo(wire.loc2.No, this.connectors)
                    ];
            }
        }
    }
    updateCount() {
        Object.keys(this.count).forEach((key) => {
            this.count[key] = this.elements.filter((element) => {
                return element.class === key;
            }).length;
            this.count.wire = this.wires.length;
            this.count.connector = this.connectors.length;
            this.count.element = this.elements.length;
        });
    }
}

class BlankElement {
    //空白元素，用以删除虚影、填补元素数组空位等
    constructor() {
        this.class = "blank";
    }
    draw() {
        return { isMouseIn1: null, isMouseIn2: null };
    }
    drawText() {}
    addConnectors() {
        return [];
    }
    create() {}
}

class CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        elementClass
    ) {
        this.name = elementClass + circuitState.No[elementClass];
        this.ID = elementClass + circuitState.No[elementClass];
        this.No = circuitState.No.element;
        this["No" + upperFirst(elementClass)] = circuitState.No[elementClass];
        this.class = elementClass;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.connectors = [];
        this.connectorsXY = [];
        this.state = false;
        this.rd = null;
        this.put = put; // 是否被放置在画布中
        this.color = "black";
        this.unknownProperties = []; // 数组中的属性将显示为unknown（即未知）。
        this.deletable = true;
        this.brokenType = -1;
        this.propertiesEditType = {};
        this.propertiesEditType["No" + upperFirst(elementClass)] = {
            type: "uneditable",
        };
        Object.defineProperties(this, {
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
    addConnectors() {
        let newConnector1, newConnector2;
        let con1loc = getRotatedPoint(
                this.x + this.connectorsXY[0].x,
                this.y + this.connectorsXY[0].y,
                this.x,
                this.y,
                angleToArc(this.angle)
            ),
            con2loc = getRotatedPoint(
                this.x + this.connectorsXY[1].x,
                this.y + this.connectorsXY[1].y,
                this.x,
                this.y,
                angleToArc(this.angle)
            );
        newConnector1 = new Connector(
            circuitState.No.connector,
            con1loc.x,
            con1loc.y,
            this.No
        );
        newConnector2 = new Connector(
            circuitState.No.connector + 1,
            con2loc.x,
            con2loc.y,
            this.No
        );
        this.connectors = [newConnector1.No, newConnector2.No];
        if (this.put) {
            circuitState.connectors.push(newConnector1);
            circuitState.connectors.push(newConnector2);
            circuitState.No.connector += 2;
        }
        return [newConnector1, newConnector2];
    }
    create() {
        this.addConnectors();
        circuitState.elements.push(this);
        circuitState.No[this.class]++;
        circuitState.No.element++;
    }
    setCtx() {
        ctx.translate(this.x, this.y);
        ctx.rotate(angleToArc(this.angle));
        if (this.put === false) {
            this.color = "#C0C0C0";
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
    }
    setTextCtx() {
        ctx.translate(this.x, this.y);
        ctx.rotate(
            ((angleToArc(this.angle) + Math.PI / 2) % Math.PI) - Math.PI / 2
        );
        ctx.font = "16px Cambria Math";
        ctx.fillStyle = "black";
    }
}

class Voltmeter extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        measuringRange = 3,
        precision = 2
    ) {
        super(put, x, y, angle, "voltmeter");
        this.connectorsXY = [
            { x: -70, y: 0 },
            { x: 70, y: 0 },
        ];
        this.R = 1000000;
        this.U = 0;
        this.I = 0;
        this.P = 0;
        this.measuringRange = measuringRange; //量程
        this.precision = precision;
        this.unit = "V";
        Object.assign(this.propertiesEditType, {
            measuringRange: { type: "range", min: 1, max: 10, step: 1 },
            unit: {
                type: "select",
                multiple: false,
                options: ["V", "mV", "uV"],
            },
        });
        this.unknownProperties = expCfg.expMode
            ? ["I", "P"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-50, -30, 100, 60);
        ctx.stroke();
        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-50, 0);
        ctx.lineTo(-70, 0);
        ctx.moveTo(50, 0);
        ctx.lineTo(70, 0);
        ctx.moveTo(-61, -5);
        ctx.lineTo(-55, -5);
        ctx.moveTo(61, -5);
        ctx.lineTo(55, -5);
        ctx.moveTo(-58, -8);
        ctx.lineTo(-58, -2);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-70, -35, 140, 70);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();

        let measurementResultsStr = "";
        let measuringRangeStr = "";
        switch (this.unit) {
            case "V":
                measurementResultsStr =
                    "V" +
                    this.NoVoltmeter +
                    ": " +
                    (this.U ** 2 > this.measuringRange ** 2
                        ? "OL"
                        : this.U.toFixed(this.precision) + "V");
                measuringRangeStr =
                    "量程: " +
                    (this.unknownProperties.includes("measuringRange")
                        ? "unknown"
                        : this.measuringRange + "V");
                break;
            case "mV":
                measurementResultsStr =
                    "V" +
                    this.NoVoltmeter +
                    ": " +
                    ((this.U * 10 ** 3) ** 2 > this.measuringRange ** 2
                        ? "OL"
                        : (this.U * 10 ** 3).toFixed(this.precision) + "mV");
                measuringRangeStr =
                    "量程: " +
                    (this.unknownProperties.includes("measuringRange")
                        ? "unknown"
                        : this.measuringRange + "mV");
                break;
            case "uV":
                measurementResultsStr =
                    "V" +
                    this.NoVoltmeter +
                    ": " +
                    ((this.U * 10 ** 6) ** 2 > this.measuringRange ** 2
                        ? "OL"
                        : (this.U * 10 ** 6).toFixed(this.precision) + "uV");
                measuringRangeStr =
                    "量程: " +
                    (this.unknownProperties.includes("measuringRange")
                        ? "unknown"
                        : this.measuringRange + "uV");
                break;
        }
        ctx.fillText(measurementResultsStr, -45, -5);
        ctx.fillText(measuringRangeStr, -45, 25);

        ctx.restore();

        this.P = this.U * this.I;
    }
}

class Ammeter extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        measuringRange = 1,
        precision = 2
    ) {
        super(put, x, y, angle, "ammeter");
        this.connectorsXY = [
            { x: -70, y: 0 },
            { x: 70, y: 0 },
        ];
        this.R = 0.5;
        this.U = 0;
        this.I = 0;
        this.P = 0;
        this.measuringRange = measuringRange;
        this.precision = precision;
        this.unit = "A";
        Object.assign(this.propertiesEditType, {
            measuringRange: { type: "range", min: 1, max: 10, step: 1 },
            unit: {
                type: "select",
                multiple: false,
                options: ["A", "mA", "uA"],
            },
        });
        this.unknownProperties = expCfg.expMode
            ? ["U", "P"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        //图形
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-50, -30, 100, 60);
        ctx.stroke();
        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-50, 0);
        ctx.lineTo(-70, 0);
        ctx.moveTo(50, 0);
        ctx.lineTo(70, 0);
        ctx.moveTo(-61, -5);
        ctx.lineTo(-55, -5);
        ctx.moveTo(61, -5);
        ctx.lineTo(55, -5);
        ctx.moveTo(-58, -8);
        ctx.lineTo(-58, -2);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-70, -35, 140, 70);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        //文本
        ctx.save();

        this.setTextCtx();

        let measurementResultsStr = "";
        let measuringRangeStr = "";
        switch (this.unit) {
            case "A":
                measurementResultsStr =
                    "I" +
                    this.NoAmmeter +
                    ": " +
                    (this.I ** 2 > this.measuringRange ** 2
                        ? "OL"
                        : this.I.toFixed(this.precision) + "A");
                measuringRangeStr =
                    "量程: " +
                    (this.unknownProperties.includes("measuringRange")
                        ? "unknown"
                        : this.measuringRange + "A");
                break;
            case "mA":
                measurementResultsStr =
                    "I" +
                    this.NoAmmeter +
                    ": " +
                    ((this.I * 10 ** 3) ** 2 > this.measuringRange ** 2
                        ? "OL"
                        : (this.I * 10 ** 3).toFixed(this.precision) + "mA");
                measuringRangeStr =
                    "量程: " +
                    (this.unknownProperties.includes("measuringRange")
                        ? "unknown"
                        : this.measuringRange + "mA");
                break;
            case "uA":
                measurementResultsStr =
                    "I" +
                    this.NoAmmeter +
                    ": " +
                    ((this.I * 10 ** 6) ** 2 > this.measuringRange ** 2
                        ? "OL"
                        : (this.I * 10 ** 6).toFixed(this.precision) + "uA");
                measuringRangeStr =
                    "量程: " +
                    (this.unknownProperties.includes("measuringRange")
                        ? "unknown"
                        : this.measuringRange + "uA");
                break;
        }
        ctx.fillText(measurementResultsStr, -45, -5);
        ctx.fillText(measuringRangeStr, -45, +25);

        ctx.restore();

        this.P = this.U * this.I;
    }
}

class PowerVDC extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        U = 10
    ) {
        super(put, x, y, angle, "powerVDC");
        this.connectorsXY = [
            { x: -50, y: 20 },
            { x: 50, y: 20 },
        ];
        this.R = 0;
        this.U = U;
        this.I = 0;
        this.P = 0;
        this.ON = true;
        Object.assign(this.propertiesEditType, {
            U: { type: "range", min: 0, max: 100, step: 1 },
        });
        this.unknownProperties = expCfg.expMode
            ? ["R", "I", "P"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-30, -50, 60, 100);
        ctx.stroke();

        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-30, 20);
        ctx.lineTo(-50, 20);
        ctx.moveTo(30, 20);
        ctx.lineTo(50, 20);
        ctx.moveTo(-41, 15);
        ctx.lineTo(-35, 15);
        ctx.moveTo(41, 15);
        ctx.lineTo(35, 15);
        ctx.moveTo(-38, 12);
        ctx.lineTo(-38, 18);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-50, -55, 100, 110);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();

        ctx.fillText(
            "U" +
                this.NoPowerVDC +
                ": " +
                (this.unknownProperties.includes("U")
                    ? "unknown"
                    : this.U + "V"),
            -25,
            -25
        );
        ctx.fillText(this.ON ? "ON" : "OFF", -25, -5);

        ctx.restore();
    }
}

class PowerIDC extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        I = 10
    ) {
        super(put, x, y, angle, "powerIDC");
        this.connectorsXY = [
            { x: -50, y: 20 },
            { x: 50, y: 20 },
        ];
        this.R = 0;
        this.U = 0;
        this.I = I;
        this.P = 0;
        this.ON = true;
        Object.assign(this.propertiesEditType, {
            I: { type: "range", min: 0, max: 100, step: 1 },
        });
        this.unknownProperties = expCfg.expMode
            ? ["R", "U", "P"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-30, -50, 60, 100);
        ctx.stroke();

        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-30, 20);
        ctx.lineTo(-50, 20);
        ctx.moveTo(30, 20);
        ctx.lineTo(50, 20);
        ctx.moveTo(-41, 15);
        ctx.lineTo(-35, 15);
        ctx.moveTo(41, 15);
        ctx.lineTo(35, 15);
        ctx.moveTo(-38, 12);
        ctx.lineTo(-38, 18);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-50, -55, 100, 110);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();

        ctx.fillText(
            "I" +
                this.NoPowerIDC +
                ": " +
                (this.unknownProperties.includes("I")
                    ? "unknown"
                    : this.I + "A"),
            -25,
            -25
        );
        ctx.fillText(this.ON ? "ON" : "OFF", -25, -5);

        ctx.restore();
    }
}

class PowerVAC extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        UAmp = 10,
        UOff = 0,
        freq = 100,
        waveform = "sine"
    ) {
        super(put, x, y, angle, "powerVAC");
        this.connectorsXY = [
            { x: -50, y: 20 },
            { x: 50, y: 20 },
        ];
        this.R = 0;
        this.U = 0;
        this.UAmp = UAmp;
        this.UOff = UOff;
        this.freq = freq;
        this.waveform = waveform;
        this.I = 0;
        this.P = 0;
        this.ON = true;
        Object.assign(this.propertiesEditType, {
            UAmp: { type: "range", min: 0, max: 100, step: 1 },
            UOff: { type: "range", min: 0, max: 100, step: 1 },
            freq: { type: "range", min: 0, max: 100, step: 1 },
            waveform: {
                type: "select",
                multiple: false,
                options: ["sine", "square", "triangle"],
            },
        });
        this.unknownProperties = expCfg.expMode
            ? ["R", "I", "P", "U"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-30, -50, 60, 100);
        ctx.stroke();

        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-30, 20);
        ctx.lineTo(-50, 20);
        ctx.moveTo(30, 20);
        ctx.lineTo(50, 20);
        ctx.moveTo(-41, 15);
        ctx.lineTo(-35, 15);
        ctx.moveTo(41, 15);
        ctx.lineTo(35, 15);
        ctx.moveTo(-38, 12);
        ctx.lineTo(-38, 18);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-50, -55, 100, 110);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();

        ctx.fillText(
            "U" +
                this.NoPowerVAC +
                ": " +
                (this.unknownProperties.includes("UAmp")
                    ? "unknown"
                    : this.UAmp + "V"),
            -25,
            -30
        );
        ctx.fillText(
            "UOff" +
                ": " +
                (this.unknownProperties.includes("UOff")
                    ? "unknown"
                    : this.UOff + "V"),
            -25,
            -10
        );
        ctx.fillText(
            "freq" +
                ": " +
                (this.unknownProperties.includes("freq")
                    ? "unknown"
                    : this.freq + "Hz"),
            -25,
            10
        );
        ctx.fillText(
            this.unknownProperties.includes("waveform")
                ? "unknown"
                : this.waveform,
            -25,
            30
        );
        ctx.fillText(this.ON ? "ON" : "OFF", -25, 50);

        ctx.restore();
    }
}

class PowerIAC extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        IAmp = 10,
        IOff = 0,
        freq = 100,
        waveform = "sine"
    ) {
        super(put, x, y, angle, "powerIAC");
        this.connectorsXY = [
            { x: -50, y: 20 },
            { x: 50, y: 20 },
        ];
        this.R = 0;
        this.IAmp = IAmp;
        this.IOff = IOff;
        this.freq = freq;
        this.waveform = waveform;
        this.U = 0;
        this.I = 0;
        this.P = 0;
        this.ON = true;
        Object.assign(this.propertiesEditType, {
            IAmp: { type: "range", min: 0, max: 100, step: 1 },
            IOff: { type: "range", min: 0, max: 100, step: 1 },
            freq: { type: "range", min: 0, max: 100, step: 1 },
            waveform: {
                type: "select",
                multiple: false,
                options: ["sine", "square", "triangle"],
            },
        });
        this.unknownProperties = expCfg.expMode
            ? ["R", "I", "P", "U"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-30, -50, 60, 100);
        ctx.stroke();

        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-30, 20);
        ctx.lineTo(-50, 20);
        ctx.moveTo(30, 20);
        ctx.lineTo(50, 20);
        ctx.moveTo(-41, 15);
        ctx.lineTo(-35, 15);
        ctx.moveTo(41, 15);
        ctx.lineTo(35, 15);
        ctx.moveTo(-38, 12);
        ctx.lineTo(-38, 18);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-50, -55, 100, 110);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();

        ctx.fillText(
            "I" +
                this.NoPowerIAC +
                ": " +
                (this.unknownProperties.includes("IAmp")
                    ? "unknown"
                    : this.IAmp + "A"),
            -25,
            -30
        );
        ctx.fillText(
            "IOff" +
                ": " +
                (this.unknownProperties.includes("IOff")
                    ? "unknown"
                    : this.IOff + "A"),
            -25,
            -10
        );
        ctx.fillText(
            "freq" +
                ": " +
                (this.unknownProperties.includes("freq")
                    ? "unknown"
                    : this.freq + "Hz"),
            -25,
            10
        );
        ctx.fillText(
            this.unknownProperties.includes("waveform")
                ? "unknown"
                : this.waveform,
            -25,
            30
        );
        ctx.fillText(this.ON ? "ON" : "OFF", -25, 50);

        ctx.restore();
    }
}

class Resistor extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        R = 10,
        PMax = 10
    ) {
        super(put, x, y, angle, "resistor");
        this.connectorsXY = [
            { x: -45, y: 0 },
            { x: 45, y: 0 },
        ];
        this.R = R;
        this.U = 0;
        this.I = 0;
        this.P = 0;
        this.PMax = PMax;
        Object.assign(this.propertiesEditType, {
            R: { type: "range", min: 0, max: 1000, step: 1 },
            PMax: { type: "range", min: 0, max: 1000, step: 1 },
        });
        this.unknownProperties = expCfg.expMode
            ? ["U", "I", "P"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.rect(-25, -10, 50, 20);
        ctx.stroke();

        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.moveTo(-25, 0);
        ctx.lineTo(-45, 0);
        ctx.moveTo(25, 0);
        ctx.lineTo(45, 0);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.strokeRect(-45, -15, 90, 30);
        }
        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();
        ctx.textAlign = "center";

        ctx.fillText(
            "R" +
                this.NoResistor +
                ": " +
                (this.unknownProperties.includes("R")
                    ? "unknown"
                    : this.R + "Ω"),
            0,
            -15
        );
        ctx.restore();

        this.P = this.U * this.I;
        if (this.P > this.PMax) {
            this.brokenType = 1;
        }
    }
}

class Capacitor extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        C = 1
    ) {
        super(put, x, y, angle, "capacitor");
        this.connectorsXY = [
            { x: -30, y: 0 },
            { x: 30, y: 0 },
        ];
        this.C = C;
        this.U = 0;
        this.I = 0;
        Object.assign(this.propertiesEditType, {
            C: { type: "range", min: 0, max: 1000, step: 1 },
        });
        this.unknownProperties = expCfg.expMode
            ? ["U", "I"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        //触发区域
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(angleToArc(this.angle));
        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.5;

        ctx.beginPath();

        ctx.rect(-10, -25, 20, 50);
        ctx.stroke();
        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.restore();

        //图形
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.moveTo(-10, 25);
        ctx.lineTo(-10, -25);
        ctx.moveTo(10, 25);
        ctx.lineTo(10, -25);
        ctx.moveTo(-10, 0);
        ctx.lineTo(-30, 0);
        ctx.moveTo(10, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 0;
            ctx.strokeRect(-30, -25, 60, 50);
        }

        ctx.restore();

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();
        ctx.textAlign = "center";

        ctx.fillText(
            "C" +
                this.NoCapacitor +
                ": " +
                (this.unknownProperties.includes("C")
                    ? "unknown"
                    : this.C + "F"),
            0,
            -27
        );
        ctx.restore();
    }
}

class Inductor extends CircuitElement {
    constructor(
        put = false,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        angle = 0,
        L = 1
    ) {
        super(put, x, y, angle, "inductor");
        this.connectorsXY = [
            { x: -50, y: 0 },
            { x: 50, y: 0 },
        ];
        this.L = L;
        this.U = 0;
        this.I = 0;
        Object.assign(this.propertiesEditType, {
            L: { type: "range", min: 0, max: 1000, step: 1 },
        });
        this.unknownProperties = expCfg.expMode
            ? ["U", "I"]
            : this.unknownProperties;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        //触发区域
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(angleToArc(this.angle));
        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.5;

        ctx.beginPath();

        ctx.rect(-40, -10, 80, 20);
        ctx.stroke();
        var isMouseIn = ctx.isPointInPath(x, y);

        ctx.restore();

        //图形
        ctx.save();

        this.setCtx();

        ctx.beginPath();

        ctx.arc(-30, 0, 10, Math.PI, 0);
        ctx.arc(-10, 0, 10, Math.PI, 0);
        ctx.arc(10, 0, 10, Math.PI, 0);
        ctx.arc(30, 0, 10, Math.PI, 0);
        ctx.moveTo(-40, 0);
        ctx.lineTo(-50, 0);
        ctx.moveTo(40, 0);
        ctx.lineTo(50, 0);
        ctx.stroke();

        if (this.put && isMouseIn) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 0;
            ctx.strokeRect(-50, -15, 100, 30);
        }

        ctx.restore();

        

        return isMouseIn;
    }
    drawText() {
        ctx.save();

        this.setTextCtx();
        ctx.textAlign = "center";

        ctx.fillText(
            "L" +
                this.NoInductor +
                ": " +
                (this.unknownProperties.includes("L")
                    ? "unknown"
                    : this.L + "H"),
            0,
            -17
        );
        ctx.restore();
    }
}

class Wire {
    constructor(
        put = false,
        shift = false,
        loc1 = { x: null, y: null },
        loc2 = { x: null, y: null },
        color = "black"
    ) {
        this.class = "wire";
        this.name = "wire " + circuitState.No.wire;
        this.ID = "wire " + circuitState.No.wire;
        this.No = circuitState.No.wire;
        this.R = 0.000001;
        this.U = 0;
        this.I = 0;
        this.put = put;
        this.loc1 = loc1;
        this.loc2 = loc2;
        this.shift = shift;
        this.turningPoints = [{}, {}];
        this.color = color;
        this.deletable = true;
        this.brokenType = -1;
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        var x1 = this.loc1.x,
            y1 = this.loc1.y,
            x2 = this.loc2.x,
            y2 = this.loc2.y;

        this.turningPoints.splice(0, 1, {
            x: x1,
            y: y1,
            shift: false,
        });
        this.turningPoints.splice(this.turningPoints.length - 1, 1, {
            x: x2,
            y: y2,
            shift: this.shift,
        });
        ctx.save();
        //line
        ctx.strokeStyle = this.color;
        if (this.put == false) {
            ctx.strokeStyle = "#C0C0C0";
        }
        ctx.lineWidth = 2;

        ctx.beginPath();

        // if (this.shift) {
        //     ctx.moveTo(x1, y1);
        //     ctx.lineTo(x2, y1);
        //     ctx.lineTo(x2, y2);
        //     ctx.stroke();
        // } else {
        //     ctx.moveTo(x1, y1);
        //     ctx.lineTo(x1, y2);
        //     ctx.lineTo(x2, y2);
        //     ctx.stroke();
        // }

        ctx.moveTo(x1, y1);
        for (let index = 1; index < this.turningPoints.length; index++) {
            const point = this.turningPoints[index];
            const pointLast = this.turningPoints[index - 1];
            if (point.shift) {
                ctx.lineTo(point.x, pointLast.y);
                ctx.lineTo(point.x, point.y);
            } else {
                ctx.lineTo(pointLast.x, point.y);
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();

        //connector1
        ctx.beginPath();
        ctx.arc(x1, y1, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fill();

        var isMouseIn1 = (x - x1) ** 2 + (y - y1) ** 2 < 45;

        if ((x - x1) ** 2 + (y - y1) ** 2 < 36) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.arc(x1, y1, 6, 0, 2 * Math.PI);
            ctx.stroke();
        }
        //connector2
        ctx.beginPath();
        ctx.arc(x2, y2, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.fill();

        var isMouseIn2 = (x - x2) ** 2 + (y - y2) ** 2 < 45;

        if ((x - x2) ** 2 + (y - y2) ** 2 < 36) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.arc(x2, y2, 6, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();

        return { isMouseIn1, isMouseIn2 };
    }
}

class Connector {
    constructor(
        No = circuitState.No.connector,
        x = canvasInfo.position.x,
        y = canvasInfo.position.y,
        belongTo = null
    ) {
        this.class = "connector";
        this.name = "connector " + No;
        this.ID = "connector " + No;
        this.No = No;
        this.R = 0;
        this.I = 0;
        this.connectWith = [];
        this.connectedWires = [];
        this.x = x;
        this.y = y;
        this.belongTo = belongTo;
        this.unknownProperties = expCfg.expMode ? ["R", "I"] : [];
    }
    draw(x = canvasInfo.position.x, y = canvasInfo.position.y) {
        ctx.save();

        ctx.beginPath();
        ctx.translate(this.x, this.y);

        ctx.arc(0, 0, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();

        var isMouseIn = (x - this.x) ** 2 + (y - this.y) ** 2 < 45;

        if ((isMouseIn = (x - this.x) ** 2 + (y - this.y) ** 2 < 36)) {
            ctx.strokeStyle = "#C0C0C0";
            ctx.lineWidth = 1;
            ctx.arc(0, 0, 6, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.font = "15px Cambria Math";
        ctx.fillStyle = "black";
        ctx.fillText(this.No, 0, -5);

        ctx.restore();
        return isMouseIn;
    }
}
