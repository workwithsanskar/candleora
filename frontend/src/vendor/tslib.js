export function __rest(source, excluded) {
  const target = {};

  if (source == null) {
    return target;
  }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key) && !excluded.includes(key)) {
      target[key] = source[key];
    }
  }

  if (typeof Object.getOwnPropertySymbols === "function") {
    for (const symbol of Object.getOwnPropertySymbols(source)) {
      if (
        Object.prototype.propertyIsEnumerable.call(source, symbol) &&
        !excluded.includes(symbol)
      ) {
        target[symbol] = source[symbol];
      }
    }
  }

  return target;
}
