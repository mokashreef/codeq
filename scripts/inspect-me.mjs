const res = await fetch('https://js.puter.com/v2/');
const js = await res.text();

const idx = js.indexOf('chat=Me');
console.log('Context around chat=Me:');
console.log(js.substring(idx - 600, idx + 100));

// Find function Me definition
const meDefIdx = js.indexOf('function Me(');
const meConstIdx = js.indexOf('const Me=');
console.log('Me def index:', meDefIdx, meConstIdx);
if (meConstIdx !== -1) {
  console.log(js.substring(meConstIdx, meConstIdx + 800));
}
