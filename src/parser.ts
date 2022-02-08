// 文法符号类型
enum SymType {
  // 终结符
  Terminal = 0,
  // 非终结符
  NonTerminal = 1,
  // 空串
  Epsilon = 2,
}

// 文法符号
type Symbolic = {
  // 类型
  type: SymType;
  // 值
  value: string;
};

// 文法产生式表示形式
// @example
// A -> B
// B -> B + B
// B -> id
type Production = {
  // 左手表达式
  header: Symbolic;
  // 右手表达式
  body: Symbolic[];
};

// 空符号
const SymbolEpsilon: Symbolic = {
  type: SymType.Epsilon,
  value: '',
};

function first(cfg: Production[], sym: Symbolic): Map<Symbolic, Symbolic> {
  const result = new Map<Symbolic, Symbolic>();
  if (sym.type === SymType.Terminal || sym.type === SymType.Epsilon) {
    // 终结符的first集就是它本身
    result.set(sym, sym);
    return result;
  }
  // 非终结符
  for (let i = 0; i < cfg.length; i++) {
    const production = cfg[i];
    if (production.header === sym) {
      let hasEpsilon = false;
      let epsilonCount = 0;
      for (let j = 0; j < production.body.length; j++) {
        // 遍历产生式右侧
        const rightSym = production.body[j];
        const res = first(cfg, rightSym);
        // 遍历first集,如果存在epsilon,
        const iter = res.entries();
        for (const [key, val] of iter) {
          // 如果是空字符
          if (key === SymbolEpsilon) {
            hasEpsilon = true;
          } else {
            result.set(key, val);
          }
        }
        // 如果当前产生式没有产生空字符
        if (hasEpsilon === false) {
          break;
        }
        // 当前文法符号产生空字符
        epsilonCount++;
        // 从当前的产生式能推导出空字符串
        if (epsilonCount === production.body.length) {
          result.set(SymbolEpsilon, SymbolEpsilon);
        }
      }
    }
  }
  return result;
}

const SymbolA = { type: SymType.NonTerminal, value: 'A' };
const SymbolB = { type: SymType.NonTerminal, value: 'B' };
const SymbolC = { type: SymType.NonTerminal, value: 'C' };
const SymbolInt = { type: SymType.Terminal, value: 'int' };
const SymbolPlus = { type: SymType.Terminal, value: '+' };
const SymbolLeftGroup = { type: SymType.Terminal, value: '(' };
const SymbolRightGroup = { type: SymType.Terminal, value: ')' };

const cfg = [
  {
    header: SymbolA,
    body: [SymbolB],
  },
  {
    header: SymbolA,
    body: [SymbolB, SymbolPlus, SymbolA],
  },
  {
    header: SymbolB,
    body: [SymbolInt],
  },
  {
    header: SymbolB,
    body: [SymbolLeftGroup, SymbolA, SymbolRightGroup],
  },
];

// LL(1) left to right, left most, (1)个word
// first集的计算不允许左递归
const fi = first(cfg, SymbolA);
console.log(fi);

// follow集
function follow(cfg: Production[], sym: Symbolic): Map<Symbolic, Symbolic> {
  // Follow集求解方式
  // 遍历产生式右侧，寻找到sym符号下一个符号的Fist集，将下一个符号除了e的终结符添加到当前符号的Follow集中
  // 如果下一个符号的First集中包含e，说明该集合可以被e替代，故当前sym的Follow集还需要添加下一个符号的Follow集
  const result = new Map<Symbolic, Symbolic>();

  for (const production of cfg) {
    // 遍历产生式右侧，找到
    for (let i = 0; i < production.body.length; i++) {
      const current = production.body[i];
      if (current === sym) {
        if (i === production.body.length - 1) {
          // 最后一个元素
          continue;
        }
        // 当前符号是给出的符号，判断下一个字符的first集
        const next = production.body[i + 1];
        const nextFirst = first(cfg, next);
        // 遍历first集合，如果first集中包含epsilon，按照定义来说，可以省略下一个符号，所以需要计算
        // 下一个符号的follow集
        let hasEpsilon = false;
        for (const [key, val] of nextFirst) {
          if (key === SymbolEpsilon) {
            hasEpsilon = true;
          } else {
            result.set(key, val);
          }
        }
        if (hasEpsilon) {
          const nextFollow = follow(cfg, next);
          for (const [nextK, nextV] of nextFollow) {
            result.set(nextK, nextV);
          }
        }
      }
    }
  }

  return result;
}

const fo = follow(cfg, SymbolPlus);
console.log(fo);

// TODO:
// 1. 遍历产生式的左边，求出每个非终结符的First集和Follow集
// 2. 构建LL(1)表，使用查表法非回溯的获取解析方式
