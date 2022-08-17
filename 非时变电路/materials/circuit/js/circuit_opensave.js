const buttonSave = document.getElementById("save"),
    buttonOpen = document.getElementById("open"),
    bugout = new debugout();

openFile = function (event) {
    var input = event.target,
        fr = new FileReader();
    fr.readAsText(input.files[0], "UTF-8");
    fr.onload = function () {
        try {
            let stateJSON = JSON.parse(fr.result, (key, value) => {
                return value === "Infinity" ? Infinity : value;
            });
            circuitState.getStateFrom(stateJSON);
        } catch (err) {
            alert(`无法打开文件，可能文件内容与格式不符或文件已损坏\n${err}`);
            circuitState.getStateFrom(initState);
        }
    };
};

buttonSave.onclick = function (e) {
    let stateStr = JSON.stringify(copyObject(), (key, value) => {
        return value === Infinity ? "Infinity" : value;
    });
    bugout.clear();
    bugout.log(stateStr);
    bugout.downloadLog();
    bugout.clear();
};
