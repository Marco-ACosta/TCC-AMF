export default function isNil(prop: any) {
  if (prop instanceof String) {
    if (prop.trim() === "" || prop === "undefined" || prop === "null")
      return true;
  }

  if (Number.isNaN(prop)) return true;

  if (prop === undefined || prop === null) return true;

  return false;
}
