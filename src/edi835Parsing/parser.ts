import { X12parser } from "x12-parser";
import { Readable } from "node:stream";
import {
  insert1000,
  insert2000,
  insert2100,
  insertBPR,
  insertCAS,
  insertCLP,
  insertCUR,
  insertDTM,
  insertHeader,
  insertN1,
  insertN2,
  insertN3,
  insertN4,
  insertNTE,
  insertPER,
  insertRDM,
  insertREF,
  insertST,
  insertTRN,
  insertTS2,
  insertTS3,
} from "./library";
import type { Database as SqliteDatabaseType } from "better-sqlite3";
import { create835Tables } from "./createTables";
import { loopTables } from "./constants";
import { SegmentInfo } from "./interfaces/segmentInfo";
import { StateInfo, State } from "./interfaces/stateInfo";
// import { reparseSegment } from "./parserHelper";

export async function parseX12(readStream: Readable): Promise<void> {
  const db = create835Tables();
  const parser = new X12parser();

  try {
    let currentState: StateInfo = {
      state: State.heading,
      repeatingElementSeparator: "^", // this is the commonly used value but it will be updated
      compositeElementSeparator: ":", // this is the commonly used value but it will be updated
      currentSegmentOrder: 0,
    };

    const ediStream = readStream.pipe(parser);
    printStateInfo(currentState);
    for await (const data of ediStream) {
      // determine if state needs to change

      const output = changeState(currentState, data);
      if (output !== null) {
        // starting a new saved previous segment and order can be cleared.
        output.prevSegmentName = undefined;
        output.currentSegmentOrder = 0;
        output.n1Id = undefined;
        currentState = output;
        printStateInfo(currentState);
      }

      if (data.name == currentState.prevSegmentName) {
        // if the current segment is the same as the last we need to increment
        // the segment order
        currentState.currentSegmentOrder = currentState.currentSegmentOrder + 1;
      } else {
        currentState.currentSegmentOrder = 0;
      }
      console.log(data.name, currentState.currentSegmentOrder);
      switch (currentState.state) {
        case State.heading:
          decodeHeading(db, data, currentState);
          break;
        case State.loop1000:
          decode1000(db, data, currentState);
          break;
        case State.loop2000:
          decode2000(db, data, currentState);
          break;
        case State.loop2100:
          decode2100(db, data, currentState);
          break;
      }
      currentState.prevSegmentName = data.name;
    }

    console.log("Successfully finished processing the file.");
  } catch (err) {
    console.error("An error occurred during processing:", err);
  }
}

export function decodeHeading(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "ISA":
      // setting up delimiters:
      stateInfo.repeatingElementSeparator = data["11"];
      stateInfo.compositeElementSeparator = data["16"];
      break;
    case "ST":
      stateInfo.headerId = insertHeader(db);
      insertST(db, data, stateInfo.headerId);
      break;
    case "BPR":
      insertBPR(db, data, stateInfo.headerId!);
      break;
    case "NTE":
      insertNTE(db, data, stateInfo.headerId!, stateInfo.currentSegmentOrder);
      break;
    case "TRN":
      insertTRN(db, data, stateInfo.headerId!);
      break;
    case "CUR":
      insertCUR(db, data, stateInfo.headerId!);
      break;
    case "REF":
      insertREF(
        db,
        data,
        loopTables.HEADER_TABLE,
        stateInfo.headerId!,
        stateInfo.currentSegmentOrder
      );
      break;
    case "DTM":
      insertDTM(
        db,
        data,
        loopTables.HEADER_TABLE,
        stateInfo.headerId!,
        stateInfo.currentSegmentOrder
      );
      break;
    default:
      return;
  }
}

export function decode1000(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "N1":
      stateInfo.loop1000Id = insert1000(
        db,
        stateInfo.loop1000Idx!,
        stateInfo.headerId!
      );
      stateInfo.n1Id = insertN1(
        db,
        data,
        loopTables.X12_1000_TABLE,
        stateInfo.loop1000Id
      );
      break;
    case "N2":
      insertN2(db, data, stateInfo.n1Id!, stateInfo.currentSegmentOrder);
      break;
    case "N3":
      insertN3(db, data, stateInfo.n1Id!, stateInfo.currentSegmentOrder);
      break;
    case "N4":
      insertN4(db, data, stateInfo.n1Id!, stateInfo.currentSegmentOrder);
      break;
    case "REF":
      insertREF(
        db,
        data,
        loopTables.X12_1000_TABLE,
        stateInfo.loop1000Id!,
        stateInfo.currentSegmentOrder
      );
      break;
    case "PER":
      insertPER(
        db,
        data,
        loopTables.X12_1000_TABLE,
        stateInfo.loop1000Id!,
        stateInfo.currentSegmentOrder
      );
      break;
    case "RDM":
      insertRDM(db, data, stateInfo.loop1000Id!);
      break;
    case "DTM":
      insertDTM(db, data, loopTables.X12_1000_TABLE, stateInfo.loop1000Id!, 0);
      break;
  }
}

export function decode2000(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "LX":
      stateInfo.loop2000Id = insert2000(
        db,
        stateInfo.loop2000Idx!,
        stateInfo.headerId!
      );
      break;
    case "TS3":
      insertTS3(db, data, stateInfo.loop2000Id!);
      break;
    case "TS2":
      insertTS2(db, data, stateInfo.loop2000Id!);
      break;
    default:
      return;
  }
}

export function decode2100(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "CLP":
      stateInfo.loop2100Id = insert2100(
        db,
        stateInfo.loop2100Idx!,
        stateInfo.loop2000Id!
      );
      insertCLP(db, data, stateInfo.loop2100Id);
      break;
    case "CAS":
      insertCAS(
        db,
        data,
        loopTables.X12_2100_TABLE,
        stateInfo.loop2100Id!,
        stateInfo.currentSegmentOrder
      );
      break;
    case "RAS":
      // newData = reparseSegment(
      //   data,
      //   stateInfo.compositeElementSeparator,
      //   stateInfo.repeatingElementSeparator
      // );
      // console.log(newData);
      break;
    default:
      return;
  }
}

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
