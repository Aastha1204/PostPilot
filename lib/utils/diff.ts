export interface DiffOp {
  type: "same" | "add" | "remove";
  text: string;
}

/** Word-level diff (LCS). Whitespace is kept attached to words so the result re-joins cleanly. */
export function wordDiff(before: string, after: string): DiffOp[] {
  const a = before.split(/(?<=\s)/);
  const b = after.split(/(?<=\s)/);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i]![j] = a[i]!.trim() === b[j]!.trim() ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  const push = (type: DiffOp["type"], text: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += text;
    else ops.push({ type, text });
  };
  while (i < a.length && j < b.length) {
    if (a[i]!.trim() === b[j]!.trim()) { push("same", b[j]!); i += 1; j += 1; }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) { push("remove", a[i]!); i += 1; }
    else { push("add", b[j]!); j += 1; }
  }
  while (i < a.length) push("remove", a[i++]!);
  while (j < b.length) push("add", b[j++]!);
  return ops;
}
