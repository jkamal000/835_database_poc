import { X12parser } from "x12-parser";
import { Readable } from "node:stream";
import { DataInserter } from "./dataInserter";
import { create835Tables } from "./createTables";
import { loopTables } from "./constants";
import { SegmentInfo } from "./interfaces/segmentInfo";
import { StateInfo, State } from "./interfaces/stateInfo";

export async function parseX12(readStream: Readable): Promise<void> {
  const db = create835Tables();
  const parser = new X12parser();
  const dataInserter = new DataInserter(db);

  try {
    let currentState: StateInfo = {
      state: State.heading,
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
          decodeHeading(dataInserter, data, currentState);
          break;
        case State.loop1000:
          decode1000(dataInserter, data, currentState);
          break;
        case State.loop2000:
          decode2000(dataInserter, data, currentState);
          break;
        case State.loop2100:
          decode2100(dataInserter, data, currentState);
          break;
        case State.loop2105:
          decode2105(dataInserter, data, currentState);
          break;
        case State.loop2110:
          decode2110(dataInserter, data, currentState);
          break;
        case State.summary:
          decodeSummary(dataInserter, data, currentState);
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
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  const parentType = loopTables.HEADER_TABLE;
  const parentId = stateInfo.headerId;
  const order = stateInfo.currentSegmentOrder;
  switch (data.name) {
    case "ST":
      stateInfo.headerId = dataInserter.insertHeader();
      dataInserter.insertST(data, stateInfo.headerId);
      break;
    case "BPR":
      dataInserter.insertBPR(data, parentId!);
      break;
    case "NTE":
      dataInserter.insertNTE(data, parentId!, order);
      break;
    case "TRN":
      dataInserter.insertTRN(data, parentId!);
      break;
    case "CUR":
      dataInserter.insertCUR(data, parentId!);
      break;
    case "REF":
      dataInserter.insertREF(data, parentType, parentId!, order);
      break;
    case "DTM":
      dataInserter.insertDTM(data, parentType, parentId!, order);
      break;
    default:
      return;
  }
}

export function decode1000(
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  const parentType = loopTables.X12_1000_TABLE;
  const parentId = stateInfo.loop1000Id;
  const n1Id = stateInfo.n1Id;
  const order = stateInfo.currentSegmentOrder;

  switch (data.name) {
    case "N1":
      stateInfo.loop1000Id = dataInserter.insert1000(
        stateInfo.loop1000Idx!,
        stateInfo.headerId!
      );
      stateInfo.n1Id = dataInserter.insertN1(
        data,
        loopTables.X12_1000_TABLE,
        stateInfo.loop1000Id
      );
      break;
    case "N2":
      dataInserter.insertN2(data, n1Id!, order);
      break;
    case "N3":
      dataInserter.insertN3(data, n1Id!, order);
      break;
    case "N4":
      dataInserter.insertN4(data, n1Id!, order);
      break;
    case "REF":
      dataInserter.insertREF(data, parentType, parentId!, order);
      break;
    case "PER":
      dataInserter.insertPER(data, parentType, parentId!, order);
      break;
    case "RDM":
      dataInserter.insertRDM(data, stateInfo.loop1000Id!);
      break;
    case "DTM":
      dataInserter.insertDTM(data, parentType, parentId!, 0);
      break;
  }
}

export function decode2000(
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "LX":
      stateInfo.loop2000Id = dataInserter.insert2000(
        stateInfo.loop2000Idx!,
        stateInfo.headerId!
      );
      break;
    case "TS3":
      dataInserter.insertTS3(data, stateInfo.loop2000Id!);
      break;
    case "TS2":
      dataInserter.insertTS2(data, stateInfo.loop2000Id!);
      break;
    default:
      return;
  }
}

export function decode2100(
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  const parentType = loopTables.X12_2100_TABLE;
  const parentId = stateInfo.loop2100Id;
  const order = stateInfo.currentSegmentOrder;
  switch (data.name) {
    case "CLP":
      stateInfo.loop2100Id = dataInserter.insert2100(
        stateInfo.loop2100Idx!,
        stateInfo.loop2000Id!
      );
      dataInserter.insertCLP(data, stateInfo.loop2100Id);
      break;
    case "CAS":
      dataInserter.insertCAS(data, parentType, parentId!, order);
      break;
    case "RAS":
      dataInserter.insertRAS(data, parentType, parentId!, order);
      break;
    case "NM1":
      dataInserter.insertNM1(data, parentType, parentId!, order);
      break;
    case "MIA":
      dataInserter.insertMIA(data, parentId!);
      break;
    case "MOA":
      dataInserter.insertMOA(data, parentId!);
      break;
    case "REF":
      dataInserter.insertREF(data, parentType, parentId!, order);
      break;
    case "DTM":
      dataInserter.insertDTM(data, parentType, parentId!, order);
      break;
    case "PER":
      dataInserter.insertPER(data, parentType, parentId!, order);
      break;
    case "AMT":
      dataInserter.insertAMT(data, parentType, parentId!, order);
      break;
    case "QTY":
      dataInserter.insertQTY(data, parentType, parentId!, order);
      break;
    case "K3":
      dataInserter.insertK3(data, parentType, parentId!);
      break;
    case "LQ":
      dataInserter.insertLQ(data, parentType, parentId!, order);
      break;
    default:
      return;
  }
}

export function decode2105(
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "N1":
      stateInfo.loop2105Id = dataInserter.insert2105(
        stateInfo.loop2105Idx!,
        stateInfo.loop2100Id!
      );
      dataInserter.insertN1(
        data,
        loopTables.X12_2105_TABLE,
        stateInfo.loop2105Id
      );
      break;
    case "NM1":
      dataInserter.insertNM1(
        data,
        loopTables.X12_2105_TABLE,
        stateInfo.loop2105Id!,
        0
      );
      break;
    default:
      return;
  }
}

export function decode2110(
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  const parentType = loopTables.X12_2110_TABLE;
  const parentId = stateInfo.loop2110Id;
  const order = stateInfo.currentSegmentOrder;
  switch (data.name) {
    case "SVC":
      stateInfo.loop2110Id = dataInserter.insert2110(
        stateInfo.loop2110Idx!,
        stateInfo.loop2100Id!
      );
      dataInserter.insertSVC(data, stateInfo.loop2110Id);
      break;

    case "DTM":
      dataInserter.insertDTM(data, parentType, parentId!, order);
      break;
    case "CAS":
      dataInserter.insertCAS(data, parentType, parentId!, order);
      break;
    case "RAS":
      dataInserter.insertRAS(data, parentType, parentId!, order);
      break;
    case "REF":
      dataInserter.insertREF(data, parentType, parentId!, order);
      break;
    case "AMT":
      dataInserter.insertAMT(data, parentType, parentId!, order);
      break;
    case "QTY":
      dataInserter.insertQTY(data, parentType, parentId!, order);
      break;
    case "LQ":
      dataInserter.insertLQ(data, parentType, parentId!, order);
    case "TOO":
      dataInserter.insertTOO(data, parentId!, order);
      break;
    case "K3":
      dataInserter.insertK3(data, parentType, parentId!);
      break;
    default:
      break;
  }
}

export function decodeSummary(
  dataInserter: DataInserter,
  data: SegmentInfo,
  stateInfo: StateInfo
): void {
  switch (data.name) {
    case "PLB":
      dataInserter.insertPLB(
        data,
        stateInfo.headerId!,
        stateInfo.currentSegmentOrder
      );
      break;
    case "SE":
      dataInserter.insertSE(data, stateInfo.headerId!);
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
      // accounting for already in summary state due to previous PLB segment
      if (stateInfo.state == State.summary) return null;
      return { ...stateInfo, state: State.summary };
    case "SE":
      // accounting for already in summary state due to PLB segment
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
