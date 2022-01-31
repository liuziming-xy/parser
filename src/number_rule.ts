const decimalDigit = `(0|1|2|3|4|5|6|7|8|9)`;
const decimalDigits = `(${decimalDigit}(${decimalDigit}|_${decimalDigit})*)`;
const binaryDigit = '(0|1)';
const binaryDigits = `(${binaryDigit}(${binaryDigit}|_${binaryDigit})*)`;
const octalDigit = '(0|1|2|3|4|5|6|7)';
const octalDigits = `(${octalDigit}(${octalDigit}|_${octalDigit})*)`;
const hexDigit = '(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f|A|B|C|D|E|F)';
const hexDigits = `(${hexDigit}(${hexDigit}|_${hexDigit})*)`;

const nonZeroDigit = '(1|2|3|4|5|6|7|8|9)';
const nonOctalDecimalInteger = `(0(8|9)|(0${octalDigit}(${octalDigit})*(8|9)))(${decimalDigit})*`;
const decimalInteger = `(0|${nonZeroDigit}|((${nonZeroDigit}|(${nonZeroDigit}_))${decimalDigits})|${nonOctalDecimalInteger})`;
const exponent = `(e|E)(((+|-)${decimalDigits})|${decimalDigits})`;
const decimal1 = `((${decimalInteger}.${decimalDigits}${exponent})|(${decimalInteger}.${decimalDigits})|(${decimalInteger}.))`;
const decimal2 = `((.${decimalDigits}${exponent})|(.${decimalDigits}))`;
const decimal3 = `((${decimalInteger}${exponent})|${decimalInteger})`;

// 十进制数字
const decimal = `(${decimal1}|${decimal2}|${decimal3})`;
// 十进制BigInt
const decimalBigInteger = `((0|${nonZeroDigit}|((${nonZeroDigit}|(${nonZeroDigit}_))${decimalDigits}))n)`;
// 非十进制数字
const nonDecimal = `((0(b|B)${binaryDigits})|(0(o|O)${octalDigits})|(0(x|X)${hexDigits}))`;
// 非十进制BigInt
const nonDecimalBigInt = `(${nonDecimal}n)`;
// 过时的八进制数字
const legacyOctal = `(0${octalDigit}(${octalDigit})*)`;

// 数字表示法
export const numberRegex = `((${decimal})|(${decimalBigInteger})|(${nonDecimal})|(${nonDecimalBigInt})|(${legacyOctal}))`;
