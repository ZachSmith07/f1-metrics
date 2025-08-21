// converts binary (booleans) to integer
export function binToInt(data: boolean[], signed: boolean = false): number {
  let num = 0;

  // if signed handles the first bit
  if (signed) {
    if (data[0]) {
      num -= 2 ** (data.length - 1);
    }
  }

  // loops through the remaining bits
  for (let i = signed ? 1 : 0; i < data.length; i++) {
    if (data[i]) {
      num += 2 ** (data.length - i - 1);
    }
  }

  return num;
}