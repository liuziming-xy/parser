import IdStartArray from './data/id_start.js';
import IdContinueArray from './data/id_continue.js';

export function isIdStart(code) {
  // $
  if (code === 36) {
    return true;
  }
  // _
  if (code === 95) {
    return true;
  }
  for (let i = 0; i < IdStartArray.length; i++) {
    const [start, end] = IdStartArray[i];
    if (!end) {
      if (code > start) {
        continue;
      }
      return code === start;
    } else {
      if (code > end) {
        continue;
      }
      return code >= start && code <= end;
    }
  }
  return false;
}

export function isIdContinue(code) {
  // $
  if (code === 36) {
    return true;
  }
  for (let i = 0; i < IdContinueArray.length; i++) {
    const [start, end] = IdContinueArray[i];
    if (!end) {
      if (code > start) {
        continue;
      }
      return code === start;
    } else {
      if (code > end) {
        continue;
      }
      return code >= start && code <= end;
    }
  }
  return false;
}
