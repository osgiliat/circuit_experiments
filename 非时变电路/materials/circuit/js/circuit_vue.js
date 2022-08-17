/**元素属性的可编辑类型代码 */
const propertyTypeCode = {
    uneditable: 0, // 不可编辑的类型，如No，ID，class等
    select: 1,
    checkbox: 2,
    range: 3,
    number: 4,
    text: 5,
};
/**元素属性的默认可编辑类型 */
const defaultPropertiesEditType = {
    name: { type: "text" },
    ID: { type: "uneditable" },
    No: { type: "uneditable" },
    class: { type: "uneditable" },
    x: { type: "number" },
    y: { type: "number" },
    angle: { type: "range", min: 0, max: 360, step: 1 },
    color: { type: "uneditable" },
    connectors: { type: "uneditable" },
    deletable: { type: "checkbox" },
    brokenType: {
        type: "select",
        multiple: false,
        options: [-1, 0, 1, 2, 3],
    },
    R: { type: "uneditable" },
    U: { type: "uneditable" },
    I: { type: "uneditable" },
    P: { type: "uneditable" },
    PMax: { type: "uneditable" },
    C: { type: "uneditable" },
    L: { type: "uneditable" },
    measuringRange: { type: "uneditable" },
    precision: { type: "uneditable" },
    unit: { type: "uneditable" },
    ON: { type: "checkbox" },
    UAmp: { type: "uneditable" },
    UOff: { type: "uneditable" },
    freq: { type: "uneditable" },
    waveform: { type: "uneditable" },
    unknownProperties: {
        type: "select",
        multiple: true,
        options: [],
    },
};
/**提交实验结果的正确性对应的显示样式 */
const correctness = {
    undetermined: "",
    right: "has-success",
    wrong: "has-error",
    unfinished: "has-warning",
};
/**元件类的汉化名称 */
const classZH = {
    element: "元件",
    voltmeter: "电压表",
    resistor: "电阻",
    ammeter: "电流表",
    powerVDC: "直流电压源",
    powerIDC: "直流电流源",
    powerVAC: "交流电压源",
    powerIAC: "交流电流源",
    capacitor: "电容",
    inductor: "电感",
    // newElementClass: "新的元件种类",
    connector: "接线柱",
    wire: "导线",
};

var circuitState = new CircuitState();
var questions = [];
var sidenavDetailShow = [];
var checkingGenerated = false;
var setMaxDialog = {
    isShow: false,
    isShowClass: "",
    max: copyObject(circuitState.max),
};
var expCfg = {
    url: "",
    expMode: false,
    type: "",
};
var markBrokenBtn = {
    show: true,
    active: false,
    mode: "broken",
    description: {
        broken: { text: "标记为损坏（红）", color: "red" },
        intact: { text: "标记为完好（蓝）", color: "blue" },
        cancel: { text: "取消标记（黑）", color: "black" },
    },
};

Object.keys(setMaxDialog.max).forEach((key) => {
    setMaxDialog.max[key] =
        setMaxDialog.max[key] === Infinity ? -1 : setMaxDialog.max[key];
});

new Vue({
    el: "#app",
    data: function () {
        return {
            circuitState,
            classZH,
            sidenavDetailShow,
            propertyTypeCode,
            submitDialog: {
                isShow: false,
                isShowClass: "",
                openBtnShow: true,
                btnInfo: "确认",
                btnClass: ["btn btn-primary"],
            },
            checkingDialog: {
                isShow: false,
                isShowClass: "",
                openBtnShow: true,
                btnInfo: "确认",
                btnClass: ["btn btn-primary"],
                checkingNumber: 0,
            },
            markBrokenBtn,
            setMaxDialog,
            questions,
            propertiesEditType: {},
            expCfg,
        };
    },
    methods: {
        getPropertiesEditType(element) {
            let keys = Object.keys(element);
            keys.forEach((key) => {
                this.propertiesEditType[key] =
                    element.propertiesEditType[key] ||
                    defaultPropertiesEditType[key];
                if (this.propertiesEditType[key].type === "hide") {
                    return;
                }
                if (element.unknownProperties.includes(key)) {
                    this.propertiesEditType[key] = { type: "uneditable" };
                } else if (key === "unknownProperties") {
                    if (defaultPropertiesEditType[key].type === "uneditable") {
                        this.propertiesEditType[key] = { type: "uneditable" };
                    } else {
                        let allProperties = Object.keys(element);
                        allProperties.splice(
                            allProperties.indexOf("unknownProperties"),
                            1
                        );
                        this.propertiesEditType[key] = {
                            type: "select",
                            multiple: true,
                            options: allProperties,
                        };
                    }
                }
            });
        },
        formatProperty(key, element, fix) {
            if (!element["unknownProperties"].includes(key)) {
                if (typeof value === "number") {
                    return parseFloat(element[key].toFixed(fix));
                } else {
                    return element[key];
                }
            } else {
                return "unknown";
            }
        },
        sortElement(element) {
            this.getPropertiesEditType(element);
            let keys = Object.keys(element);
            keys.sort((second, first) => {
                return (
                    propertyTypeCode[this.propertiesEditType[first].type] -
                    propertyTypeCode[this.propertiesEditType[second].type]
                );
            });
            let sortedElement = {};
            keys.forEach((key) => {
                sortedElement[key] = element[key];
            });
            return sortedElement;
        },
        addDetailShow(No) {
            if (!sidenavDetailShow.includes(No)) {
                sidenavDetailShow.push(No);
            } else {
                sidenavDetailShow.splice(sidenavDetailShow.indexOf(No), 1);
            }
        },
        editingAnswer(question) {
            question.correctness = correctness.undetermined;
            this.resetDialogBtn("submitDialog");
        },
        submitAnswer() {
            let unfinishedCount = 0;
            this.questions.forEach((question) => {
                let isUnfinished = false;
                isUnfinished = question.answer.length === 0;
                if (isUnfinished) {
                    question.correctness = correctness.unfinished;
                    unfinishedCount++;
                }
            });
            if (unfinishedCount === 0) {
                let wrongCount = 0;
                this.questions.forEach((question) => {
                    let isCorrect = equal(
                        question.answer,
                        eval(question.rightAnswer),
                        true
                    );
                    if (isCorrect) {
                        question.correctness = correctness.right;
                    } else {
                        question.correctness = correctness.wrong;
                        wrongCount++;
                    }
                });
                if (wrongCount === 0) {
                    this.submitDialog.btnClass.splice(1, 2, [
                        "btn-success",
                        "animated tada",
                    ]);
                    this.submitDialog.btnInfo = "回答正确！";
                } else {
                    this.submitDialog.btnClass.splice(1, 2, [
                        "btn-danger",
                        "animated shake",
                    ]);
                    [].splice();
                    this.submitDialog.btnInfo = "回答存在错误！请重新作答";
                }
            } else {
                this.submitDialog.btnClass.splice(1, 2, [
                    "btn-warning",
                    "animated shake",
                ]);
                this.submitDialog.btnInfo = "请输入你的回答";
            }
        },
        checkingGenerate() {
            if (
                this.checkingDialog.checkingNumber >
                circuitState.count.element + circuitState.count.wire
            ) {
                this.checkingDialog.btnClass.splice(1, 2, [
                    "btn-warning",
                    "animated shake",
                ]);
                this.checkingDialog.btnInfo =
                    "损坏数量不能超过元件和导线的总数";
                return;
            } else if (this.checkingDialog.checkingNumber <= 0) {
                this.checkingDialog.btnClass.splice(1, 2, [
                    "btn-warning",
                    "animated shake",
                ]);
                this.checkingDialog.btnInfo = "损坏数量应大于0";
                this.checkingDialog.checkingNumber = 0;
                return;
            }
            if (
                confirm(
                    `即将随机将${this.checkingDialog.checkingNumber}个元件或导线进行损坏，是否继续？损坏生成完毕后将无法修改。您可以取消操作后重新设置`
                )
            ) {
                generateBroken(this.checkingDialog.checkingNumber);
                checkingGenerated = true;
                circuitState.elements.forEach((element)=>{element.deletable = false});
                circuitState.elements.forEach((wire)=>{wire.deletable = false});
                allStates.clear();
                Object.keys(circuitState.max).forEach((element) => {
                    if (element === "element" || element === "connector") {
                        return;
                    } else {
                        circuitState.max[element] = 0;
                    }
                });
                circuitState.max.voltmeter = circuitState.count.voltmeter + 1;
                circuitState.max.wire = circuitState.count.wire + 2;
                initState.getStateFrom(copyObject());
                this.checkingDialog.openBtnShow = false;
                this.submitDialog.openBtnShow = true;
                markBrokenBtn.show = true;
                this.closeDialog("checkingDialog");
            }
        },
        closeDialog(dialog) {
            this[dialog].isShowClass = "";
            const timer = setTimeout(() => {
                this[dialog].isShow = false;
                clearTimeout(timer);
            }, 300);
        },
        showDialog(dialog) {
            this[dialog].isShow = true;
            const timer = setTimeout(() => {
                this[dialog].isShowClass = "is-show";
                clearTimeout(timer);
            }, 20);
        },
        resetDialogBtn(dialog) {
            this[dialog].btnInfo = "确认";
            this[dialog].btnClass.splice(
                0,
                this[dialog].btnClass.length,
                "btn btn-primary"
            );
        },
        setMax() {
            for (const key in this.setMaxDialog.max) {
                const value = this.setMaxDialog.max[key];
                circuitState.max[key] = value < 0 ? Infinity : value;
            }
            this.closeDialog("setMaxDialog");
        },
        selectOnCanvas(answer) {
            this.closeDialog("submitDialog");
            let self = this;
            $("#circuit").on(
                "click",
                (selectHandler = function () {
                    if (canvasInfo.target.NoElement !== -1) {
                        answer.type = "element";
                        answer.No =
                            circuitState.elements[
                                canvasInfo.target.NoElement
                            ].No;
                        self.showDialog("submitDialog");
                        $("#circuit").off("click", selectHandler);
                    } else if (canvasInfo.target.NoWire !== -1) {
                        answer.type = "wire";
                        answer.No =
                            circuitState.wires[canvasInfo.target.NoWire].No;
                        self.showDialog("submitDialog");
                        $("#circuit").off("click", selectHandler);
                    }
                })
            );
        },
        markBroken(mode, isBtn = false) {
            if (isBtn) {
                markBrokenBtn.active = !markBrokenBtn.active;
            } else {
                markBrokenBtn.active = true;
            }
            markBrokenBtn.mode = mode;
            if (markBrokenBtn.active) {
                $("#circuit").on(
                    "click",
                    (markBrokenHandler = function () {
                        if (canvasInfo.target.NoElement !== -1) {
                            circuitState.elements[
                                canvasInfo.target.NoElement
                            ].color = markBrokenBtn.description[mode].color;
                            markBrokenBtn.active = false;
                            $("#circuit").off("click", markBrokenHandler);
                        } else if (canvasInfo.target.NoWire !== -1) {
                            circuitState.wires[canvasInfo.target.NoWire].color =
                                markBrokenBtn.description[mode].color;
                            markBrokenBtn.active = false;
                            $("#circuit").off("click", markBrokenHandler);
                        }
                    })
                );
            } else {
                $("#circuit").off("click", markBrokenHandler);
            }
        },
    },
    computed: {
        elementsRemaining() {
            let elementsRemaining = {};
            Object.keys(circuitState.max).forEach((key) => {
                elementsRemaining[key] = {
                    number: circuitState.max[key] - circuitState.count[key],
                    display:
                        circuitState.max[key] === Infinity
                            ? ""
                            : `x${
                                  circuitState.max[key] -
                                  circuitState.count[key]
                              }`,
                };
            });
            return elementsRemaining;
        },
    },
    mounted() {
        let paramsUrl = window.location.search;
        let paramsObj = {};
        let paramsArr = paramsUrl.substr(1).split("&");
        paramsArr.forEach((paramObjStr) => {
            paramsObj[paramObjStr.split("=")[0]] = paramObjStr.split("=")[1];
        });
        expCfg.url = Object.keys(paramsObj).includes("expCfgUrl")
            ? paramsObj.expCfgUrl
            : "";
        /**读取预先设计的电路 */
        $.getJSON(expCfg.url, (data) => {
            initState.getStateFrom(data.initState);
            circuitState.getStateFrom(copyObject(initState));
            data.questions.forEach((question) => {
                if (
                    question.input.type === "select" &&
                    question.input.multiple
                ) {
                    question.answer = [];
                } else if (question.input.type === "selectBroken") {
                    question.answer = [{}];
                } else {
                    question.answer = "";
                }
                question.correctness = correctness.undetermined;
                question.input.options = eval(question.input.options);
                questions.push(question);
            });
            document.title = `电路虚拟仿真实验-${data.name}`;
            expCfg.expMode = data.expMode;
            if (expCfg.expMode) {
                defaultPropertiesEditType.deletable = { type: "hide" };
                defaultPropertiesEditType.brokenType = { type: "hide" };
                defaultPropertiesEditType.unknownProperties = {
                    type: "hide",
                };
                defaultPropertiesEditType.R= { type: "hide" };
                defaultPropertiesEditType.U= { type: "hide" };
                defaultPropertiesEditType.I= { type: "hide" };
                defaultPropertiesEditType.P= { type: "hide" };
                defaultPropertiesEditType.PMax= { type: "hide" };
                defaultPropertiesEditType.C= { type: "hide" };
                defaultPropertiesEditType.L= { type: "hide" };
            }
            expCfg.type = data.type;
            this.submitDialog.openBtnShow =
                expCfg.type === "check" ? false : true;
            this.checkingDialog.openBtnShow =
                expCfg.type === "check" ? true : false;
            markBrokenBtn.show = expCfg.type === "check" ? false : true;
        });
    },
});
