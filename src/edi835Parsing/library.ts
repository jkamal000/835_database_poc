import type { Database as SqliteDatabaseType } from "better-sqlite3";
import { segmentTables, loopTables, compositeTables } from "./constants";
import { SegmentInfo } from "./interfaces/segmentInfo";

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
  loop2000Id: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2100_TABLE} (segment_order, x12_2000_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, loop2000Id).lastInsertRowid;
}

export function insert2105(
  db: SqliteDatabaseType,
  order: number,
  loop2100Id: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2105_TABLE} (segment_order, x12_2100_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, loop2100Id).lastInsertRowid;
}

export function insert2110(
  db: SqliteDatabaseType,
  order: number,
  loop2100Id: number | bigint
): number | bigint {
  const stmt = db.prepare(
    `INSERT INTO ${loopTables.X12_2110_TABLE} (segment_order, x12_2100_id) ` +
      `VALUES (?, ?);`
  );
  return stmt.run(order, loop2100Id).lastInsertRowid;
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
  }
  return insertRow(db, segmentTables.BPR_TABLE, mapped);
}

export function insertCAS(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  parentType: string,
  parentId: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "claim_adjustment_group_code",
    "2": "claim_adjustment_reason_code_1",
    "3": "adjustment_amount_1",
    "4": "units_of_service_adjusted_1",
    "5": "claim_adjustment_reason_code_2",
    "6": "adjustment_amount_2",
    "7": "units_of_service_adjusted_2",
    "8": "claim_adjustment_reason_code_3",
    "9": "adjustment_amount_3",
    "10": "units_of_service_adjusted_3",
    "11": "claim_adjustment_reason_code_4",
    "12": "adjustment_amount_4",
    "13": "units_of_service_adjusted_4",
    "14": "claim_adjustment_reason_code_5",
    "15": "adjustment_amount_5",
    "16": "units_of_service_adjusted_5",
    "17": "claim_adjustment_reason_code_6",
    "18": "adjustment_amount_6",
    "19": "units_of_service_adjusted_6",
  };

  const mapped = mapValues(data, map, order);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  return insertRow(db, segmentTables.CAS_TABLE, mapped);
}

export function insertCLP(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  loop2100Id: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "01": "claim_submitter_id",
    "02": "claim_status_code",
    "03": "submitted_charges",
    "04": "amount_paid",
    "05": "patient_responsibility",
    "06": "claim_filing_indicator_code",
    "07": "payer_internal_control_number",
    "08": "facility_code_value",
    "09": "claim_frequency_type_code",
    "10": "patient_discharge_status",
    "12": "drg_weight",
    "13": "discharge_fraction",
    "14": "patient_authorization_to_coordinate_benefits",
    "15": "exchange_rate",
    "16": "source_of_payment_typology_code",
  };
  let subSegmentInfo: SegmentInfo | null = null;

  if (data["11"]) {
    subSegmentInfo = {
      name: "C040",
      "1": data["11"],
      "2": data["11-1"],
      ...(data["11-2"] ? { "3": data["11-2"] } : {}),
      ...(data["11-3"] ? { "4": data["11-3"] } : {}),
      ...(data["11-4"] ? { "5": data["11-4"] } : {}),
      ...(data["11-5"] ? { "6": data["11-5"] } : {}),
      ...(data["11-6"] ? { "3": data["11-6"] } : {}),
      ...(data["11-7"] ? { "4": data["11-7"] } : {}),
      ...(data["11-8"] ? { "5": data["11-8"] } : {}),
      ...(data["11-9"] ? { "6": data["11-9"] } : {}),
      ...(data["11-10"] ? { "6": data["11-10"] } : {}),
    };
  }

  const mapped = mapValues(data, map, 0);
  mapped["x12_2100_id"] = loop2100Id;
  const clpId = insertRow(db, segmentTables.CLP_TABLE, mapped);
  if (subSegmentInfo != null) {
    insertC022(db, subSegmentInfo, clpId);
  }

  return clpId;
}

export function insertCUR(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  headerId: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "entity_id_code_1",
    "2": "currency_code_1",
    "3": "exchange_rate_1",
    "4": "entity_id_code_2",
    "5": "currency_code_2",
    "6": "currency_market_exchange_code",
    "7": "date_time_qualifier_1",
    "8": "date_1",
    "9": "time_1",
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

export function insertDTM(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  parentType: string,
  parentId: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "date_time_qualifier",
    "2": "date",
    "3": "time",
    "4": "time_code",
    "5": "date_time_period_format_qualifier",
    "6": "date_time_period",
  };
  const mapped = mapValues(data, map, order);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  // converting date and time
  if (mapped["date"] && map["date"] !== "") {
    mapped["date"] = formatEightDigitDate(mapped["date"] as string);
  }
  if (mapped["time"] && map["time"] !== "") {
    mapped["time"] = formatTime(mapped["time"] as string);
  }

  return insertRow(db, segmentTables.DTM_TABLE, mapped);
}

export function insertN1(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  parentType: string,
  parentId: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "entity_identifier",
    "2": "entity_name",
    "3": "id_code_qualifier",
    "4": "identification_code",
    "5": "entity_relationship_code",
    "6": "related_entity_identifier_code",
  };

  const mapped = mapValues(data, map, 0);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  return insertRow(db, segmentTables.N1_TABLE, mapped);
}

export function insertN2(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  n1Id: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "additional_name_1",
    "2": "additional_name_2",
  };

  const mapped = mapValues(data, map, order);
  mapped["x12_n1_id"] = n1Id;

  return insertRow(db, segmentTables.N2_TABLE, mapped);
}

export function insertN3(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  n1Id: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "address_information_1",
    "2": "address_information_2",
  };

  const mapped = mapValues(data, map, order);
  mapped["x12_n1_id"] = n1Id;

  return insertRow(db, segmentTables.N3_TABLE, mapped);
}

export function insertN4(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  n1Id: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "city_name",
    "2": "state_or_province_code",
    "3": "postal_code",
    "4": "country_code",
    "5": "location_qualifier",
    "6": "location_id",
    "7": "country_subdivision_code",
    "8": "postal_code_formatted",
  };

  const mapped = mapValues(data, map, order);
  mapped["x12_n1_id"] = n1Id;

  return insertRow(db, segmentTables.N4_TABLE, mapped);
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

export function insertPER(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  parentType: string,
  parentId: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "contact_function_code",
    "2": "name",
    "3": "communication_number_qualifier_1",
    "4": "communication_number_1",
    "5": "communication_number_qualifier_2",
    "6": "communication_number_2",
    "7": "communication_number_qualifier_3",
    "8": "communication_number_3",
    "9": "contact_inquiry_ref",
  };

  const mapped = mapValues(data, map, order);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  return insertRow(db, segmentTables.PER_TABLE, mapped);
}

export function insertRDM(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  loop1000Id: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "report_transmission_code",
    "2": "third_party_remittance_processor",
    "3": "communication_number",
  };

  let subSegmentInfo1: SegmentInfo | null = null;
  let subSegmentInfo2: SegmentInfo | null = null;

  const mapped = mapValues(data, map, 0);
  mapped["x12_1000_id"] = loop1000Id;

  if (data["4"]) {
    subSegmentInfo1 = {
      name: "C040",
      "1": data["4"],
      ...(data["4-1"] ? { "2": data["4-1"] } : {}),
      ...(data["4-2"] ? { "3": data["4-2"] } : {}),
      ...(data["4-3"] ? { "4": data["4-3"] } : {}),
      ...(data["4-4"] ? { "5": data["4-4"] } : {}),
      ...(data["4-5"] ? { "6": data["4-5"] } : {}),
    };
  }
  if (data["5"]) {
    subSegmentInfo2 = {
      name: "C040",
      "1": data["5"],
      ...(data["5-1"] ? { "2": data["5-1"] } : {}),
      ...(data["5-2"] ? { "3": data["5-2"] } : {}),
      ...(data["5-3"] ? { "4": data["5-3"] } : {}),
      ...(data["5-4"] ? { "5": data["5-4"] } : {}),
      ...(data["5-5"] ? { "6": data["5-5"] } : {}),
    };
  }
  const rdmId = insertRow(db, segmentTables.RDM_TABLE, mapped);
  if (subSegmentInfo1 != null) {
    insertC040(db, subSegmentInfo1, segmentTables.RDM_TABLE, rdmId, 0);
  }
  if (subSegmentInfo2 != null) {
    insertC040(db, subSegmentInfo2, segmentTables.RDM_TABLE, rdmId, 1);
  }

  return rdmId;
}

export function insertREF(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  parentType: string,
  parentId: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "id_qualifier",
    "2": "reference_id",
    "3": "description",
  };
  let subSegmentInfo: SegmentInfo | null = null;

  if (data["4"]) {
    subSegmentInfo = {
      name: "C040",
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
    insertC040(db, subSegmentInfo, segmentTables.REF_TABLE, refId, 0);
  }

  return refId;
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

export function insertTS2(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  loop2000Id: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "total_drg_amount",
    "2": "total_federal_specific_amount",
    "3": "total_hospital_specific_amount",
    "4": "total_disproportionate_share_amount",
    "5": "total_capital_amount",
    "6": "total_medical_education_amount",
    "7": "total_number_of_outlier_days",
    "8": "total_outlier_amount",
    "9": "total_cost_outlier_amount",
    "10": "drg_average_length_of_stay",
    "11": "total_number_of_discharges",
    "12": "total_number_of_cost_report_days",
    "13": "total_number_of_covered_days",
    "14": "total_number_of_noncovered_days",
    "15": "total_msp_pass_through_for_non_medicare",
    "16": "average_drg_weight",
    "17": "total_pps_capital_federal_specific_drg_amount",
    "18": "total_pps_capital_hospital_specific_drg_amount",
    "19": "total_pps_disproportionate_share_hospital_drg_amount",
  };
  const mapped = mapValues(data, map, 0);
  mapped["x12_2000_id"] = loop2000Id;

  return insertRow(db, segmentTables.TS2_TABLE, mapped);
}

export function insertTS3(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  loop2000Id: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "provider_number",
    "2": "facility_code_value",
    "3": "fiscal_year_end_date",
    "4": "number_of_claims",
    "5": "total_reported_charges",
    "6": "total_covered_charge",
    "7": "total_noncovered_charges",
    "8": "total_denied_charges",
    "9": "total_provider_payment",
    "10": "total_interest_paid",
    "11": "total_contractual_adjustment",
    "12": "total_gramm_rudman_reduction",
    "13": "total_msp_primary_payer_amount",
    "14": "total_blood_deductible_amount",
    "15": "non_lab_charges",
    "16": "total_coinsurance_amount",
    "17": "hcpcs_reported_charges",
    "18": "total_hcpcs_payable_amount",
    "19": "total_deductible_amount",
    "20": "total_professional_component_amount",
    "21": "total_msp_patient_liability_met",
    "22": "total_patient_reimbursement",
    "23": "total_pip_number_of_claims",
    "24": "total_pip_adjustment",
  };
  const mapped = mapValues(data, map, 0);
  mapped["x12_2000_id"] = loop2000Id;

  // fixing date
  const dateKey = "fiscal_year_end_date";
  if (mapped[dateKey] && mapped[dateKey] != "") {
    mapped[dateKey] = formatEightDigitDate(mapped[dateKey] as string);
  }

  return insertRow(db, segmentTables.TS3_TABLE, mapped);
}

// -------------------------------- composite tables --------------------------
export function insertC022(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  clpId: number | bigint
): number | bigint {
  const map: Record<string, string> = {
    "1": "health_care_code_list_qualifier_code",
    "2": "health_care_industry_code",
    "3": "health_care_date_time_period_format_qualifier",
    "4": "health_care_date_time_period",
    "5": "health_care_monetary_amount",
    "6": "health_care_quantity",
    "7": "health_care_code_list_version_id",
    "8": "code_ending_value",
    "9": "code_source_959_present_on_admission_indicator",
    "10": "health_care_industry_attribute_code",
  };

  const mapped = mapValues(data, map, 0);
  mapped["x12_clp_id"] = clpId;
  return insertRow(db, compositeTables.C022_TABLE, mapped);
}

export function insertC040(
  db: SqliteDatabaseType,
  data: SegmentInfo,
  parentType: string,
  parentId: number | bigint,
  order: number
): number | bigint {
  const map: Record<string, string> = {
    "1": "id_qualifier_1",
    "2": "id_1",
    "3": "id_qualifier_2",
    "4": "id_2",
    "5": "id_qualifier_3",
    "6": "id_3",
  };

  const mapped = mapValues(data, map, order);
  mapped["parent_type"] = parentType;
  mapped["parent_id"] = parentId;

  return insertRow(db, compositeTables.C040_TABLE, mapped);
}

// export function insertC058(

// )

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
