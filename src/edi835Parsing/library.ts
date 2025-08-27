import Database from "better-sqlite3";
import type { Database as SqliteDatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";
import { constants } from "./constants";

const DB_FILE_NAME = "db.sqlite";

export function create835Tables(): SqliteDatabaseType {
  // TODO: replace with real connection to sql

  const dbDir = path.join(__dirname, "../..", "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }

  const dbPath = path.join(dbDir, DB_FILE_NAME);
  const db = new Database(dbPath);

  /// creating tables needed for header portion
  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.compositeTables.HEADER_TABLE} (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.ST_TABLE} (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order             INTEGER NOT NULL,

      id_code                   VARCHAR(3) NOT NULL,
      transaction_set_control   VARCHAR(9) NOT NULL,
      convention_reference      VARCHAR(35),

      x12_header_id             INTEGER NOT NULL,
      created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.BPR_TABLE} (
      id                                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                             INTEGER NOT NULL,

      transaction_handling_code                 VARCHAR(2) NOT NULL,
      payment_amount                            DECIMAL(18,2) NOT NULL,
      credit_debit_flag                         VARCHAR(1) NOT NULL,
      payment_method_code                       VARCHAR(3) NOT NULL,
      payment_format_code                       VARCHAR(10),

      odfi_id_number_qualifier                  VARCHAR(2),
      odfi_id_number                            VARCHAR(12),
      payer_financial_asset_type                VARCHAR(3),
      payer_account_number                      VARCHAR(35),
      originating_company_id                    VARCHAR(10),
      originating_company_supplemental_code     VARCHAR(9),

      rdfi_id_number_qualifier                  VARCHAR(2),
      rdfi_id_number                            VARCHAR(12),
      receiver_asset_type                       VARCHAR(3),
      receiver_account_number                   VARCHAR(35),
      payment_effective_date                    DATE,
      reason_for_payment                        VARCHAR(3),

      id_number_qualifier_for_returns           VARCHAR(2),
      dfi_id_number_for_returns                 VARCHAR(12),
      asset_type_for_return_account             VARCHAR(20),
      account_number_for_return                 VARCHAR(35),

      x12_header_id                             INTEGER NOT NULL,
      created_at                                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.NTE_TABLE} (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order             INTEGER NOT NULL,

      note_reference_code       VARCHAR(3),
      description               VARCHAR(80),

      x12_header_id             INTEGER NOT NULL,
      created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.TRN_TABLE} (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order             INTEGER NOT NULL,

      trace_type_code           VARCHAR(2) NOT NULL,
      transaction_id            VARCHAR(80) NOT NULL,
      organization_id           VARCHAR(10),
      subdivision_id            VARCHAR(80),

      x12_header_id             INTEGER NOT NULL,
      created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.CUR_TABLE} (
      id                                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                             INTEGER NOT NULL,

      entity_id_code_1                          VARCHAR(3) NOT NULL,
      currency_code_1                           VARCHAR(3) NOT NULL,
      exchange_rate_1                           DECIMAL(10, 6),

      entity_id_code_2                          VARCHAR(3),
      currency_code_2                           VARCHAR(3),

      currency_market_exchange_code             VARCHAR(3),

      date_time_qualifier_1                     VARCHAR(3),
      date_1                                    DATE,
      time_1                                    TIME(2),

      date_time_qualifier_2                     VARCHAR(3),
      date_2                                    DATE,
      time_2                                    TIME(2),

      date_time_qualifier_3                     VARCHAR(3),
      date_3                                    DATE,
      time_3                                    TIME(2),

      date_time_qualifier_4                     VARCHAR(3),
      date_4                                    DATE,
      time_4                                    TIME(2),

      date_time_qualifier_5                     VARCHAR(3),
      date_5                                    DATE,
      time_5                                    TIME(2),

      x12_header_id                             INTEGER NOT NULL,
      created_at                                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N1_TABLE} (
      id                                INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                     INTEGER NOT NULL,

      entity_identifier                 VARCHAR(3) NOT NULL,
      entity_name                       VARCHAR(60),
      id_code_qualifier                 VARCHAR(2),
      identification_code               VARCHAR(80),
      entity_relationship_code          VARCHAR(2),
      related_entity_identifier_code    VARCHAR(3),

      created_at                        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      parent_type                       VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                         INTEGER NOT NULL
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N2_TABLE} (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order       INTEGER NOT NULL,

      additional_name_1   VARCHAR(60) NOT NULL,
      additional_name_2   VARCHAR(60),
      x12_n1_id           INTEGER NOT NULL,

      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_n1_id) REFERENCES ${constants.segmentTables.N1_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N3_TABLE} (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order           INTEGER NOT NULL,

      address_information_1   VARCHAR(55) NOT NULL,
      address_information_2   VARCHAR(55),

      x12_n1_id               INTEGER NOT NULL,
      created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_n1_id) REFERENCES ${constants.segmentTables.N1_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N4_TABLE} (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order               INTEGER NOT NULL,

      city_name                   VARCHAR(30),
      state_or_province_code      VARCHAR(2),
      country_code                VARCHAR(3),
      location_qualifier          VARCHAR(2),
      location_id                 VARCHAR(30),
      country_subdivision_code    VARCHAR(3),
      postal_code_formatted       VARCHAR(20),

      x12_n1_id                   INTEGER NOT NULL,
      created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_n1_id) REFERENCES ${constants.segmentTables.N1_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.REF_TABLE} (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order         INTEGER NOT NULL,

      id_qualifier_1        VARCHAR(3) NOT NULL,
      id_1                  VARCHAR(80) NOT NULL,
      description           VARCHAR(80),

      id_qualifier_2        VARCHAR(3) NOT NULL,    -- REF04-01
      id_2                  VARCHAR(80) NOT NULL,   -- REF04-02

      id_qualifier_3        VARCHAR(3),             -- REF04-03
      id_3                  VARCHAR(80),            -- REF04-04

      id_qualifier_4        VARCHAR(3),             -- REF04-05
      id_4                  VARCHAR(80),            -- REF04-06

      parent_type           VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id             INTEGER NOT NULL,
      created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.PER_TABLE} (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                       INTEGER NOT NULL,

      contact_function_code               VARCHAR(2) NOT NULL,
      name                                VARCHAR(60),

      communication_number_qualifier_1    VARCHAR(2),
      communication_number_1              VARCHAR(2048),

      communication_number_qualifier_2    VARCHAR(2),
      communication_number_2              VARCHAR(2048),

      communication_number_qualifier_3    VARCHAR(2),
      communication_number_3              VARCHAR(2048),

      contact_inquiry_ref                 VARCHAR(20),

      parent_type                         VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                           INTEGER NOT NULL,
      created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.RDM_TABLE} (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                       INTEGER NOT NULL,

      report_transmission_code            VARCHAR(2) NOT NULL,
      third_party_remittance_processor    VARCHAR(60),
      communication_number                VARCHAR(2048),

      ref_id_qualifier_1_1                VARCHAR(3) NOT NULL,    -- RDM04-01
      ref_id_1_1                          VARCHAR(80) NOT NULL,   -- RDM04-02
      ref_id_qualifier_1_2                VARCHAR(3),             -- RDM04-03
      ref_id_1_2                          VARCHAR(80),            -- RDM04-04
      ref_id_qualifier_1_3                VARCHAR(3),             -- RDM04-05
      ref_id_1_3                          VARCHAR(80),            -- RDM04-06

      ref_id_qualifier_2_1                VARCHAR(3) NOT NULL,    -- RDM05-01
      ref_id_2_1                          VARCHAR(80) NOT NULL,   -- RDM05-02
      ref_id_qualifier_2_2                VARCHAR(3),             -- RDM05-03
      ref_id_2_2                          VARCHAR(80),            -- RDM05-04
      ref_id_qualifier_2_3                VARCHAR(3),             -- RDM05-05
      ref_id_2_3                          VARCHAR(80),            -- RDM05-06

      x12_1000_id                         INTEGER,
      created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_1000_id) REFERENCES ${constants.compositeTables.X12_1000_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.DTM_TABLE} (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                       INTEGER NOT NULL,

      date_time_qualifier                 VARCHAR(3) NOT NULL,
      date                                DATE,
      time                                TIME(2),
      time_code                           VARCHAR(2),
      date_time_period_format_qualifier   VARCHAR(3),
      date_time_period                    VARCHAR(35),

      parent_type                         VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                           INTEGER NOT NULL,
      created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.compositeTables.X12_1000_TABLE} (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                       INTEGER NOT NULL,
      x12_header_id                       INTEGER NOT NULL,
      created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id)
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.TS3_TABLE} (
      id                                      INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                           INTEGER NOT NULL,

      provider_number                         VARCHAR(80) NOT NULL,
      facility_code_value                     VARCHAR(3) NOT NULL,
      fiscal_year_end_date                    DATE,
      number_of_claims                        DECIMAL(15,0),
      total_reported_charges                  DECIMAL(18, 2),
      total_covered_charges                   DECIMAL(18, 2),
      total_noncovered_charges                DECIMAL(18, 2),
      total_denied_charges                    DECIMAL(18, 2),
      total_provider_payment                  DECIMAL(18, 2),
      total_interest_paid                     DECIMAL(18, 2),
      total_contractual_adjustment            DECIMAL(18, 2),
      total_gramm_rudman_reduction            DECIMAL(18, 2),
      total_msp_primary_payer_amount          DECIMAL(18, 2),
      total_blood_deductible_amount           DECIMAL(18, 2),
      non_lab_charges                         DECIMAL(18, 2),
      total_coinsurance_amount                DECIMAL(18, 2),
      hcpcs_reported_charges                  DECIMAL(18, 2),
      total_hcpcs_payable_amount              DECIMAL(18, 2),
      total_deductible_amount                 DECIMAL(18, 2),
      total_professional_component_amount     DECIMAL(18, 2),
      total_msp_patient_liability_met         DECIMAL(18, 2),
      total_patient_reimbursement             DECIMAL(18, 2),
      total_pip_number_of_claims              DECIMAL(15, 1),
      total_pip_adjustment                    DECIMAL(18, 2),

      x12_2000_id                             INTEGER NOT NULL,
      created_at                              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_2000_id) REFERENCES ${constants.compositeTables.X12_2000_TABLE}(id) ON DELETE CASCADE
    )
    `
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.TS2_TABLE} (
      id                                                    INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                                         INTEGER NOT NULL,

      total_drg_amount                                      DECIMAL(18, 2),
      total_federal_specific_amount                         DECIMAL(18, 2),
      total_hospital_specific_amount                        DECIMAL(18, 2),
      total_disproportionate_share_amount                   DECIMAL(18, 2),
      total_capital_amount                                  DECIMAL(18, 2),
      total_medical_education_amount                        DECIMAL(18, 2),
      total_number_of_outlier_days                          DECIMAL(15, 0),
      total_outlier_amount                                  DECIMAL(18, 2),
      total_cost_outlier_amount                             DECIMAL(18, 2),
      drg_average_length_of_stay                            DECIMAL(15, 0),
      total_number_of_discharges                            DECIMAL(15, 0),
      total_number_of_cost_report_days                      DECIMAL(15, 0),
      total_number_of_covered_days                          DECIMAL(15, 0),
      total_number_of_noncovered_days                       DECIMAL(15, 0),
      total_msp_pass_through_for_non_medicare               DECIMAL(18, 2),
      average_drg_weight                                    DECIMAL(15, 0),
      total_pps_capital_federal_specific_drg_amount         DECIMAL(18, 2),
      total_pps_capital_hospital_specific_drg_amount        DECIMAL(18, 2),
      total_pps_disproportionate_share_hospital_drg_amount  DECIMAL(18, 2),


      x12_2000_id                                           INTEGER NOT NULL,
      created_at                                            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_2000_id) REFERENCES ${constants.compositeTables.X12_2000_TABLE}(id) ON DELETE CASCADE
    )
    `
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.compositeTables.X12_2000_TABLE} (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order   INTEGER NOT NULL, -- takes place of transaction set line number (LX)
      x12_header_id   INTEGER NOT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  return db;
}
