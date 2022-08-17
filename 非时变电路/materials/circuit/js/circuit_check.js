/**随机产生brokenCount数量的元件和导线损坏
 *
 * @param {Number} brokenCount 要产生的损坏数目
 * @returns {Object} 损坏的元件数组和导线数组组成的对象
 */
function generateBroken(brokenCount) {
    let NoBroken = {
            element: [],
            wire: [],
        },
        brokenELementsCount = 0,
        brokenWiresCount = 0;

    let availableBrkEleCount = [];
    for (let i = 0; i <= circuitState.count.element; i++) {
        if (
            0 <= brokenCount - i &&
            brokenCount - i <= circuitState.count.wire
        ) {
            availableBrkEleCount.push(i);
        }
    }
    brokenELementsCount =
        availableBrkEleCount[
            Math.floor(Math.random() * availableBrkEleCount.length)
        ];
    brokenWiresCount = brokenCount - brokenELementsCount;

    NoBroken.element = produceRandoms(
        brokenELementsCount,
        circuitState.count.element
    );
    NoBroken.wire = produceRandoms(brokenWiresCount, circuitState.count.wire);

    NoBroken.element.forEach((No) => {
        circuitState.elements[No].brokenType = Math.floor(Math.random() * 4);
    });
    NoBroken.wire.forEach((No) => {
        circuitState.wires[No].brokenType = Math.floor(Math.random() * 4);
    });

    return NoBroken;
}

function getBroken(cirState = circuitState) {
    let broken = [];
    cirState.elements.forEach((element) => {
        if (element.brokenType !== -1) {
            broken.push({
                type: "element",
                No: element.No,
                brokenType: element.brokenType,
            });
        }
    });
    cirState.wires.forEach((wire) => {
        if (wire.brokenType !== -1) {
            broken.push({
                type: "wire",
                No: wire.No,
                brokenType: wire.brokenType,
            });
        }
    });
    return broken;
}

/**在[0, range)范围内随机产生n个不重复整数
 *
 * @param {Number} n 要产生的不重复随机整数的数量
 * @param {Number} range 要产生的不重复随机整数的上限（不包含）
 * @returns {Array.<Number>} n个不重复随机整数组成的数组
 */
function produceRandoms(n, range) {
    if (n > range) {
        throw "'n' should not be higher than 'range'";
    }
    let randomsArr = [];
    for (let i = 0; i < n; i++) {
        let num = Math.floor(Math.random() * range);
        if (!randomsArr.includes(num)) {
            randomsArr.push(num);
        } else {
            i--; // 存在num则令i-1，增加一次循环次数
        }
    }
    return randomsArr;
}
