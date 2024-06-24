// @porf --valtype=i32
import type {} from './porffor.d.ts';

// memory layout:
//  size (i32, 4)
// per entry (14):
//  key - value, type MSB encoded (u32, 4)
//  value - value (f64, 8)
//  value - type + obj flag (u16, 2)
// flags:
//  accessor - 0b0001
//  configurable - 0b0010
//  enumerable - 0b0100
//  writable - 0b1000

export const __Porffor_object_lookup = (_this: object, target: any): i32 => {
  const targetType: i32 = Porffor.wasm`local.get ${target+1}`;

  let ptr: i32 = Porffor.wasm`local.get ${_this}` + 4;

  const size: i32 = Porffor.wasm.i32.load(_this, 0, 0);
  const endPtr: i32 = ptr + size * 14;

  if (targetType == Porffor.TYPES.bytestring) {
    const targetStr: bytestring = target;
    for (; ptr < endPtr; ptr += 14) {
      const keyRaw: i32 = Porffor.wasm.i32.load(ptr, 0, 0);
      if (keyRaw == 0) break; // ran out of keys
      if (keyRaw >>> 31) continue; // MSB set, regular string type

      const keyStr: bytestring = keyRaw;
      if (keyStr == targetStr) return ptr;
    }
  } else {
    const targetStr: string = target;
    for (; ptr < endPtr; ptr += 14) {
      const keyRaw: i32 = Porffor.wasm.i32.load(ptr, 0, 0);
      if (keyRaw == 0) break; // ran out of keys
      if (keyRaw >>> 31) { // MSB set, regular string type
        const keyStr: string = keyRaw & 0x7FFFFFFF; // unset MSB
        if (keyStr == targetStr) return ptr;
      }
    }
  }

  return -1;
};

export const __Porffor_object_get = (_this: object, key: any): any => {
  const entryPtr: i32 = __Porffor_object_lookup(_this, key);
  if (entryPtr == -1) {
    Porffor.wasm`
f64.const 0
i32.const 128
return`;
  }

  const tail: i32 = Porffor.wasm.i32.load16_u(entryPtr, 0, 12);

  if (tail & 0b0001) {
    // accessor descriptor
    // todo

    Porffor.wasm`
f64.const 0
i32.const 128
return`;
  }

  // data descriptor
  Porffor.wasm`
local.get ${entryPtr}
f64.load 0 4
local.get ${tail}
i32.const 8
i32.shr_u
return`;
};

export const __Porffor_object_set = (_this: object, key: any, value: any): any => {
  let entryPtr: i32 = __Porffor_object_lookup(_this, key);
  let flags: i32;
  if (entryPtr == -1) {
    // add new entry
    // bump size +1
    const size: i32 = Porffor.wasm.i32.load(_this, 0, 0);
    Porffor.wasm.i32.store(_this, size + 1, 0, 0);

    // entryPtr = current end of object
    entryPtr = Porffor.wasm`local.get ${_this}` + 4 + size * 14;

    // encode key type, set MSB if regular string
    let keyEnc: i32 = Porffor.wasm`local.get ${key}`;
    if (Porffor.wasm`local.get ${key+1}` == Porffor.TYPES.string) keyEnc |= 0x80000000;

    // write key value and type (MSB)
    Porffor.wasm.i32.store(entryPtr, keyEnc, 0, 0);

    // flags = writable, enumerable, configurable, not accessor
    flags = 0b1110;
  } else {
    // existing entry, modify it
    const tail: i32 = Porffor.wasm.i32.load16_u(entryPtr, 0, 12);

    if (tail & 0b0001) {
      // accessor descriptor
      // todo

      return value;
    }

    // data descriptor
    if (!(tail & 0b1000)) {
      // not writable, return now
      return value;
    }

    // flags = same flags as before
    flags = tail & 0xff;
  }

  // write new value value (lol)
  Porffor.wasm.f64.store(entryPtr, value, 0, 4);

  // write new tail (value type + flags)
  Porffor.wasm.i32.store16(entryPtr,
    flags + (Porffor.wasm`local.get ${value+1}` << 8),
    0, 12);

  return value;
};