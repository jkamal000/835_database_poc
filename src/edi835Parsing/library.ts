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

      id_code                   VARCHAR(3) NOT NULL,      -- ST-01
      transaction_set_control   VARCHAR(9) NOT NULL,      -- ST-02
      convention_reference      VARCHAR(35),              -- ST-03

      x12_header_id             INTEGER NOT NULL,
      created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.BPR_TABLE} (
      id                                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                             INTEGER NOT NULL,

      transaction_handling_code                 VARCHAR(2) NOT NULL,        -- BPR-01
      payment_amount                            DECIMAL(18,2) NOT NULL,     -- BPR-02
      credit_debit_flag                         VARCHAR(1) NOT NULL,        -- BPR-03
      payment_method_code                       VARCHAR(3) NOT NULL,        -- BPR-03
      payment_format_code                       VARCHAR(10),                -- BPR-05

      odfi_id_number_qualifier                  VARCHAR(2),                 -- BPR-06
      odfi_id_number                            VARCHAR(12),                -- BPR-07
      payer_financial_asset_type                VARCHAR(3),                 -- BPR-08
      payer_account_number                      VARCHAR(35),                -- BPR-09
      originating_company_id                    VARCHAR(10),                -- BPR-10
      originating_company_supplemental_code     VARCHAR(9),                 -- BPR-11

      rdfi_id_number_qualifier                  VARCHAR(2),                 -- BPR-12
      rdfi_id_number                            VARCHAR(12),                -- BPR-13
      receiver_asset_type                       VARCHAR(3),                 -- BPR-14
      receiver_account_number                   VARCHAR(35),                -- BPR-15
      payment_effective_date                    DATE,                       -- BPR-16
      reason_for_payment                        VARCHAR(3),                 -- BPR-17

      id_number_qualifier_for_returns           VARCHAR(2),                 -- BPR-18
      dfi_id_number_for_returns                 VARCHAR(12),                -- BPR-19
      asset_type_for_return_account             VARCHAR(20),                -- BPR-20
      account_number_for_return                 VARCHAR(35),                -- BPR-21

      x12_header_id                             INTEGER NOT NULL,
      created_at                                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.NTE_TABLE} (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order             INTEGER NOT NULL,

      note_reference_code       VARCHAR(3),         -- NTE-01
      description               VARCHAR(80),        -- NTE-02

      x12_header_id             INTEGER NOT NULL,
      created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.TRN_TABLE} (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order             INTEGER NOT NULL,

      trace_type_code           VARCHAR(2) NOT NULL,     -- TRN-01
      transaction_id            VARCHAR(80) NOT NULL,    -- TRN-02
      organization_id           VARCHAR(10),             -- TRN-03
      subdivision_id            VARCHAR(80),             -- TRN-04

      x12_header_id             INTEGER NOT NULL,
      created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.CUR_TABLE} (
      id                                        INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                             INTEGER NOT NULL,

      entity_id_code_1                          VARCHAR(3) NOT NULL,  -- CUR-01
      currency_code_1                           VARCHAR(3) NOT NULL,  -- CUR-02
      exchange_rate_1                           DECIMAL(10, 6),       -- CUR-03

      entity_id_code_2                          VARCHAR(3),           -- CUR-04
      currency_code_2                           VARCHAR(3),           -- CUR-05

      currency_market_exchange_code             VARCHAR(3),           -- CUR-06

      date_time_qualifier_1                     VARCHAR(3),           -- CUR-07
      date_1                                    DATE,                 -- CUR-08
      time_1                                    TIME(2),              -- CUR-09

      date_time_qualifier_2                     VARCHAR(3),           -- CUR-10
      date_2                                    DATE,                 -- CUR-11
      time_2                                    TIME(2),              -- CUR-12

      date_time_qualifier_3                     VARCHAR(3),           -- CUR-13
      date_3                                    DATE,                 -- CUR-14
      time_3                                    TIME(2),              -- CUR-15

      date_time_qualifier_4                     VARCHAR(3),           -- CUR-16
      date_4                                    DATE,                 -- CUR-17
      time_4                                    TIME(2),              -- CUR-18

      date_time_qualifier_5                     VARCHAR(3),           -- CUR-19
      date_5                                    DATE,                 -- CUR-20
      time_5                                    TIME(2),              -- CUR-21

      x12_header_id                             INTEGER NOT NULL,
      created_at                                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_header_id) REFERENCES ${constants.compositeTables.HEADER_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N1_TABLE} (
      id                                INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                     INTEGER NOT NULL,

      entity_identifier                 VARCHAR(3) NOT NULL,      -- N1-01
      entity_name                       VARCHAR(60),              -- N1-02
      id_code_qualifier                 VARCHAR(2),               -- N1-03
      identification_code               VARCHAR(80),              -- N1-04
      entity_relationship_code          VARCHAR(2),               -- N1-05
      related_entity_identifier_code    VARCHAR(3),               -- N1-06

      parent_type                       VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                         INTEGER NOT NULL,
      created_at                        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N2_TABLE} (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order       INTEGER NOT NULL,

      additional_name_1   VARCHAR(60) NOT NULL,       -- N2-01
      additional_name_2   VARCHAR(60),                -- N2-02
      x12_n1_id           INTEGER NOT NULL,

      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_n1_id) REFERENCES ${constants.segmentTables.N1_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N3_TABLE} (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order           INTEGER NOT NULL,

      address_information_1   VARCHAR(55) NOT NULL,   -- N3-01
      address_information_2   VARCHAR(55),            -- N3-02

      x12_n1_id               INTEGER NOT NULL,
      created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_n1_id) REFERENCES ${constants.segmentTables.N1_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.N4_TABLE} (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order               INTEGER NOT NULL,

      city_name                   VARCHAR(30),        -- N4-01
      state_or_province_code      VARCHAR(2),         -- N4-02
      postal_code                 VARCHAR(15),        -- N4-03
      country_code                VARCHAR(3),         -- N4-04
      location_qualifier          VARCHAR(2),         -- N4-05
      location_id                 VARCHAR(30),        -- N4-06
      country_subdivision_code    VARCHAR(3),         -- N4-07
      postal_code_formatted       VARCHAR(20),        -- N4-08

      x12_n1_id                   INTEGER NOT NULL,
      created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_n1_id) REFERENCES ${constants.segmentTables.N1_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.REF_TABLE} (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order         INTEGER NOT NULL,

      id_qualifier_1        VARCHAR(3) NOT NULL,    -- REF01
      id_1                  VARCHAR(80) NOT NULL,   -- REF02
      description           VARCHAR(80),            -- REF03

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

      contact_function_code               VARCHAR(2) NOT NULL,  -- PER-01
      name                                VARCHAR(60),          -- PER-02

      communication_number_qualifier_1    VARCHAR(2),           -- PER-03
      communication_number_1              VARCHAR(2048),        -- PER-04

      communication_number_qualifier_2    VARCHAR(2),           -- PER-05
      communication_number_2              VARCHAR(2048),        -- PER-06

      communication_number_qualifier_3    VARCHAR(2),           -- PER-07
      communication_number_3              VARCHAR(2048),        -- PER-08

      contact_inquiry_ref                 VARCHAR(20),          -- PER-09

      parent_type                         VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                           INTEGER NOT NULL,
      created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.RDM_TABLE} (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                       INTEGER NOT NULL,

      report_transmission_code            VARCHAR(2) NOT NULL,    -- RDM-01
      third_party_remittance_processor    VARCHAR(60),            -- RDM-02
      communication_number                VARCHAR(2048),          -- RDM-03

      ref_id_qualifier_1_1                VARCHAR(3) NOT NULL,    -- RDM-04-01
      ref_id_1_1                          VARCHAR(80) NOT NULL,   -- RDM-04-02
      ref_id_qualifier_1_2                VARCHAR(3),             -- RDM-04-03
      ref_id_1_2                          VARCHAR(80),            -- RDM-04-04
      ref_id_qualifier_1_3                VARCHAR(3),             -- RDM-04-05
      ref_id_1_3                          VARCHAR(80),            -- RDM-04-06

      ref_id_qualifier_2_1                VARCHAR(3) NOT NULL,    -- RDM-05-01
      ref_id_2_1                          VARCHAR(80) NOT NULL,   -- RDM-05-02
      ref_id_qualifier_2_2                VARCHAR(3),             -- RDM-05-03
      ref_id_2_2                          VARCHAR(80),            -- RDM-05-04
      ref_id_qualifier_2_3                VARCHAR(3),             -- RDM-05-05
      ref_id_2_3                          VARCHAR(80),            -- RDM-05-06

      x12_1000_id                         INTEGER,
      created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_1000_id) REFERENCES ${constants.compositeTables.X12_1000_TABLE}(id) ON DELETE CASCADE
    );`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS ${constants.segmentTables.DTM_TABLE} (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                       INTEGER NOT NULL,

      date_time_qualifier                 VARCHAR(3) NOT NULL,      -- DTM-01
      date                                DATE,                     -- DTM-02
      time                                TIME(2),                  -- DTM-03
      time_code                           VARCHAR(2),               -- DTM-04
      date_time_period_format_qualifier   VARCHAR(3),               -- DTM-05
      date_time_period                    VARCHAR(35),              -- DTM-06

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

      provider_number                         VARCHAR(80) NOT NULL,    -- TS3-01
      facility_code_value                     VARCHAR(3) NOT NULL,     -- TS3-02
      fiscal_year_end_date                    DATE,                    -- TS3-03
      number_of_claims                        DECIMAL(15,0),           -- TS3-04
      total_reported_charges                  DECIMAL(18, 2),          -- TS3-05
      total_covered_charges                   DECIMAL(18, 2),          -- TS3-06
      total_noncovered_charges                DECIMAL(18, 2),          -- TS3-07
      total_denied_charges                    DECIMAL(18, 2),          -- TS3-08
      total_provider_payment                  DECIMAL(18, 2),          -- TS3-09
      total_interest_paid                     DECIMAL(18, 2),          -- TS3-10
      total_contractual_adjustment            DECIMAL(18, 2),          -- TS3-11
      total_gramm_rudman_reduction            DECIMAL(18, 2),          -- TS3-12
      total_msp_primary_payer_amount          DECIMAL(18, 2),          -- TS3-13
      total_blood_deductible_amount           DECIMAL(18, 2),          -- TS3-14
      non_lab_charges                         DECIMAL(18, 2),          -- TS3-15
      total_coinsurance_amount                DECIMAL(18, 2),          -- TS3-16
      hcpcs_reported_charges                  DECIMAL(18, 2),          -- TS3-17
      total_hcpcs_payable_amount              DECIMAL(18, 2),          -- TS3-18
      total_deductible_amount                 DECIMAL(18, 2),          -- TS3-19
      total_professional_component_amount     DECIMAL(18, 2),          -- TS3-20
      total_msp_patient_liability_met         DECIMAL(18, 2),          -- TS3-21
      total_patient_reimbursement             DECIMAL(18, 2),          -- TS3-22
      total_pip_number_of_claims              DECIMAL(15, 1),          -- TS3-23
      total_pip_adjustment                    DECIMAL(18, 2),          -- TS3-24

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

      total_drg_amount                                      DECIMAL(18, 2),   --TS2-01
      total_federal_specific_amount                         DECIMAL(18, 2),   --TS2-02
      total_hospital_specific_amount                        DECIMAL(18, 2),   --TS2-03
      total_disproportionate_share_amount                   DECIMAL(18, 2),   --TS2-04
      total_capital_amount                                  DECIMAL(18, 2),   --TS2-05
      total_medical_education_amount                        DECIMAL(18, 2),   --TS2-06
      total_number_of_outlier_days                          DECIMAL(15, 0),   --TS2-07
      total_outlier_amount                                  DECIMAL(18, 2),   --TS2-08
      total_cost_outlier_amount                             DECIMAL(18, 2),   --TS2-09
      drg_average_length_of_stay                            DECIMAL(15, 0),   --TS2-10
      total_number_of_discharges                            DECIMAL(15, 0),   --TS2-11
      total_number_of_cost_report_days                      DECIMAL(15, 0),   --TS2-12
      total_number_of_covered_days                          DECIMAL(15, 0),   --TS2-13
      total_number_of_noncovered_days                       DECIMAL(15, 0),   --TS2-14
      total_msp_pass_through_for_non_medicare               DECIMAL(18, 2),   --TS2-15
      average_drg_weight                                    DECIMAL(15, 4),   --TS2-16
      total_pps_capital_federal_specific_drg_amount         DECIMAL(18, 2),   --TS2-17
      total_pps_capital_hospital_specific_drg_amount        DECIMAL(18, 2),   --TS2-18
      total_pps_disproportionate_share_hospital_drg_amount  DECIMAL(18, 2),   --TS2-19


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

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.segmentTables.CLP_TABLE} (
      id                                              INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                                   INTEGER NOT NULL,
      
      claim_submitter_id                              VARCHAR(38),          -- CLP-01
      claim_status_code                               VARCHAR(2),           -- CLP-02
      submitted_charges                               DECIMAL(18, 2),       -- CLP-03
      amount_paid                                     DECIMAL(18, 2),       -- CLP-04
      patient_responsibility                          DECIMAL(18, 2),       -- CLP-05
      claim_filing_indicator_code                     VARCHAR(2),           -- CLP-06
      payer_internal_control_number                   VARCHAR(80),          -- CLP-07
      facility_code_value                             VARCHAR(3),           -- CLP-08
      claim_frequency_type_code                       VARCHAR(1),           -- CLP-09
      patient_discharge_status                        VARCHAR(2),           -- CLP-10

      health_care_code_list_qualifier_code            VARCHAR(3) NOT NULL,  -- CLP-11-01 C022-01
      health_care_code_list_qualifier_code            VARCHAR(3) NOT NULL,  -- CLP-11-01 C022-01
      health_care_industry_code                       VARCHAR(30) NOT NULL, -- CLP-11-02 C022-02
      health_care_date_time_period_format_qualifier   VARCHAR(3),           -- CLP-11-03 C022-03
      health_care_date_time_period                    VARCHAR(35),          -- CLP-11-04 C022-04
      health_care_monetary_amount                     DECIMAL(18, 2),       -- CLP-11-05 C022-05
      health_care_quantity                            DECIMAL(15, 0),       -- CLP-11-06 C022-06
      health_care_code_list_version_id                VARCHAR(30),          -- CLP-11-07 C022-07
      code_ending_value                               VARCHAR(30),          -- CLP-11-08 C022-08
      code_source_959_present_on_admission_indicator  VARCHAR(30),          -- CLP-11-09 C022-09
      health_care_industry_attribute_code             VARCHAR(30),          -- CLP-11-10 C022-10

      drg_weight                                      DECIMAL(15, 4),       -- CLP-12
      discharge_fraction                              DECIMAL(10, 2),       -- CLP-13
      patient_authorization_to_coordinate_benefits    VARCHAR(1),           -- CLP-14
      exchange_rate                                   DECIMAL(10, 6),       -- CLP-15
      source_of_payment_typology_code                 VARCHAR(6),           -- CLP-16

      x12_2100_id                                     INTEGER NOT NULL,
      created_at                                      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (x12_2100) REFERENCES ${constants.compositeTables.X12_2100_TABLE}(id) ON DELETE CASCADE
    );
    `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.segmentTables.CAS_TABLE} (
      id                                INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                     INTEGER NOT NULL,
      
      claim_adjustment_group_code       VARCHAR(10) NOT NULL,       -- CAS-01
      claim_adjustment_reason_code_1    VARCHAR(5) NOT NULL,        -- CAS-02
      adjustment_amount_1               DECIMAL(18, 2) NOT NULL,    -- CAS-03
      units_of_service_adjusted_1       DECIMAL(15, 0),             -- CAS-04
      claim_adjustment_reason_code_2    VARCHAR(5),                 -- CAS-05
      adjustment_amount_2               DECIMAL(18, 2),             -- CAS-06
      units_of_service_adjusted_2       DECIMAL(15, 0),             -- CAS-07
      claim_adjustment_reason_code_3    VARCHAR(5),                 -- CAS-08
      adjustment_amount_3               DECIMAL(18, 2),             -- CAS-09
      units_of_service_adjusted_3       DECIMAL(15, 0),             -- CAS-10
      claim_adjustment_reason_code_4    VARCHAR(5),                 -- CAS-11
      adjustment_amount_4               DECIMAL(18, 2),             -- CAS-12
      units_of_service_adjusted_4       DECIMAL(15, 0),             -- CAS-13
      claim_adjustment_reason_code_5    VARCHAR(5),                 -- CAS-14
      adjustment_amount_5               DECIMAL(18, 2),             -- CAS-15
      units_of_service_adjusted_5       DECIMAL(15, 0),             -- CAS-16
      claim_adjustment_reason_code_6    VARCHAR(5),                 -- CAS-17
      adjustment_amount_6               DECIMAL(18, 2),             -- CAS-18
      units_of_service_adjusted_6       DECIMAL(15, 0),             -- CAS-19

      parent_type                       VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                         INTEGER NOT NULL,
      created_at                        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ); 
    `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.segmentTables.RAS_TABLE} (
      id                                    INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                         INTEGER NOT NULL,

      amount_of_adjustment                  DECIMAL(18, 2) NOT NULL,  -- RAS-01
      claim_adjustment_group_code           VARCHAR(10) NOT NULL,     -- RAS-02

      adjustment_reason_code                VARCHAR(5) NOT NULL,      -- RAS-03-01 C058-01
      adjustment_code_list_qualifier_code   VARCHAR(3),               -- RAS-03-02 C058-02
      industry_code_1                       VARCHAR(30),              -- RAS-03-03 C058-03
      industry_code_2                       VARCHAR(30),              -- RAS-03-04 C058-04
      industry_code_3                       VARCHAR(30),              -- RAS-03-05 C058-05
      industry_code_4                       VARCHAR(30),              -- RAS-03-06 C058-06
      industry_code_5                       VARCHAR(30),              -- RAS-03-07 C058-07

      units_of_service_adjusted             DECIMAL(15, 0),           -- RAS-04

      parent_type                           VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                             INTEGER NOT NULL,
      created_at                            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.segmentTables.NM1_TABLE} (
      id                                    INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_order                         INTEGER NOT NULL,

      entity_id_code                        VARCHAR(3) NOT NULL,        -- NM1-01
      entity_type_qualifier                 VARCHAR(1) NOT NULL,        -- NM1-02
      last_name_or_organization_name        VARCHAR(80),                -- NM1-03
      first_name                            VARCHAR(35),                -- NM1-04
      middle_name                           VARCHAR(25),                -- NM1-05
      name_prefix                           VARCHAR(10),                -- NM1-06
      name_suffix                           VARCHAR(10),                -- NM1-07
      id_code_qualifier                     VARCHAR(2),                 -- NM1-08
      id_code                               VARCHAR(80),                -- NM1-09
      entity_relationship_code              VARCHAR(2),                 -- NM1-10
      entity_id_code_2                      VARCHAR(3),                 -- NM1-11
      last_name_or_organization_name_2      VARCHAR(80),                -- NM1-12

      parent_type                           VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
      parent_id                             INTEGER NOT NULL,
      created_at                            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
  ).run();
  return db;
}
