// 通用版本比较与判断工具
// 提供 isNewer(remote, local): 当 remote 严格大于 local 时返回 true

function parsePart(p) {
  // 尝试转为数字比较
  const n = Number(p);
  if (!Number.isNaN(n)) return { type: 'num', value: n };
  return { type: 'str', value: String(p) };
}

function compareParts(a, b) {
  if (a.type === 'num' && b.type === 'num') {
    return a.value === b.value ? 0 : (a.value > b.value ? 1 : -1);
  }
  // 数字段优先于字符串段（比如 1 > 1-alpha）
  if (a.type === 'num' && b.type === 'str') return 1;
  if (a.type === 'str' && b.type === 'num') return -1;
  // 字符串段字典序
  if (a.value === b.value) return 0;
  return a.value > b.value ? 1 : -1;
}

function splitVersion(v) {
  if (v == null) return [];
  const s = String(v).trim();
  if (!s) return [];
  // 以常见分隔符切分，保留纯数字或字母块
  return s.split(/[._-]/g).filter(Boolean);
}

export function compareVersions(remote, local) {
  const ra = splitVersion(remote).map(parsePart);
  const la = splitVersion(local).map(parsePart);
  const len = Math.max(ra.length, la.length);
  for (let i = 0; i < len; i++) {
    const rp = ra[i] ?? { type: 'num', value: 0 };
    const lp = la[i] ?? { type: 'num', value: 0 };
    const c = compareParts(rp, lp);
    if (c !== 0) return c;
  }
  return 0;
}

export function isNewer(remoteLastVersion, localVersion) {
  if (!remoteLastVersion) return false;
  if (!localVersion) return true;
  const rs = String(remoteLastVersion).trim();
  const ls = String(localVersion).trim();
  const digitOnly = /^\d+$/;
  if (digitOnly.test(rs) && digitOnly.test(ls)) {
    // 数字型版本号：先比长度（位数越多越大），长度相同再按字符串比较
    if (rs.length !== ls.length) return rs.length > ls.length;
    return rs > ls;
  }
  // 其他情况走通用比较
  return compareVersions(rs, ls) > 0;
}
