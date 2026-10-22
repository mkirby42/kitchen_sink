const SUPERBILL_LABEL = "out-of-network superbill";

export function inNetworkInsurance(labels: string[]) {
  return labels.filter(
    (label) =>
      label.toLowerCase() !== SUPERBILL_LABEL &&
      label.toLowerCase() !== "cash pay only",
  );
}

export function hasSuperbill(labels: string[], flag: boolean) {
  return (
    flag || labels.some((label) => label.toLowerCase() === SUPERBILL_LABEL)
  );
}
