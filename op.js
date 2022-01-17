import fs from 'fs/promises';

const source = await fs.readFile('./data/id_start');

const buf = Buffer.allocUnsafe(5);
// initialize buf
buf.fill(0);
let arr = new Uint16Array(buf);
let index = 0;

console.log(arr);
