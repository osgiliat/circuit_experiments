/**获取(x,y)坐标以(x0,y0)为中心顺时针旋转angle弧度后的坐标。
 *  (x0,y0)默认为(0,0)，即canvas的左上角
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} x0 默认为0
 * @param {Number} y0 默认为0
 * @param {Number} angle 角度，弧度制
 * @returns {Object} 旋转后的坐标
 */
function getRotatedPoint(x, y, x0 = 0, y0 = 0, angle) {
    let rotateMatrix = [
            [Math.cos(angle), -Math.sin(angle)],
            [Math.sin(angle), Math.cos(angle)],
        ],
        newPoint = dot(rotateMatrix, [[x - x0], [y - y0]]);
    return { x: x0 + newPoint[0][0], y: y0 + newPoint[1][0] };
}

/**将字符串的首字母大写
 *
 * @param {String} str 原始字符串
 * @returns {String} 首字母大写字符串
 */
function upperFirst(str) {
    return str === "" ? str : str[0].toUpperCase() + str.substring(1);
}

/**将字符串的首字母小写
 *
 * @param {String} str 原始字符串
 * @returns {String} 首字母小写字符串
 */
function lowerFirst(str) {
    return str === "" ? str : str[0].toLowerCase() + str.substring(1);
}

/**角度弧度转换
 *
 * @param {Number} value 角度大小
 * @param {Boolean} isArc 输入的角度大小是否为弧度制，默认为否
 * @returns {Number} 转换后的角度大小
 */
function angleToArc(value, isArc = false) {
    if (isArc) {
        return (value * 180) / Math.PI;
    } else {
        return (value * Math.PI) / 180;
    }
}

/**判断两个量是否相等（对象和数组的键值相同即相等）
 *
 * @param {*} a
 * @param {*} b
 * @param {Boolean} disorder 数组无序比较
 * @returns {Boolean}
 */
function equal(a, b, disorder = false) {
    if (typeof a !== typeof b) {
        return false;
    } else if (a.constructor.name !== b.constructor.name) {
        return false;
    } else if (a === b) {
        return true;
    } else if (typeof a === "object") {
        if (a instanceof Array) {
            if (a.length !== b.length) {
                return false;
            } else {
                if (disorder) {
                    let newA = copyObject(a);
                    let newB = copyObject(b);
                    for (let indexA = 0; indexA < newA.length; indexA++) {
                        for (let indexB = 0; indexB < newB.length; indexB++) {
                            if (equal(newA[indexA], newB[indexB], disorder)) {
                                newA.splice(indexA, 1);
                                indexA--;
                                newB.splice(indexB, 1);
                                indexB--;
                            }
                        }
                    }
                    if (newA.length === 0 && newB.length === 0) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    for (let index = 0; index < a.length; index++) {
                        if (!equal(a[index], b[index], disorder)) {
                            return false;
                        }
                    }
                }
            }
        } else {
            let aProps = Object.getOwnPropertyNames(a);
            let bProps = Object.getOwnPropertyNames(b);
            if (aProps.length !== bProps.length) return false;
            for (let prop in a) {
                if (b.hasOwnProperty(prop)) {
                    if (typeof a[prop] === "object") {
                        if (!equal(a[prop], b[prop], disorder)) return false;
                    } else if (a[prop] !== b[prop]) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        return true;
    } else {
        return false;
    }
}
