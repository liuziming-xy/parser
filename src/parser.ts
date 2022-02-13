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
const fi = first(cfg, SymbolPlus);
// console.log(fi);

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
// console.log(fo);

// 具有相同的header(产生式左侧)的分成一组
type GroupProduction = {
  header: Symbolic;
  prods: Production[];
};

function getGroupProduction(cfg: Production[]): GroupProduction[] {
  const map = new Map<Symbolic, Production[]>();
  for (const production of cfg) {
    // 如果当前key不存在
    const { header } = production;
    if (!map.has(header)) {
      map.set(header, []);
    }
    map.get(header).push(production);
  }

  const result: GroupProduction[] = [];

  for (const [header, prods] of map.entries()) {
    result.push({ header, prods });
  }
  return result;
}

function simpleProduction(cfg: Production[]): Production[] {
  return cfg;
}

// 消除所有产生式的左递归
// 首先对所有产生式采用groupProduction
// 按照所给的顺序，将所有的产生式替换为已经出现过的产生式, 再次遍历如果出现直接左递归，
function removeLeftRecursive(cfg: Production[]): Production[] {
  const result: Production[] = [];
  const groups = getGroupProduction(cfg);

  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < i; j++) {
      // 创建一个新的production
      const newPros: Production[] = [];

      // 遍历当前符号的每一个产生式
      for (let t = 0; t < groups[i].prods.length; t++) {
        // 如果是终结符直接跳过
        if (groups[i].prods[t].body[0].type === SymType.Terminal) {
          newPros.push(groups[i].prods[t]);
          continue;
        }
        // 如果是直接左递归, 将当前的产生式直接添加到新的产生式上边
        if (groups[i].prods[t].body[0] === groups[i].header) {
          newPros.push(groups[i].prods[t]);
          continue;
        }

        // 非终结符 -> 开始substitute
        if (groups[i].prods[t].body[0] === groups[j].header) {
          // 将符号的所有产生式都替换成新表达式
          for (let c = 0; c < groups[j].prods.length; c++) {
            newPros.push({
              header: groups[i].prods[t].header,
              body: groups[j].prods[c].body.concat(groups[i].prods[t].body.slice(1)),
            });
          }
        } else {
          newPros.push(groups[i].prods[t]);
        }
      }

      // 完成这一次的遍历后，替换当前符号的productions
      groups[i].prods = newPros;
    }

    // 结束每一轮这样的遍历之后，当前遍历符号不存在
    const hasLeftRecursive = groups[i].prods.some(
      production => production.body[0] === groups[i].header,
    );

    if (!hasLeftRecursive) {
      for (const production of groups[i].prods) {
        result.push(production);
      }
      continue;
    }

    // 创建一个新符号
    const newSym: Symbolic = {
      type: SymType.NonTerminal,
      value: `${groups[i].header.value}'`,
    };
    // 包含直接左递归(direct left recursive)
    for (let x = 0; x < groups[i].prods.length; x++) {
      let newPro: Production;

      if (groups[i].prods[x].body[0] === groups[i].header) {
        newPro = {
          header: newSym,
          body: groups[i].prods[x].body.slice(1).concat([newSym]),
        };
      } else {
        // 当前表达式不包含直接左递归
        // 空表达式
        if (groups[i].prods[x].body[0].type === SymType.Epsilon) {
          newPro = {
            header: groups[i].header,
            body: [newSym],
          };
        } else {
          newPro = {
            header: groups[i].header,
            body: groups[i].prods[x].body.concat([newSym]),
          };
        }
      }
      result.push(newPro);
    }
    // 需要添加一个空产生式
    const newPro: Production = {
      header: newSym,
      body: [SymbolEpsilon],
    };
    result.push(newPro);
  }

  return simpleProduction(result);
}

const SymbolS: Symbolic = { type: SymType.NonTerminal, value: 'S' };
const SymbolQ: Symbolic = { type: SymType.NonTerminal, value: 'Q' };
const SymbolR: Symbolic = { type: SymType.NonTerminal, value: 'R' };
const SymbolTermA: Symbolic = { type: SymType.Terminal, value: 'a' };
const SymbolTermB: Symbolic = { type: SymType.Terminal, value: 'b' };
const SymbolTermC: Symbolic = { type: SymType.Terminal, value: 'c' };

// 测试数据
const productions = [
  {
    header: SymbolS,
    body: [SymbolQ, SymbolTermC],
  },
  {
    header: SymbolS,
    body: [SymbolTermC],
  },
  {
    header: SymbolQ,
    body: [SymbolR, SymbolTermB],
  },
  {
    header: SymbolQ,
    body: [SymbolTermB],
  },
  {
    header: SymbolR,
    body: [SymbolS, SymbolTermA],
  },
  {
    header: SymbolR,
    body: [SymbolTermA],
  },
];

const result = removeLeftRecursive(productions);

console.log(JSON.stringify(result));
// PASS!

// TODO: 提取左公因式
function takeCommonLeft(cfg: Production[]): Production[] {
  const result: Production[] = [];

  // 待实现

  return result;
}

// TODO:
// grammar -> production
// 构建LL(1)表，使用查表法非回溯的获取解析方式
