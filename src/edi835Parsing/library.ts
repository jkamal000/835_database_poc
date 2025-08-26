import Database from "better-sqlite3";
import type { Database as SqliteDatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";
import * as constants from "./constants";

const DB_FILE_NAME = "db.sqlite";

export function create835Tables(): SqliteDatabaseType {
  // TODO: replace with real connection to sql

  const dbDir = path.join(__dirname, "../..", "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }

  const dbPath = path.join(dbDir, DB_FILE_NAME);
  const db = new Database(dbPath);

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.N1_TABLE} (
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
      parent_id                         INTEGER NOT NULL, 
    );
  `
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.N2_TABLE} (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_order       INTEGER NOT NULL,

    additional_name_1   VARCHAR(60) NOT NULL,
    additional_name_2   VARCHAR(60),
    x12_n1_id           INTEGER NOT NULL,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (x12_n1_id) REFERENCES ${constants.N1_TABLE}(id) ON DELETE CASCADE
    );`
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.N3_TABLE} (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_order           INTEGER NOT NULL,

    address_information_1   VARCHAR(55) NOT NULL,
    address_information_2   VARCHAR(55),

    x12_n1_id               INTEGER NOT NULL,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (x12_n1_id) REFERENCES ${constants.N1_TABLE}(id) ON DELETE CASCADE
    );`
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.N4_TABLE} (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_order               INTEGER NOT NULL,

    city_name                   VARCHAR(30),
    state_or_province_code      VARCHAR(2),
    country_code                VARCHAR(3),
    location_qualifier          VARCHAR(2),
    location_id                 VARCHAR(30),
    country_subdivision_code    VARCHAR(3),
    postal_code_formatted       VARCHAR(20)

    x12_n1_id                   INTEGER NOT NULL,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (x12_n1_id) REFERENCES ${constants.N1_TABLE}(id) ON DELETE CASCADE
    );`
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.REF_TABLE} (
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
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.PER_TABLE} (
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
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.RDM_TABLE} (
    id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_order                       INTEGER NOT NULL,

    report_transmission_code            VARCHAR(2) NOT NULL,
    name                                VARCHAR(60),
    communication_number                VARCHAR(2048),

    ref_id_qualifier_1_1                VARCHAR(3) NOT NULL,    -- RDM04-01
    ref_id_1_1                          VARCHAR(80) NOT NULL,   -- RDM04-02
    ref_id_qualifier_1_2                VARCHAR(3),             -- RDM04-03
    ref_id_1_2                          VARCHAR(80),            -- RDM04-04
    ref_id_qualifier_1_3                VARCHAR(3),             -- RDM04-05
    ref_id_1-3                          VARCHAR(80),            -- RDM04-06

    ref_id_qualifier_2_1                VARCHAR(3) NOT NULL,    -- RDM05-01
    ref_id_2_1                          VARCHAR(80) NOT NULL,   -- RDM05-02
    ref_id_qualifier_2_2                VARCHAR(3),             -- RDM05-03
    ref_id_2_2                          VARCHAR(80),            -- RDM05-04
    ref_id_qualifier_2_3                VARCHAR(3),             -- RDM05-05
    ref_id_2-3                          VARCHAR(80),            -- RDM05-06

    x12_1000_id                         INTEGER,
    created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (x12_1000_id) REFERENCES ${constants.X12_1000_TABLE}(id) ON DELETE CASCADE 
    );`
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.DTM_TABLE} (
    id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_order                       INTEGER NOT NULL,

    date_time_qualifier                 VARCHAR(3) NOT NULL,
    date                                TIMESTAMP,

    parent_type                         VARCHAR(50) NOT NULL,   -- e.g., 'x12_n1', 'clp_x12'
    parent_id                           INTEGER NOT NULL,
    created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  );

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS ${constants.X12_1000_TABLE} (
    id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_order                       INTEGER NOT NULL,
    x12_header_id                       INTEGER NOT NULL,
    created_at                          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (x12_header_id) REFERENCES ${constants.HEADER_TABLE}(id)
    );`
  );

  return db;
}
