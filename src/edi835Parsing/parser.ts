import { X12parser } from "x12-parser";
import { Readable } from "node:stream";
import { create835Tables } from "./library";
import type { Database as SqliteDatabaseType } from "better-sqlite3";

export interface SegmentInfo {
  name: string;
  [key: string]: string;
}

interface StateInfo {
  state: State;
  loop1000Idx?: number;
  loop2000Idx?: number;
  loop2100Idx?: number;
  loop2105Idx?: number;
  loop2110Idx?: number;
}

enum State {
  heading,
  loop1000,
  loop2000,
  loop2100,
  loop2105,
  loop2110,
  summary,
}

export async function parseX12(readStream: Readable): Promise<void> {
  create835Tables();
  const parser = new X12parser();

  try {
    let currentState: StateInfo = { state: State.heading };

    const ediStream = readStream.pipe(parser);
    printStateInfo(currentState);
    for await (const data of ediStream) {
      // determine if state needs to change

      const output = changeState(currentState, data);
      if (output !== null) {
        currentState = output;

        printStateInfo(currentState);
      }
      console.log(data.name);
    }

    console.log("Successfully finished processing the file.");
  } catch (err) {
    console.error("An error occurred during processing:", err);
  }
}

function printStateInfo(stateInfo: StateInfo) {
  let name: string;
  let idx: number;
  switch (stateInfo.state) {
    case State.heading:
      name = "heading";
      idx = 0;
      break;
    case State.loop1000:
      name = "loop 1000";
      idx = stateInfo.loop1000Idx!;
      break;
    case State.loop2000:
      name = "loop 2000";
      idx = stateInfo.loop2000Idx!;
      break;
    case State.loop2100:
      name = "loop 2100";
      idx = stateInfo.loop2100Idx!;
      break;
    case State.loop2105:
      name = "loop 2105";
      idx = stateInfo.loop2105Idx!;
      break;
    case State.loop2110:
      name = "loop 2110";
      idx = stateInfo.loop2110Idx!;
      break;
    case State.summary:
      name = "summary";
      idx = 0;
  }
  console.log(`=============== ${name} ${idx}`);
}

export function decodeHeading(db: SqliteDatabaseType, data: SegmentInfo) {}

export function decode2000(info: { name: string; data: SegmentInfo[] }) {}

function changeState(
  stateInfo: StateInfo,
  data: SegmentInfo
): StateInfo | null {
  switch (data.name) {
    case "N1":
      switch (stateInfo.state) {
        case State.heading:
          return { ...stateInfo, state: State.loop1000, loop1000Idx: 0 };
        case State.loop1000:
          return { ...stateInfo, loop1000Idx: stateInfo.loop1000Idx! + 1 };
        case State.loop2100:
          return { ...stateInfo, state: State.loop2105, loop2105Idx: 0 };
        default:
          // only other case in a valid file is if the current state is 2105
          return { ...stateInfo, loop2105Idx: stateInfo.loop2105Idx! + 1 };
      }
    case "LX":
      switch (stateInfo.state) {
        case State.heading:
        case State.loop1000:
          return { ...stateInfo, state: State.loop2000, loop2000Idx: 0 };
        default:
          // will only happen for states of 2000, 2100, 2105, and 2110 all of
          // which need the same behavior which is:
          // end of loop and starting new 2000 loop
          return {
            ...stateInfo,
            state: State.loop2000,
            loop2000Idx: stateInfo.loop2000Idx! + 1,
            loop2100Idx: undefined,
            loop2105Idx: undefined,
            loop2110Idx: undefined,
          };
      }
    case "CLP":
      switch (stateInfo.state) {
        case State.loop2000:
          return { ...stateInfo, state: State.loop2100, loop2100Idx: 0 };
        default:
          // will only happen for states of 2100, 2105, and 2110 all of which
          // need the same behavior which is:
          // end of loop and starting new 2100 loop
          return {
            ...stateInfo,
            state: State.loop2100,
            loop2100Idx: stateInfo.loop2100Idx! + 1,
            loop2105Idx: undefined,
            loop2110Idx: undefined,
          };
      }
    case "SVC":
      switch (stateInfo.state) {
        case State.loop2110:
          return { ...stateInfo, loop2110Idx: stateInfo.loop2110Idx! + 1 };
        default:
          // only other cases this can happen is loop 2100 or 2105 both of which
          // means starting a new 2110 loop
          return { ...stateInfo, state: State.loop2110, loop2110Idx: 0 };
      }
    case "PLB":
      return { ...stateInfo, state: State.summary };
    case "SE":
      if (stateInfo.state === State.summary) return null;
      return { ...stateInfo, state: State.summary };
  }

  return null;
}
