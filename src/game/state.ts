export type ScoresByRow = Record<string, number | null | undefined>;
export type ScoresByColumn = Record<string, ScoresByRow>;
export type AllScores = Record<string, ScoresByColumn>;

export type DiceValues = Array<number | null>;

export const state: {
  allScores: AllScores;
  diceValues: DiceValues;
  rollsLeft: number;
  submitPreviewActive: boolean;
  fontSizeMode: 'small' | 'normal' | 'large';
  najavaButton: HTMLButtonElement | null;
  isRolling: boolean;
  najavaActive: boolean;
  najavaRowId: string | null;
} = {
  allScores: { t1: {}, t2: {} },
  diceValues: [null, null, null, null, null],
  rollsLeft: 3,
  submitPreviewActive: false,
  fontSizeMode: 'normal',
  najavaButton: null,
  isRolling: false,
  najavaActive: false,
  najavaRowId: null
};
