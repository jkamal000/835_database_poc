export enum State {
  heading,
  loop1000,
  loop2000,
  loop2100,
  loop2105,
  loop2110,
  summary,
}
export interface StateInfo {
  state: State;

  loop1000Idx?: number;
  loop2000Idx?: number;
  loop2100Idx?: number;
  loop2105Idx?: number;
  loop2110Idx?: number;
  headerId?: number | bigint;
  loop1000Id?: number | bigint;
  loop2000Id?: number | bigint;
  loop2100Id?: number | bigint;
  loop2105Id?: number | bigint;
  loop2110Id?: number | bigint;
  n1Id?: number | bigint;

  prevSegmentName?: string;
  currentSegmentOrder: number;
}
