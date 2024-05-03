// // @porf -funsafe-no-unlikely-proto-checks

// radix: number|any for rawType check
export const __Number_prototype_toString = (_this: number, radix: number|any) => {
  // todo: use exponential notation if >=1e21 (?)
  // todo: negative sign

  if (Porffor.rawType(radix) != Porffor.TYPES.number) {
    // todo: string to number
    radix = 10;
  }

  let out: bytestring = '';

  if (radix < 2 || radix > 36) {
    // todo: throw RangeError: toString() radix argument must be between 2 and 36
    return out;
  }

  if (!Number.isFinite(_this)) {
    if (Number.isNaN(_this)) out = 'NaN';
      else if (_this == Infinity) out = 'Infinity';
      else out = '-Infinity';

    return out;
  }

  let i: f64 = Math.abs(Math.trunc(_this));

  if (i == 0) {
    out = '0';
    return out;
  }

  let digits: bytestring = ''; // byte "array"

  let l: i32 = 0;
  for (; i > 0; l++) {
    Porffor.wasm.i32.store8(Porffor.wasm`local.get ${digits}` + l, i % radix, 0, 4);

    i = Math.trunc(i / radix);
  }

  let outPtr: i32 = Porffor.wasm`local.get ${out}`;
  let digitsPtr: i32 = Porffor.wasm`local.get ${digits}` + l;
  let endPtr: i32 = outPtr + l;
  while (outPtr < endPtr) {
    let digit: i32 = Porffor.wasm.i32.load8_u(--digitsPtr, 0, 4);

    if (digit < 10) digit += 48; // 0-9
      else digit += 87; // a-z

    Porffor.wasm.i32.store8(outPtr++, digit, 0, 4);
  }

  let decimal: f64 = Math.abs(_this - Math.trunc(_this));
  if (decimal > 0) {
    decimal += 1;

    let decimalDigits: i32 = 16 - l;
    for (let j: i32 = 0; j < decimalDigits; j++) {
      decimal *= radix;
    }

    decimal = Math.round(decimal);

    let decimalL: i32 = 0;
    let trailing: boolean = true;
    while (decimal > 1) {
      let digit: f64 = decimal % radix;
      decimal = Math.trunc(decimal / radix);

      if (trailing) {
        if (digit == 0) { // skip trailing 0s
          continue;
        }
        trailing = false;
      }

      Porffor.wasm.i32.store8(Porffor.wasm`local.get ${digits}` + decimalL, digit, 0, 4);
      decimalL++;
    }

    Porffor.wasm.i32.store8(Porffor.wasm`local.get ${out}` + l, 46, 0, 4); // .

    outPtr = Porffor.wasm`local.get ${out}` + l + 1;
    digitsPtr = Porffor.wasm`local.get ${digits}` + decimalL;

    l += decimalL + 1;

    endPtr = outPtr + l;
    while (outPtr < endPtr) {
      let digit: i32 = Porffor.wasm.i32.load8_u(--digitsPtr, 0, 4);

      if (digit < 10) digit += 48; // 0-9
        else digit += 87; // a-z

      Porffor.wasm.i32.store8(outPtr++, digit, 0, 4);
    }
  }

  out.length = l;

  return out;
};