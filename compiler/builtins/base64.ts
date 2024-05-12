// @porf --funsafe-no-unlikely-proto-checks --valtype=i32

export const btoa = (input: bytestring): bytestring => {
  const keyStr: bytestring = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const keyStrPtr: i32 = Porffor.wasm`local.get ${keyStr}`;

  let len: i32 = input.length;
  let output: bytestring = '';
  output.length = 4 * (len / 3 + !!(len % 3));

  let i: i32 = Porffor.wasm`local.get ${input}`,
      j: i32 = Porffor.wasm`local.get ${output}`;

  // todo/perf: add some per 6 char variant using bitwise magic

  const endPtr = i + len;
  while (i < endPtr) {
    const chr1: i32 = Porffor.wasm.i32.load8_u(i++, 0, 4);
    const chr2: i32 = i < endPtr ? Porffor.wasm.i32.load8_u(i++, 0, 4) : -1;
    const chr3: i32 = i < endPtr ? Porffor.wasm.i32.load8_u(i++, 0, 4) : -1;

    const enc1: i32 = chr1 >> 2;
    const enc2: i32 = ((chr1 & 3) << 4) | (chr2 == -1 ? 0 : (chr2 >> 4));
    let enc3: i32 = ((chr2 & 15) << 2) | (chr3 == -1 ? 0 : (chr3 >> 6));
    let enc4: i32 = chr3 & 63;

    if (chr2 == -1) {
      enc3 = 64;
      enc4 = 64;
    } else if (chr3 == -1) {
      enc4 = 64;
    }

    Porffor.wasm.i32.store8(j++, Porffor.wasm.i32.load8_u(keyStrPtr + enc1, 0, 4), 0, 4);
    Porffor.wasm.i32.store8(j++, Porffor.wasm.i32.load8_u(keyStrPtr + enc2, 0, 4), 0, 4);
    Porffor.wasm.i32.store8(j++, Porffor.wasm.i32.load8_u(keyStrPtr + enc3, 0, 4), 0, 4);
    Porffor.wasm.i32.store8(j++, Porffor.wasm.i32.load8_u(keyStrPtr + enc4, 0, 4), 0, 4);
  }

  return output;
};

// todo: impl atob by converting below to "porf ts"
/* var atob = function (input) {
  const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  let output = "";
  let chr1, chr2, chr3;
  let enc1, enc2, enc3, enc4;
  let i = 0;

  while (i < input.length) {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    // output += String.fromCharCode(chr1);
    Porffor.bytestring.appendCharCode(output, chr1);

    if (enc3 != 64) {
      // output += String.fromCharCode(chr2);
      Porffor.bytestring.appendCharCode(output, chr2);
    }
    if (enc4 != 64) {
      // output += String.fromCharCode(chr3);
      Porffor.bytestring.appendCharCode(output, chr3);
    }
  }

  return output;
}; */