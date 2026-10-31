self.onmessage = ({ data }) => {
  try {
    const regex = new RegExp(data.pattern, data.flags);
    const matches = [];
    let m;
    while ((m = regex.exec(data.text)) !== null) {
      matches.push({
        index: m.index,
        value: m[0],
        groups: m.slice(1),
        named: m.groups,
      });
      if (matches.length >= 2000) break;
      if (!regex.global && !regex.sticky) break;
      if (m[0] === "") {
        const i = regex.lastIndex;
        regex.lastIndex +=
          regex.unicode && data.text.codePointAt(i) > 65535 ? 2 : 1;
      }
    }
    self.postMessage({ matches });
  } catch (e) {
    self.postMessage({ error: e.message });
  }
};
