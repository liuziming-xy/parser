import { isIdStart, isIdContinue } from './identifier.js';
import keywords from './keywords.js';
import { isWhiteSpace, isLineTerminator } from './data/whitespace.js';
import fs from 'fs/promises';

class Parser {
  constructor(input) {
    this.pos = 0;
    this.input = String(input);
  }

  // 跳过单行注释
  skipSingleLineComment() {
    const start = this.pos;
    this.pos += 2;
    let code = this.input.charCodeAt(this.pos);
    // 任何不是换行符的字符
    while (this.pos < this.input.length && !isLineTerminator(code)) {
      this.pos++;
      code = this.input.charCodeAt(this.pos);
    }
    console.log('singleLineComment', this.input.slice(start, this.pos));
  }

  // 跳过多行注释
  skipMultiLineComment() {
    const start = this.pos;
    this.pos += 2;
    while (this.pos < this.input.length) {
      const code = this.input.charCodeAt(this.pos);
      const next = this.input.charCodeAt(this.pos + 1);

      // 遇到 */, 多行注释闭合
      if (code === 42 && next === 47) {
        this.pos += 2;
        console.log('multiLineComment', this.input.slice(start, this.pos));
        return;
      }
      this.pos++;
    }
    // 读到最后没有闭合多行注释
    throw new SyntaxError('comment block is not close');
  }

  // 跳过token分隔符
  skipSpace() {
    while (this.pos < this.input.length) {
      const code = this.input.charCodeAt(this.pos);
      if (isWhiteSpace(code)) {
        this.pos++;
        continue;
      } else if (isLineTerminator(code)) {
        this.pos++;
        continue;
      } else if (code === 47) {
        const next = this.input.charCodeAt(this.pos + 1);
        if (next === 47) {
          // 单行注释
          this.skipSingleLineComment();
        } else if (next === 42) {
          // 多行注释
          this.skipMultiLineComment();
        } else {
          break;
        }
      } else {
        break;
      }
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

  nextToken() {
    this.skipSpace();
    this.readToken();
  }

  readToken() {
    const code = this.fullCodeAtPos();
    if (isIdStart(code)) {
      // 开始读token
      const token = this.readWord();
      if (keywords.includes(token)) {
        console.log('keyword', token);
      } else {
        console.log('identifier', token);
      }
    } else {
      if (code) {
        this.readPunctuator();
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

  // 读取分隔符
  readPunctuator() {
    const ch = this.input[this.pos];
    const code = ch.charCodeAt();

    switch (code) {
      // (
      case 40:
      // )
      case 41:
      // ,
      case 44:
      // :
      case 58:
      // ;
      case 59:
      // [
      case 91:
      // ]
      case 93:
      // {
      case 123:
      // }
      case 125:
      // ~
      case 126: {
        // 单字符直接输出
        console.log('operator', ch);
        this.pos++;
        break;
      }

      case 60: {
        // < << <= <<=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 60 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 60 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 62: {
        // > >> >>> >= >>= >>>=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);
        const next3 = this.input.charCodeAt(this.pos + 3);

        if (next1 === 62 && next2 === 62 && next3 === 61) {
          this.pos += 4;
        } else if (next1 === 62 && (next2 === 61 || next2 === 62)) {
          this.pos += 3;
        } else if (next1 === 61 || next1 === 62) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 61: {
        // = == === =>
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 61 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 61 || next1 === 62) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 33: {
        // ! != !==
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 61 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 43: {
        // + += ++
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);

        if (next1 === 43 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }

        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 45: {
        // - -= --
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);

        if (next1 === 45 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }

        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 42: {
        // * ** *= **=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 42 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 42 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 37: {
        // % %=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);

        if (next1 === 37 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }

        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 38: {
        // & && &= &&=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 38 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 38 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 124: {
        // | || |= ||=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 124 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 124 || next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 94: {
        // ^ ^=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);

        if (next1 === 61) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 63: {
        // ? ?? ?. ??=
        const start = this.pos;
        const next1 = this.input.charCodeAt(this.pos + 1);
        const next2 = this.input.charCodeAt(this.pos + 2);

        if (next1 === 63 && next2 === 61) {
          this.pos += 3;
        } else if (next1 === 63 || next1 === 46) {
          this.pos += 2;
        } else {
          this.pos++;
        }
        console.log('operator', this.input.slice(start, this.pos));
        break;
      }

      case 46: {
        // . ...
        const start = this.pos;
        const next = this.input.charCodeAt(this.pos + 1);
        // 读取number
        if (next >= 48 && next <= 57) {
          this.readNumber();
        } else {
          const next1 = this.input.charCodeAt(this.pos + 2);

          if (next === 46 && next1 === 46) {
            this.pos += 3;
          } else {
            this.pos++;
          }

          console.log('operator', this.input.slice(start, this.pos));
        }
        break;
      }

      case 47: {
        // / /=
        const start = this.pos;
        const next = this.input.charCodeAt(this.pos + 1);
        if (next === 42 || next === 47) {
          break;
        } else {
          if (next === 61) {
            this.pos += 2;
          } else {
            this.pos++;
          }

          console.log('operator', this.input.slice(start, this.pos));
        }
        break;
      }
    }
  }

  // 读取NumberLiteral
  readNumber() {}

  // 读取StringLiteral
  readString() {}
}

const str = await fs.readFile('./test', { encoding: 'utf8' });

const parser = new Parser(str);

parser.nextToken();
parser.nextToken();
parser.nextToken();
parser.nextToken();
