import fs from 'fs';

const stream = await fs.createReadStream('../data/id_continue');

const lineTmpBuf = Buffer.allocUnsafe(12);
let lineIndex;
let lineArr;
const lineRes = [];
const finalRes = [];

function resetLineData() {
  lineIndex = 0;
  lineTmpBuf.fill(0);
  lineArr = new Uint16Array(lineTmpBuf);
}

resetLineData();

const tmpBuf = Buffer.allocUnsafe(5);
let index;
let arr;

function resetTmpData() {
  index = 0;
  tmpBuf.fill(0);
  arr = new Uint16Array(tmpBuf);
}

resetTmpData();

function handleTmpData() {
  let start = arr.length - 1;
  // 最后一位是0
  if (arr[start] === 0) {
    start = arr.length - 2;
  }

  let res = 0;

  for (let i = start; i >= 0; i--) {
    let current;
    if (arr[i] >= 48 && arr[i] <= 57) {
      current = arr[i] - 48;
    }
    if (arr[i] >= 65 && arr[i] <= 70) {
      current = arr[i] - 65 + 10;
    }

    res += Math.pow(16, start - i) * current;
  }

  resetTmpData();

  return res;
}

function handleLineTmpBufData() {
  let split = false;
  let res;

  for (let i = 0; i < lineArr.length; i++) {
    const lineCode = lineArr[i];
    if (lineCode === 45) {
      // 分隔符
      split = true;
      // 计算低位数据
      res = handleTmpData();
    } else if (lineCode === 0) {
      if (split) {
        let tmpRes = res;
        res = handleTmpData();
        finalRes.push(`[${tmpRes},${res}]`);
      } else {
        res = handleTmpData();
        finalRes.push(`[${res}]`);
      }

      res = undefined;
      break;
    } else {
      arr[index++] = lineCode;
    }
  }

  resetLineData();
}

stream.on('data', buf => {
  buf.forEach(code => {
    if (code === 10 || code === 13) {
      handleLineTmpBufData();
      return;
    }
    lineArr[lineIndex++] = code;
  });
});

stream.on('end', () => {
  //
  handleLineTmpBufData();

  fs.writeFile('../id_continue.js', finalRes.toString(), () => {});
});
