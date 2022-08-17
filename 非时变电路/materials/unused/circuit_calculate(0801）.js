var associationmatrix = [],
    branchmatrix = [],
    flag = false,
    CalculateResult = [];

//获取各接线柱的连接情况表
function getlinkmatrix() {
    var links = [];
    for (var i = 0; i < circuitState.connectors.length; i++) {
        var arr2 = {};
        arr2.No = circuitState.connectors[i].No;
        arr2.connector = circuitState.connectors[i].connectwith;
        arr2.state = false;
        links.push(arr2);
    }
    return links;
}

//判定接线柱是否是节点
function getnodelist() {
    var connectormatrix = new Array(circuitState.connectors.length).fill(0),
        node = [],
        links = getlinkmatrix();
    for (var i = 0; i < circuitState.connectors.length; i++) {
        for (var j = 0; j < links[i].connector.length; j++)
            connectormatrix[getIndexFromNo(links[i].connector[j])]++;
    }
    for (var k = 0; k < connectormatrix.length; k++) {
        if (connectormatrix[k] > 1 || connectormatrix[k]==0) {
            node.push(circuitState.connectors[k].No);
        }
    }
    return node;
}

//电源的接线柱是否是节点
function powerconnector() {
    var node = getnodelist(),
        nodelist = [];
    for (var i = 0; i < circuitState.elements.length; i++) {
        if (circuitState.elements[i] instanceof Power) {
            //找到电源
            for (var j = 0; j < 2; j++) {
                var powerconnect = [];
                powerconnect.push(
                    node.includes(circuitState.elements[i].connectors[j])
                ); //判断节点列表里有没有电源接线柱
                for (var k of circuitState.connectors[
                    getIndexFromNo(circuitState.elements[i].connectors[j])
                ].connectwith) {
                    //判断节点列表里有没有与该接线柱连接的接线柱
                    powerconnect.push(node.includes(k));
                }
                if (powerconnect.includes(true) === false) {
                    nodelist.push(circuitState.elements[i].connectors[j]);
                }
            }
        }
    }
    nodelist.push.apply(nodelist, node); //此步骤在节点多时可能造成浪费，待优化
    return nodelist;
}

function finalnodelist() {//剔除虚假节点
    var connectormatrix = new Array(circuitState.connectors.length).fill(0),
        fakenode = [],
        linkmatrix = getlinkmatrix(),
        nodelist = powerconnector();
    for (var i1 = 0; i1 < circuitState.connectors.length; i1++) {//找出无连接的接线柱
        for (var j1 = 0; j1 < linkmatrix[i1].connector.length; j1++)
            connectormatrix[getIndexFromNo(linkmatrix[i1].connector[j1])]++;
    }
    for (var k1 = 0; k1 < connectormatrix.length; k1++) {
        if (connectormatrix[k1] == 0) {
            fakenode.push(circuitState.connectors[k1].No);
        }
    }
    for (var i4 = 0; i4 < nodelist.length; i4++) {
        if (fakenode.includes(nodelist[i4])) {
            nodelist.splice(i4, 1);
            i4--;
        }
    }
    return nodelist;
}

//检查节点是否有损坏的接线柱
function checknodelist() {
    var nodelist = powerconnector(),
        brokennode=[],
        n = 0;
    for (var i = 0; i < circuitState.elements.length; i++) {
        if (circuitState.elements[i].break == true ) {
            if (circuitState.elements[i].break == 2) {
                n = circuitState.elements[i].connectors[0];
            }
            else if (circuitState.elements[i].break == 3) {
                n = circuitState.elements[i].connectors[0];
            }
            if (nodelist.includes(n)) {
                brokennode.push(n);
                circuitState.elements[i].break = false;
            }
        }
    }
    return brokennode;
}

//获取支路
function getbranches() {
    var branches = [],
        repeat = [],
        k = 0,
        t = 0,
        m = 0,
        connectormatrix = new Array(circuitState.connectors.length).fill(0),
        fakenode=[],
        linkmatrix = getlinkmatrix(),
        elementsmatrix = circuitState.elements,
        wirematrix = circuitState.wires,
        nodelist = powerconnector();

    for (var i = 0; i < nodelist.length; i++) {
        var linknolist = linkmatrix[getIndexFromNo(nodelist[i])].connector;
        for (var j = 0; j < linknolist.length + 1; j++) {//遍历与节点相邻的接线柱
            var branch = {};
            (branch.node = []), (branch.elements = []),(branch.wires=[]);
            if (j < linknolist.length) {//对单元件支路的特判
                k = linknolist[j];
                branch.node.push(nodelist[i]);
                branch.node.push(k);
                t = 0;
            } else {
                branch.node.push(nodelist[i]);
                k = nodelist[i];
                if (k % 2 == 0) {
                    branch.elements.push(
                        elementsmatrix[
                            getIndexFromNo(k / 2, circuitState.elements)
                        ]
                    );
                    k = k + 1;
                    branch.node.push(k);
                } else if (k % 2 == 1) {
                    k = k - 1;
                    branch.elements.push(
                        elementsmatrix[
                            getIndexFromNo(k / 2, circuitState.elements)
                        ]
                    );
                    branch.node.push(k);
                }
                t = 1;
            }
            while (//遍历寻找多元件支路
                !nodelist.includes(k) &&
                linkmatrix[getIndexFromNo(k)].state == false
            ) {
                if (t % 2 == 0) {
                    m = k;
                    if (k % 2 == 0) {
                        branch.elements.push(
                            elementsmatrix[
                                getIndexFromNo(k / 2, circuitState.elements)
                            ]
                        );
                        k = k + 1;
                        branch.node.push(k);
                    } else if (k % 2 == 1) {
                        k = k - 1;
                        branch.elements.push(
                            elementsmatrix[
                                getIndexFromNo(k / 2, circuitState.elements)
                            ]
                        );
                        branch.node.push(k);
                    }
                    linkmatrix[getIndexFromNo(m)].state = true;
                } else if (t % 2 == 1) {
                    k = linkmatrix[getIndexFromNo(k)].connector[0];
                    branch.node.push(k);
                }
                t++;
            }
            if (linkmatrix[getIndexFromNo(k)].state == false) {
                branches.push(branch);
            }
        }
    }

    for (var n0 = branches.length - 1; n0 >= 0; n0--) {
        //去除之前重复添加的支路（元件本身是一个支路及两个节点间无元件的支路会重复，需要删除）
        if (
            repeat.includes(branches[n0].elements[0]) == false &&
            branches[n0].elements[0] != undefined
        ) {
            repeat.push(branches[n0].elements[0]);
        } else {
            if (branches[n0].elements[0] != undefined) {
                branches.splice(n0, 1);
            } else {
                if (branches[n0].elements[0] == undefined) {
                    repeat.push(branches[n0].node[0]);
                }
            }
        }
        if (repeat.includes(branches[n0].node[1]) == true) {
            branches.splice(n0, 1);
        }
    }

    for (var i1 = 0; i1 < circuitState.connectors.length; i1++) {//找出无连接的接线柱
        for (var j1 = 0; j1 < linkmatrix[i1].connector.length; j1++)
            connectormatrix[getIndexFromNo(linkmatrix[i1].connector[j1])]++;
    }
    for(var k1 = 0; k1 < connectormatrix.length; k1++) {
        if (connectormatrix[k1] == 0) {
            fakenode.push(circuitState.connectors[k1].No);
        }
    }

    for (var i2 = 0; i2 < branches.length; i2++) {
        for (var i3 = 0; i3 < branches[i2].node.length; i3++) {
            if (fakenode.includes(branches[i2].node[i3])) {
                branches.splice(i2, 1);
                i3 = 0;
                i2--;
            }
        }
    }

    for (var i4 = 0; i4 < nodelist.length; i4++) {
        if (fakenode.includes(nodelist[i4])) {
            nodelist.splice(i4, 1);
            i4--;
        }
    }

    for (var n1 = 0; n1 < branches.length; n1++) {//将导线加入支路
        for (var n2 = 0; n2 < branches[n1].node.length; n2++) {
            for (var n3 = 0; n3 < wirematrix.length; n3++){
                t1 = n2 + 1;
                if (branches[n1].node[n2] == wirematrix[n3].loc1.No && branches[n1].node[t1] == wirematrix[n3].loc2.No) {
                    branches[n1].wires.push(wirematrix[n3]);
                }
                else {
                    if (branches[n1].node[n2] == wirematrix[n3].loc2.No && branches[n1].node[t1] == wirematrix[n3].loc1.No) {
                        branches[n1].wires.push(wirematrix[n3]);
                    }
                }
            }            
        }
    }
    return branches;
}

//生成关联矩阵
function getA() {
    var branches = getbranches(),
        nodelist = finalnodelist(),
        A = [];
    for (var i = 0; i < nodelist.length - 1; i++) {
        Arow = [];
        for (var j = 0; j < branches.length; j++) {
            if (branches[j].node[0] == nodelist[i]) {
                Arow[j] = 1;
            } else if (branches[j].node.slice(-1) == nodelist[i]) {
                Arow[j] = -1;
            } else if (
                branches[j].node[0] != nodelist[i] &&
                branches[j].node.slice(-1) != nodelist[i]
            ) {
                Arow[j] = 0;
            }
        }
        A.push(Arow);
    }
    return A;
}

//生成电导对角矩阵(完成对元件损坏的判断)
function Gdiag() {
    var result = [],
        Bnode = checknodelist(),
        g = 0,
        G = [],
        Gm = [],
        nG = associationmatrix[0].length;
    for (var k = 0; k < nG; k++) {
        g = 0;
        for (var k1 = 0; k1 < branchmatrix[k].elements.length; k1++) {
            if (branchmatrix[k].elements[k1].break == false) {
                g = g + branchmatrix[k].elements[k1].R;
            }
            else {
                if (branchmatrix[k].elements[k1] instanceof voltmeter) {
                    if (branchmatrix[k].elements[k1].breaktype == 0) {
                        g = g + 0;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 1) {
                        g = g + Infinity;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 2||branchmatrix[k].elements[k1].breaktype == 3) {
                        g=g+0.4;
                    }
                }
                else if (branchmatrix[k].elements[k1] instanceof amperemeter) {
                    if (branchmatrix[k].elements[k1].breaktype == 0) {
                        g = g + 0;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 1) {
                        g = g + Infinity;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 2||branchmatrix[k].elements[k1].breaktype == 3) {
                        g=g+0.4;
                    }
                }
                else if (branchmatrix[k].elements[k1] instanceof amperemeter) {
                    if (branchmatrix[k].elements[k1].breaktype == 0) {
                        g = g + 0;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 1) {
                        g = g + Infinity;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 2||branchmatrix[k].elements[k1].breaktype == 3) {
                        g=g+0.4;
                    }
                }
                else if (branchmatrix[k].elements[k1] instanceof resistor) {
                    if (branchmatrix[k].elements[k1].breaktype == 0) {
                        g = g + 0;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 1) {
                        g = g + Infinity;
                    }
                    else if (branchmatrix[k].elements[k1].breaktype == 2||branchmatrix[k].elements[k1].breaktype == 3) {
                        g=g+0.4;
                    }
                }
            }
        }
        for (var k2 = 0; k2 < branchmatrix[k].wires.length; k2++) {
            if (branchmatrix[k].wires[k2].break == true) {
                if (branchmatrix[k].wires[k2].breaktype == 0) {
                    g = g + 0.5;
                }
                else if (branchmatrix[k].wires[k2].breaktype == 1) {
                    g = g + Infinity;
                }
            }
            else {
                g = g + branchmatrix[k].wires[k2].R;
            }
        }
        for (var k3 = 0; k3 < Bnode.length; k3++) {//节点接线柱损坏带来的阻值增加
            if (branchmatrix[k].node.includes(Bnode[k3])){
                g = g + 0.2;
            }
        }
        if (g != 0) {
            G[k] = 1 / g;
        }
        else {
            G[k] = 0;
        }
    }
    for (var i = 0; i < nG; i++) {
        Gm = [];
        for (var j = 0; j < nG; j++) {
            if (i === j) Gm[j] = G[i];
            else Gm[j] = 0;
        }
        result.push(Gm);
    }
    return result;
}

//生成电压源矩阵(完成对元件损坏的判断)
function Usmatrix() {
    var Us = [],
        t1 = 0,
        t2 = 0;
    for (i1 = 0; i1 < associationmatrix[0].length; i1++) {
        if (branchmatrix[i1].elements[0] instanceof Power) {
            for (i2 = 0; i2 < branchmatrix[i1].node.length; i2++) {
                if (
                    branchmatrix[i1].elements[0].connectors[0] ==
                    branchmatrix[i1].node[i2]
                ) {
                    t1 = i2;
                }
                if (
                    branchmatrix[i1].elements[0].connectors[1] ==
                    branchmatrix[i1].node[i2]
                ) {
                    t2 = i2;
                }
            }
            if (t1 < t2) {
                Us[i1] = [branchmatrix[i1].elements[0].U];
            } else {
                Us[i1] = [branchmatrix[i1].elements[0].U * -1];
            }
            if (branchmatrix[i1].elements[0].break == true) {
                if (branchmatrix[k].elements[k1].breaktype == 0) {
                    Us[i1] = Us[i1] *0.96;//电压偏低
                }
                else if (branchmatrix[k].elements[k1].breaktype == 1) {
                    Us[i1] = Us[i1]*1.05;//电压偏高
                }
            }
        } else {
            Us[i1] = [0];
        }
    }
    return Us;
}

//生成电流源矩阵
function Ismatrix() {
    var Is = [],
        t1 = 0,
        t2 = 0;
    for (i1 = 0; i1 < associationmatrix[0].length; i1++) {
        if (branchmatrix[i1].elements[0] instanceof Power) {
            for (i2 = 0; i2 < branchmatrix[i1].node.length; i2++) {
                if (
                    branchmatrix[i1].elements[0].connectors[0] ==
                    branchmatrix[i1].node[i2]
                ) {
                    t1 = i2;
                }
                if (
                    branchmatrix[i1].elements[0].connectors[1] ==
                    branchmatrix[i1].node[i2]
                ) {
                    t2 = i2;
                }
            }
            if (t1 < t2) {
                Is[i1] = [branchmatrix[i1].elements[0].I];
            } else {
                Is[i1] = [branchmatrix[i1].elements[0].I * -1];
            }
        } else {
            Is[i1] = [0];
        }
    }
    return Is;
}

//电路计算
function calculate() {
    var Us = Usmatrix(),
        Usn = [],
        Is = Ismatrix(),
        Isi = [],
        A = associationmatrix,
        AT = transpose(associationmatrix),
        G = Gdiag(),
        C = [],
        C11 = [],
        C12 = [],
        C21 = [],
        C22 = [],
        D = [],
        Un = [],
        temp = [],
        C11 = dot(dot(A, G), AT);
    for (i3 = 0; i3 < Us.length; i3++) {
        if (Us[i3][0] !== 0) {
            C21.push(AT[i3]);
            Usn.push(Us[i3]);
        }
    }
    C12 = transpose(C21);
    C22 = zero(C21.length, C12[0].length);
    for (var k = 0; k < C11.length + C21.length; k++) {
        if (k < C11.length) {
            C[k] = C11[k].concat(C12[k]);
        } else {
            C[k] = C21[k - C11.length].concat(C22[k - C11.length]);
        }
    }
    D = dot(A, Is).concat(Usn);
    temp = dot(inv(C), D);
    for (var row = 0; row < A.length; row++) {
        Un.push(temp[row]);
    }
    CalculateResult.U = dot(AT, Un);
    CalculateResult.Us = Un;
    CalculateResult.I = dot(G, CalculateResult.U);
    return CalculateResult;
}

//判断电表在支路中的正负
function checkdirection() {
    var nodelist = finalnodelist();
    calculate();
    var t1 = 0,
        t2 = 0,
        t3 = 0,
        t4 = 0,
        t5 = 0,
        t6 = 0;
    for (i1 = 0; i1 < associationmatrix[0].length; i1++) {
        for (i2 = 0; i2 < branchmatrix[i1].elements.length; i2++) {
            if (
                branchmatrix[i1].elements[i2] instanceof Amperemeter ||
                branchmatrix[i1].elements[i2] instanceof Voltmeter
            ) {
                t = 0;
                for (i3 = 0; i3 < branchmatrix[i1].node.length; i3++) {
                    if (
                        branchmatrix[i1].elements[i2].connectors[0] ==
                        branchmatrix[i1].node[i3]
                    ) {
                        t1 = i3;
                    }
                    if (
                        branchmatrix[i1].elements[i2].connectors[1] ==
                        branchmatrix[i1].node[i3]
                    ) {
                        t2 = i3;
                    }
                }
                for (i4 = 0; i4 < nodelist.length; i4++) {
                    if (branchmatrix[i1].node[0] == nodelist[i4]) {
                        t3 = i4;
                    }
                    if (
                        branchmatrix[i1].node[
                            branchmatrix[i1].node.length - 1
                        ] == nodelist[i4]
                    ) {
                        t4 = i4;
                    }
                }
                if (CalculateResult.Us[t3] == undefined) {
                    t5 = 0;
                    t6 = CalculateResult.Us[t4][0];
                } else if (CalculateResult.Us[t4] == undefined) {
                    t6 = 0;
                    t5 = CalculateResult.Us[t3][0];
                } else {
                    t5 = CalculateResult.Us[t3][0];
                    t6 = CalculateResult.Us[t4][0];
                }
                if (t1 < t2) {
                    t++;
                }
                if (t5 > t6) {
                    t++;
                }
                if (t % 2 == 1) {
                    branchmatrix[i1].elements[i2].rd = -1;
                } else {
                    branchmatrix[i1].elements[i2].rd = 1;
                }
            } else {
                branchmatrix[i1].elements[i2].rd = 1;
            }
        }
    }
}

//将计算结果返回至对象
function getResults() {
    associationmatrix = getA();
    branchmatrix = getbranches();
    checkdirection();
    for (var i = 0; i < branchmatrix.length; i++) {
        for (j = 0; j < branchmatrix[i].elements.length; j++) {
            var indexOfEles = getIndexFromNo(
                branchmatrix[i].elements[j].No,
                circuitState.elements
            );
            if (branchmatrix[i].elements[j] instanceof Power) {
                // do nothing
            } else if (branchmatrix[i].elements[j] instanceof Capacitor) {
                circuitState.elements[indexOfEles].U = Math.abs(
                    CalculateResult.U[i]
                );
            } else {
                circuitState.elements[indexOfEles].U =
                    Math.abs(
                        CalculateResult.I[i] *
                            circuitState.elements[indexOfEles].R
                    ) * circuitState.elements[indexOfEles].rd; //过于繁琐，待优化
                circuitState.elements[indexOfEles].I =
                    Math.abs(CalculateResult.I[i]) *
                    circuitState.elements[indexOfEles].rd;
            }
        }
    }
}
