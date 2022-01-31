import { NFABuilder, toDFA, match } from '../src/tokenizer';
import { numberRegex } from '../src/number_rule';

const nfaBuilder = new NFABuilder();
// re => nfa
const nfa = nfaBuilder.parse(numberRegex);
// nfa => dfa
const dfa = toDFA(nfa);

// test
const source = '12_876_899.122_88e+123_9';
const info = match(dfa, source);
console.log(info);
