/** Rounds a screening score to one decimal, like the Decimal(5,1) columns it ends up in. NaN stays NaN. */
export const round1 = (value: number) => Math.round(value * 10) / 10;
