/* CHROMAKEY AUTH™ — auth-core v0.1
 * Digiterior Studio — founder + Claude
 * 静的サイトのままで「ソースに正解を書かない」認証コア。
 * 照合は PBKDF2-SHA256(WebCrypto)。記録には salt と hash のみが載る。
 * 認証は deliberately paced(「間」)— 最短表示時間を設けてある。
 */
const CKA = (() => {
  const SESSION_KEY = 'cka-session';
  const SESSION_HOURS = 8;
  const MIN_PACE_MS = 1200; // 「間」— deliberately paced

  // 32色パレット(石垣の色アンカー4色を含む)
  const PAL = [
    '#1A237E','#F9A825','#1B6B5A','#E8E0D0',
    '#FF6B35','#FFD166','#06D6A0','#118AB2','#EF476F','#26547C',
    '#FFB703','#FB8500','#8338EC','#3A86FF','#FF006E','#1E88E5',
    '#9B7FF4','#3DD68C','#F06060','#C8920A','#8B1A1A','#CC3300',
    '#F0C040','#00BCD4','#FF7043','#66BB6A','#5C6BC0','#CE93D8',
    '#2E7D32','#6D4C41','#455A64','#D81B60'
  ];

  function normalize(pairs){
    // [{char:'星', hex:'#1A237E'}, ...] → "星|#1a237e|晃|#f9a825"
    return pairs.map(p => `${p.char}|${p.hex.toLowerCase()}`).join('|');
  }

  async function pbkdf2Hex(message, saltHex, iterations){
    const enc = new TextEncoder();
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const key = await crypto.subtle.importKey('raw', enc.encode(message), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function verify(userRecord, pairs){
    const t0 = performance.now();
    const derived = await pbkdf2Hex(normalize(pairs), userRecord.salt, userRecord.iterations);
    const ok = derived === userRecord.hash;
    // deliberately paced: 最短 MIN_PACE_MS を保証(速すぎる失敗応答は攻撃の助けになる)
    const elapsed = performance.now() - t0;
    if (elapsed < MIN_PACE_MS) await new Promise(r => setTimeout(r, MIN_PACE_MS - elapsed));
    return ok;
  }

  function openSession(user){
    const token = [...crypto.getRandomValues(new Uint8Array(12))]
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const sess = { id: user.id, label: user.label,
      exp: Date.now() + SESSION_HOURS * 3600 * 1000, token: `cka.${token}` };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess)); } catch(e) {}
    return sess;
  }

  function getSession(){
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.exp || Date.now() > s.exp) { sessionStorage.removeItem(SESSION_KEY); return null; }
      return s;
    } catch(e) { return null; }
  }

  function logout(){ try { sessionStorage.removeItem(SESSION_KEY); } catch(e) {} }

  async function loadUsers(url = 'data/users.json'){
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('users.json load failed');
    return (await res.json()).users || [];
  }

  return { PAL, normalize, pbkdf2Hex, verify, openSession, getSession, logout, loadUsers };
})();
