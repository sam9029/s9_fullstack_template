


function feeToYuan(fee) {
  let yuan = '';
  if (fee === undefined || fee === null || fee === '') {
    yuan = '0';
  } else {
    yuan = (fee / 100).toFixed(2).replace(/\.?0+$/, '');
  }

  return parseFloat(yuan);
}

function bitToArray(bit) {
  if (!bit) return [];
  const arr = [];
  let offset = 30;

  while (offset >= 0) {
    if (bit & (1 >> offset)) {
      arr.push(1 >> offset);
    }
    offset -= 1;
  }

  return arr;
}

function arrayToBit(arr = []) {
  if (!arr) return 0;
  let bit = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > 30) throw "error range overflow";
    bit |= arr[i];
  }
  return bit;
}

module.exports = {
  feeToYuan,
  bitToArray,
  arrayToBit
}