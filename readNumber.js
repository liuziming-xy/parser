function createError(str) {
  return new SyntaxError(str);
}

function isDecimalDigit(code) {
  return code >= 48 && code <= 57;
}

function isBinaryDigit(code) {
  return code === 48 || code === 49;
}

function isOctalDigit(code) {
  return code >= 48 && code <= 55;
}

function isHexDigit(code) {
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102);
}

// digits
function readDigits(input, pos, match) {
  const len = input.length;
  const start = pos;
  let end = start;
  // 初始状态
  let state = 0;
  // 结束状态
  const finalStates = [1];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (match(code)) {
        state = 1;
        end++;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code === 95) {
        state = 2;
        end++;
      } else if (match(code)) {
        end++;
      } else {
        break;
      }
    } else if (state === 2) {
      if (match(code)) {
        state = 1;
        end++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let error;
  let res;

  // 在结束状态
  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

// exponent
function readExponent(input, pos) {
  const len = input.length;
  const start = pos;
  let end = start;
  // 初始状态
  let state = 0;
  const finalStates = [3];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (code === 69 || code === 101) {
        // Ee
        state = 1;
        end++;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code === 43 || code === 45) {
        // +-
        state = 2;
        end++;
        continue;
      }
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 3;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 2) {
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 3;
        end = res.end;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let error;
  let res;

  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

// decimalInteger
function readDecimalInteger(input, pos) {
  const len = input.length;
  const start = pos;
  let end = start;
  let state = 0;
  const finalStates = [1, 2, 3, 6, 7, 8];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (code === 48) {
        state = 1;
        end++;
      } else if (code >= 49 && code <= 57) {
        state = 2;
        end++;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code >= 48 && code <= 55) {
        state = 4;
        end++;
      } else if (code === 56 || code === 57) {
        state = 3;
        end++;
      } else {
        break;
      }
    } else if (state === 2) {
      if (code === 95) {
        state = 5;
        end++;
        continue;
      }
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 6;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 3) {
      if (isDecimalDigit(code)) {
        state = 7;
        end++;
      } else {
        break;
      }
    } else if (state === 4) {
      if (code >= 48 && code <= 55) {
        end++;
      } else if (code === 56 || code === 57) {
        state = 8;
        end++;
      } else {
        break;
      }
    } else if (state === 5) {
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 6;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 7) {
      if (isDecimalDigit(code)) {
        end++;
      } else {
        break;
      }
    } else if (state === 8) {
      if (isDecimalDigit(code)) {
        end++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let error;
  let res;

  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

function readDecimals(input, pos) {
  const len = input.length;
  const start = pos;
  let end = start;
  let state = 0;
  const finalStates = [1, 3, 4, 5, 6, 7, 8];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (code === 46) {
        //.
        state = 2;
        end++;
        continue;
      }
      const [err, res] = readDecimalInteger(input, end);
      if (!err) {
        state = 1;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code === 46) {
        state = 3;
        end++;
        continue;
      }
      const [err, res] = readExponent(input, end);
      if (!err) {
        state = 4;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 2) {
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 5;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 3) {
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 6;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 5) {
      const [err, res] = readExponent(input, end);
      if (!err) {
        state = 7;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 6) {
      const [err, res] = readExponent(input, end);
      if (!err) {
        state = 8;
        end = res.end;
      } else {
        break;
      }
    }
  }

  let error;
  let res;

  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

// legacyOctalInteger
function readLegacyOctalInteger(input, pos) {
  const len = input.length;
  const start = pos;
  let end = start;
  let state = 0;
  const finalStates = [2];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (code === 48) {
        state = 1;
        end++;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code >= 48 && code <= 55) {
        state = 2;
        end++;
      } else {
        break;
      }
    } else if (state === 2) {
      if (code >= 48 && code <= 55) {
        state = 2;
        end++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let error;
  let res;

  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

// nonDecimals
function readNonDecimals(input, pos) {
  const len = input.length;
  const start = pos;
  let end = start;
  let state = 0;
  const finalStates = [5, 6, 7];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (code === 48) {
        state = 1;
        end++;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code === 66 || code === 98) {
        // bB
        state = 2;
        end++;
      } else if (code === 79 || code === 111) {
        // oO
        state = 3;
        end++;
      } else if (code === 88 || code === 120) {
        // xX
        state = 4;
        end++;
      } else {
        break;
      }
    } else if (state === 2) {
      const [err, res] = readDigits(input, end, isBinaryDigit);
      if (!err) {
        state = 5;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 3) {
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 6;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 4) {
      const [err, res] = readDigits(input, end, isHexDigit);
      if (!err) {
        state = 7;
        end = res.end;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let error;
  let res;

  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

// decimalBigInteger
function readDecimalBigInteger(input, pos) {
  const len = input.length;
  const start = pos;
  let end = start;
  let state = 0;
  const finalStates = [6];

  while (end < len) {
    const code = input.charCodeAt(end);
    if (state === 0) {
      if (code === 48) {
        state = 1;
        end++;
      } else if (code >= 49 && code <= 57) {
        state = 2;
        end++;
      } else {
        break;
      }
    } else if (state === 1) {
      if (code === 110) {
        // n
        state = 6;
        end++;
      } else {
        break;
      }
    } else if (state === 2) {
      if (code === 95) {
        state = 4;
        end++;
        continue;
      }
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 3;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 3) {
      if (code === 110) {
        // n
        state = 6;
        end++;
      } else {
        break;
      }
    } else if (state === 4) {
      const [err, res] = readDigits(input, end, isDecimalDigit);
      if (!err) {
        state = 5;
        end = res.end;
      } else {
        break;
      }
    } else if (state === 5) {
      if (code === 110) {
        // n
        state = 6;
        end++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  let error;
  let res;

  if (finalStates.includes(state)) {
    res = { start, end };
  } else {
    error = createError();
  }

  return [error, res];
}

// number
function readNumber(input, pos) {
  let err;
  let res;

  [err, res] = readNonDecimals(input, pos);

  if (!err) {
    const next = input.charCodeAt(res.end);
    const num = input.slice(res.start, res.end).replace(/_/g, '');
    if (next === 110) {
      return BigInt(num);
    } else {
      return parseInt(num);
    }
  } else {
    [err, res] = readLegacyOctalInteger(input, pos);
    if (!err) {
      return parseInt(input.slice(res.start, res.end).replace(/_/g, ''), 8);
    } else {
      [err, res] = readDecimalBigInteger(input, pos);
      if (!err) {
        return BigInt(input.slice(res.start, res.end - 1).replace(/_/g, ''));
      } else {
        [err, res] = readDecimals(input, pos);
        if (!err) {
          return parseFloat(input.slice(res.start, res.end).replace(/_/g, ''));
        } else {
          throw createError('unexpected number');
        }
      }
    }
  }
}

// test
const source = '1_3_2_8.3_2_9e+0_13_4';
const number = readNumber(source, 0);
console.log(number, typeof number);
