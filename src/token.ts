class State<T> {
  transition: {
    [key: string]: T;
  };

  constructor(public id: number, public isEnd: boolean) {
    this.transition = {};
  }
}

class NFAState extends State<NFAState> {
  epsilons: NFAState[];

  constructor(id: number, isEnd: boolean) {
    super(id, isEnd);
    this.epsilons = [];
  }
}

type NFA = { start: NFAState; end: NFAState };

function getEpsilonClosure(states: NFAState[]): NFAState[] {
  if (!states.length) {
    return [];
  }
  const epsilonClosure = states.slice();

  for (const state of states) {
    const { epsilons } = state;
    // 当前节点的epsilons
    for (const ep of epsilons) {
      epsilonClosure.push(ep);
    }
    // 递归
    const res = getEpsilonClosure(epsilons);
    for (const target of res) {
      if (!epsilonClosure.some(item => item === target)) {
        epsilonClosure.push(target);
      }
    }
  }
  return epsilonClosure;
}

class NFABuilder {
  private _id: number;

  constructor() {
    this._id = 0;
  }

  static addTransition(from: NFAState, to: NFAState, symbol: string) {
    from.transition[symbol] = to;
  }

  static addEpsilon(from: NFAState, to: NFAState) {
    from.epsilons.push(to);
  }

  fromSymbol(symbol: string): NFA {
    const start = new NFAState(this._id++, false);
    const end = new NFAState(this._id++, true);
    NFABuilder.addTransition(start, end, symbol);
    return { start, end };
  }

  concat(n1: NFA, n2: NFA): NFA {
    NFABuilder.addEpsilon(n1.end, n2.start);
    n1.end.isEnd = false;
    return { start: n1.start, end: n2.end };
  }

  union(n1: NFA, n2: NFA): NFA {
    const start = new NFAState(this._id++, false);
    NFABuilder.addEpsilon(start, n1.start);
    NFABuilder.addEpsilon(start, n2.start);

    const end = new NFAState(this._id++, true);
    NFABuilder.addEpsilon(n1.end, end);
    NFABuilder.addEpsilon(n2.end, end);

    n1.end.isEnd = false;
    n2.end.isEnd = false;

    return { start, end };
  }

  closure(n: NFA): NFA {
    const start = new NFAState(this._id++, false);
    const end = new NFAState(this._id++, true);

    NFABuilder.addEpsilon(start, n.start);
    NFABuilder.addEpsilon(start, end);

    NFABuilder.addEpsilon(n.end, end);
    NFABuilder.addEpsilon(n.end, n.start);

    n.end.isEnd = false;

    return { start, end };
  }

  parse(postRegex: string): NFA {
    const stack: NFA[] = [];

    for (const token of postRegex) {
      switch (token) {
        case '.': {
          const end = stack.pop();
          const start = stack.pop();
          const next = this.concat(start, end);
          stack.push(next);
          break;
        }
        case '|': {
          const right = stack.pop();
          const left = stack.pop();
          const next = this.union(left, right);
          stack.push(next);
          break;
        }
        case '*': {
          const nfa = stack.pop();
          const next = this.closure(nfa);
          stack.push(next);
          break;
        }
        default: {
          const next = this.fromSymbol(token);
          stack.push(next);
          break;
        }
      }
    }

    return stack.pop();
  }
}

type DFA = {
  states: NFAState[][];
  start: NFAState[];
  end: NFAState[][];
  inputs: string[];
  move: Map<NFAState[], { [key: string]: NFAState[] }>;
};

// 五元组表示dfa
function toDFA(nfa: NFA): DFA {
  // 状态集合
  const states: NFAState[][] = [];
  // 起始点
  const start = getEpsilonClosure([nfa.start]);
  // 终点
  const end: NFAState[][] = [];
  // 输入项
  const inputs: string[] = [];
  // 状态转移表
  const move = new Map<NFAState[], { [key: string]: NFAState[] }>();

  const stack: NFAState[][] = [];
  stack.push(start);
  states.push(start);

  while (stack.length) {
    const current = stack.pop();
    const map: {
      [key: string]: NFAState[];
    } = {};
    // 当前closure的全部出路
    for (const nfa of current) {
      const { transition } = nfa;
      Object.entries(transition).forEach(([symbol, state]) => {
        if (!map[symbol]) {
          map[symbol] = [];
        }
        if (!map[symbol].includes(state)) {
          map[symbol].push(state);
        }
      });
    }
    let currentMove = {};
    // 遍历表结构插入新节点
    Object.entries(map).forEach(([symbol, value]) => {
      const epsilonClosure = getEpsilonClosure(value);

      const tmp = states.find(
        item =>
          item.length === epsilonClosure.length &&
          epsilonClosure.every(state => item.includes(state)),
      );

      if (!tmp) {
        // 没有添加过，添加到新节点中
        states.push(epsilonClosure);
        stack.push(epsilonClosure);
        currentMove[symbol] = epsilonClosure;
      } else {
        // 已经出现在节点中，直接使用缓存
        currentMove[symbol] = tmp;
      }
      if (!inputs.includes(symbol)) {
        inputs.push(symbol);
      }
    });

    move.set(current, currentMove);
  }

  for (const nfaStates of states) {
    if (nfaStates.some(item => item.isEnd)) {
      if (!end.includes(nfaStates)) {
        end.push(nfaStates);
      }
    }
  }

  return {
    states,
    start,
    end,
    inputs,
    move,
  };
}

function match(dfa: DFA, test: string) {
  const stack: NFAState[][] = [];
  let current = dfa.start;
  const start = 0;
  let pos = 0;
  stack.push(current);

  for (; pos < test.length; pos++) {
    const ch = test[pos];
    const res = dfa.move.get(current)[ch];
    if (!dfa.states.includes(res)) {
      break;
    }
    current = res;
    // 先追加到数组中
    stack.push(res);
  }

  // 回滚到最大前缀的状态机
  let state = stack.pop();
  while (pos > 0 && !dfa.end.includes(state)) {
    pos--;
  }

  return { start, end: pos };
}

////////////////////////// test //////////////////////////
const source = 'abbbaaaccc';

const nfaBuilder = new NFABuilder();
/**
 * TODO: 实现正则插入dot操作符, 实现中追表达式转后缀表达式
 */
const nfa = nfaBuilder.parse('ab|*c.');
const dfa = toDFA(nfa);
const posInfo = match(dfa, source);

const data = {
  value: source.slice(posInfo.start, posInfo.end),
  start: posInfo.start,
  end: posInfo.end,
};
console.log(data);
