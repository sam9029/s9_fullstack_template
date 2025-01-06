/**
 * precisionMath 包含加减乘除四个方法，能确保浮点数运算不丢失精度
 *
 * ** method **
 *  add / subtract / multiply /divide
 * 
 * 0.1 + 0.2 = 0.30000000000000004 （多了 0.00000000000004）
 * 0.3 - 0.1 = 0.19999999999999998
 * 19.9 * 100 = 1989.9999999999998 （少了 0.0000000000002）
 * 1.1 / 100 = 0.011000000000000001
 *
 * @explame precisionMath.add(0.1, 0.2) >> 0.3
 * @explame precisionMath.multiply(19.9, 100) >> 1990
 *
 */
export const PrecisionMath = function() {
    
    /*
     * 判断obj是否为一个整数
     */
    function isInteger(obj) {
        return Math.floor(obj) === obj
    }
    
    /*
     * 将一个浮点数转成整数，返回整数和倍数。如 3.14 >> 314，倍数是 100
     * @param floatNum {number} 小数
     * @return {object}
     *   {times:100, num: 314}
     */
    function toInteger(floatNum) {
        let ret = {times: 1, num: 0}
        let isNegative = floatNum < 0
        if (isInteger(floatNum)) {
            ret.num = floatNum
            return ret
        }
        let strfi  = floatNum + ''
        let dotPos = strfi.indexOf('.')
        let len    = strfi.slice(dotPos+1).length
        let times  = Math.pow(10, len)
        let intNum = parseInt(Math.abs(floatNum) * times + 0.5, 10)
        ret.times  = times
        if (isNegative) {
            intNum = -intNum
        }
        ret.num = intNum
        return ret
    }
    
    /*
     * 核心方法，实现加减乘除运算，确保不丢失精度
     * 思路：把小数放大为整数（乘），进行算术运算，再缩小为小数（除）
     *
     * @param a {number} 运算数1
     * @param b {number} 运算数2
     * @param op {string} 运算类型，有加减乘除（add/subtract/multiply/divide）
     *
     */
    function operation(a, b, op) {
        let o1 = toInteger(a)
        let o2 = toInteger(b)
        let n1 = o1.num
        let n2 = o2.num
        let t1 = o1.times
        let t2 = o2.times
        let max = t1 > t2 ? t1 : t2
        let result = null
        switch (op) {
            case 'add':
                if (t1 === t2) { // 两个小数位数相同
                    result = n1 + n2
                } else if (t1 > t2) { // o1 小数位 大于 o2
                    result = n1 + n2 * (t1 / t2)
                } else { // o1 小数位 小于 o2
                    result = n1 * (t2 / t1) + n2
                }
                return result / max
            case 'subtract':
                if (t1 === t2) {
                    result = n1 - n2
                } else if (t1 > t2) {
                    result = n1 - n2 * (t1 / t2)
                } else {
                    result = n1 * (t2 / t1) - n2
                }
                return result / max
            case 'multiply':
                result = (n1 * n2) / (t1 * t2)
                return result
            case 'divide':
                result = (n1 / n2) * (t2 / t1)
                return result
        }
    }
    
    // 加减乘除的四个接口
    function add(a, b) {
        return operation(a, b, 'add')
    }
    function subtract(a, b) {
        return operation(a, b, 'subtract')
    }
    function multiply(a, b) {
        return operation(a, b, 'multiply')
    }
    function divide(a, b) {
        return operation(a, b, 'divide')
    }
    
    // exports
    return {
        add: add,
        subtract: subtract,
        multiply: multiply,
        divide: divide
    }
};

/**
 * 对原生 toFixed 修复
 * 
 * 原生 toFixed (某些情况)不会对小数的尾部进行四舍五入（Chrome） 
 * 如下：
 * ~~~ 1.335.toFixed(2) // 1.33 ~~~
 * 
 * @param {*} num 
 * @param {*} s 
 * @returns 
 */
export function toFixedAndRound(num, s = 2) {
    var times = Math.pow(10, s)
    // 如果小数部分大于或等于 0.5，则进位；如果小于 0.5，则舍去。
    var des = num * times + 0.5
    des = parseInt(des, 10) / times
    return des + ''
}