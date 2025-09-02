import type { Database as SqliteDatabaseType } from "better-sqlite3";
import { segmentTables, loopTables, compositeTables } from "./constants";
import { SegmentInfo } from "./parser";

export function insertHeader(db: SqliteDatabaseType): number | bigint {
  const val = db
    .prepare(`INSERT INTO ${loopTables.HEADER_TABLE} DEFAULT VALUES;`)
    .run();
  return val.lastInsertRowid;
}

export function insert1000(
  db: SqliteDatabaseType,
  order: number,
  headerId: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_1000_TABLE} (segment_order, x12_header_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, headerId).lastInsertRowid;
}

export function insert2000(
  db: SqliteDatabaseType,
  order: number,
  headerId: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2000_TABLE} (segment_order, x12_header_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, headerId).lastInsertRowid;
}

export function insert2100(
  db: SqliteDatabaseType,
  order: number,
  loop2000Idx: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2100_TABLE} (segment_order, x12_2000_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, loop2000Idx).lastInsertRowid;
}

export function insert2105(
  db: SqliteDatabaseType,
  order: number,
  loop2100Idx: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2105_TABLE} (segment_order, x12_2100_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, loop2100Idx).lastInsertRowid;
}

export function insert2110(
  db: SqliteDatabaseType,
  order: number,
  loop2100Idx: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2110_TABLE} (segment_order, x12_2100_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, loop2100Idx).lastInsertRowid;
}

// ----------------- segment table inserts ----------------------------------
export function insertBPR(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  headerId: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "transaction_handling_code",
    "2": "payment_amount",
    "3": "credit_debit_flag",
    "4": "payment_method_code",
    "5": "payment_format_code",
    "6": "odfi_id_number_qualifier",
    "7": "odfi_id_number",
    "8": "payer_financial_asset_type",
    "9": "payer_account_number",
    "10": "originating_company_id",
    "11": "originating_company_supplemental_code",
    "12": "rdfi_id_number_qualifier",
    "13": "rdfi_id_number",
    "14": "receiver_asset_type",
    "15": "receiver_account_number ",
    "16": "payment_effective_date",
    "17": "reason_for_payment",
    "18": "id_number_qualifier_for_returns",
    "19": "dfi_id_number_for_returns",
    "20": "asset_type_for_return_account",
    "21": "account_number_for_return",
  };

  const mapped = mapValues(data, map, 0);
  mapped["x12_header_id"] = headerId;

  // converting payment_effective_date to date
  const dateKey = "payment_effective_date";
  if (mapped[dateKey] && mapped[dateKey] !== "") {
    mapped[dateKey] = formatEightDigitDate(mapped[dateKey] as string);
    console.log(mapped);
  }
  return insertRow(db, segmentTables.BPR_TABLE, mapped);
}

export function insertCUR(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  headerId: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "01": "entity_id_code_1",
    "02": "currency_code_1",
    "03": "exchange_rate_1",
    "04": "entity_id_code_2",
    "05": "currency_code_2",
    "06": "currency_market_exchange_code",
    "07": "date_time_qualifier_1",
    "08": "date_1",
    "09": "time_1",
    "10": "date_time_qualifier_2",
    "11": "date_2",
    "12": "time_2",
    "13": "date_time_qualifier_3",
    "14": "date_3",
    "15": "time_3",
    "16": "date_time_qualifier_4",
    "17": "date_4",
    "18": "time_4",
    "19": "date_time_qualifier_5",
    "20": "date_5",
    "21": "time_5",
  };

  const mapped = mapValues(data, map, 0);
  mapped["x12_header_id"] = headerId;

  // converting dates and times
  for (let i = 1; i < 6; i++) {
    if (mapped[`date_${i}`] && map[`date_${i}`] !== "") {
      mapped[`date_${i}`] = formatEightDigitDate(mapped[`date_${i}`] as string);
    }
    if (mapped[`time_${i}`] && map[`time_${i}`] !== "") {
      mapped[`time_${i}`] = formatTime(mapped[`time_${i}`] as string);
    }
  }

  return insertRow(db, segmentTables.CUR_TABLE, mapped);
}

export function insertNTE(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  headerId: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "note_reference_code",
    "2": "description",
  };

  const mapped = mapValues(data, map, order);
  mapped["x12_header_id"] = headerId;
  return insertRow(db, segmentTables.NTE_TABLE, mapped);
}

export function insertREF(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  order: number,
  parentId: number | bigint,
  parentType: string
): number | bigint {
  const map: Record<string, string> = {
    "1": "id_qualifier",
    "2": "id",
    "3": "description",
  };
  let subSegmentInfo: SegmentInfo | null = null;

  if (data["4"]) {
    subSegmentInfo = {
      name: "C004",
      "1": data["4"],
      ...(data["4-1"] ? { "2": data["4-1"] } : {}),
      ...(data["4-2"] ? { "3": data["4-2"] } : {}),
      ...(data["4-3"] ? { "4": data["4-3"] } : {}),
      ...(data["4-4"] ? { "5": data["4-4"] } : {}),
      ...(data["4-5"] ? { "6": data["4-5"] } : {}),
    };
  }

  const mapped = mapValues(data, map, order);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  const refId = insertRow(db, segmentTables.REF_TABLE, mapped);
  if (subSegmentInfo != null) {
    insertC040(db, subSegmentInfo, 0, refId, segmentTables.REF_TABLE);
  }

  return 0;
}

export function insertST(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  headerId: number | bigint
): number | bigint {
  const stMap: Record<string, string> = {
    "1": "id_code",
    "2": "transaction_set_control",
    "3": "convention_reference",
  };
  const mapped = mapValues(data, stMap, 0);
  mapped["x12_header_id"] = headerId;

  return insertRow(db, segmentTables.ST_TABLE, mapped);
}

export function insertTRN(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  headerId: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "trace_type_code",
    "2": "transaction_id",
    "3": "organization_id",
    "4": "subdivision_id",
  };
  const mapped = mapValues(data, map, 0);
  mapped["x12_header_id"] = headerId;

  return insertRow(db, segmentTables.TRN_TABLE, mapped);
}

// -------------------------------- composite tables --------------------------
export function insertC040(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  order: number,
  parentId: number | bigint,
  parentType: string
) {
  const map: Record<string, string> = {
    "1": "id_qualifier_2",
    "2": "id_2",
    "3": "id_qualifier_3",
    "4": "id_3",
    "5": "id_qualifier_4",
    "6": "id_4",
  };

  const mapped = mapValues(data, map, order);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  return insertRow(db, compositeTables.C040_TABLE, mapped);
}

// ----------------------- helper methods -------------------------------------

function mapValues(
  data: SegmentInfo,
  stMap: Record<string, string>,
  order: number
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  mapped["segment_order"] = order;
  for (const [key, value] of Object.entries(data)) {
    const col = stMap[key];
    if (col) mapped[col] = value;
  }
  return mapped;
}

function insertRow(
  db: SqliteDatabaseType,
  table: string,
  mapped: Record<string, unknown>
): number | bigint {
  const cols = Object.keys(mapped);
  const placeholders = cols.map(() => "?").join(",");
  const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders});`;
  return db.prepare(sql).run(Object.values(mapped)).lastInsertRowid;
}

function formatEightDigitDate(dateString: string): string {
  // Ensure the input string is 8 digits long
  if (dateString.length !== 8 || !/^\d+$/.test(dateString)) {
    throw new Error("Invalid date string. Expected 8 digits (YYYYMMDD).");
  }

  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);

  return `${year}-${month}-${day}`;
}

function formatTime(timeString: string): string {
  // Ensure the input string is 8 digits long
  if (timeString.length >= 4 || !/^\d+$/.test(timeString)) {
    throw new Error(
      "Invalid time string. Expected at least 4 digits (HHMM, HHMMSS, HHMMSSDD)."
    );
  }

  const hour = timeString.substring(0, 2);
  const min = timeString.substring(2, 4);
  let sec: string = "00";
  let decimalSec: string | undefined;
  if (timeString.length > 4) {
    sec = timeString.substring(4, 6);
  }
  let time = `${hour}:${min}:${sec}`;
  if (timeString.length > 6) {
    decimalSec = timeString.substring(6, 8);
    time += `.${decimalSec}`;
  }

  return time;
}
