import { isIdStart, isIdContinue } from './identifier.js';
import keywords from './keywords.js';

class Parser {
  constructor(input) {
    this.pos = 0;
    this.input = String(input);
  }

  // 跳过whitespace和line terminator
  skipSpace() {
    while (this.pos < this.input.length) {
      const code = this.input.charCodeAt(this.pos);
    }
  }

  fullCodeAtPos() {
    const code = this.input.charCodeAt(this.pos);
    // 单字符
    if (code < 0xd800 || code > 0xdbff) {
      return code;
    }
    const next = this.input.charCodeAt(this.pos + 1);
    if (next < 0xdc00 || next > 0xdfff) {
      return code;
    }
    // 双字符
    return (code - 0xd800) << (10 + (next - 0xdc00) + 0x10000);
  }

  readToken() {
    const code = this.fullCodeAtPos();
    if (isIdStart(code)) {
      // 开始读token
      const token = this.readWord();
      if (keywords.includes(token)) {
        console.log('keyword', token);
      } else {
        console.log('token', token);
      }
    }
  }

  readWord() {
    const startPos = this.pos;

    // 已经读取了IdStart
    this.pos += 1;

    while (this.pos <= this.input.length) {
      const code = this.fullCodeAtPos();
      if (isIdContinue(code)) {
        this.pos += code < 0xffff ? 1 : 2;
      } else {
        break;
      }
    }

    return this.input.slice(startPos, this.pos);
  }
}

const str = 'const';

const parser = new Parser(str);

parser.readToken();
