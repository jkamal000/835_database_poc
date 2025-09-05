import { SinonSandbox, SinonStub, createSandbox } from "sinon";
import { DataInserter } from "./dataInserter";
import type { Database as SqliteDatabaseType } from "better-sqlite3";
import { expect } from "chai";
import { SegmentInfo } from "./interfaces/segmentInfo";

describe.only("Data Inserter", () => {
  let sandbox: SinonSandbox;
  let statement: { run: SinonStub };
  let db: { prepare: SinonStub };
  let runResult: { lastInsertRowid: number | bigint };
  let inserter: DataInserter;

  beforeEach(() => {
    sandbox = createSandbox();

    db = { prepare: sandbox.stub() };

    statement = { run: sandbox.stub() };
    runResult = { lastInsertRowid: 0 };
    db.prepare.returns(statement);
    statement.run.returns(runResult);

    inserter = new DataInserter(db as unknown as SqliteDatabaseType);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should insert header table correctly", () => {
    const result = inserter.insertHeader();

    expect(
      db.prepare.calledWithExactly("INSERT INTO x12_835_header DEFAULT VALUES;")
    ).to.be.true;
    expect(statement.run.calledOnce).to.be.true;
    expect(result).equals(0);
  });

  it("should insert main 1000 loop table", () => {
    let order = 5;
    const headerId = 34;
    let result = inserter.insert1000(order, headerId);

    expect(
      db.prepare.calledWithExactly(
        "INSERT INTO x12_835_loop_1000 (segment_order, x12_header_id) VALUES (?, ?);"
      )
    ).to.be.true;
    expect(statement.run.calledOnceWithExactly(order, headerId)).to.be.true;
    expect(result).equals(0);
  });

  it("should insert main 2000 loop table", () => {
    let order = 5;
    const headerId = 34;
    let result = inserter.insert2000(order, headerId);

    expect(
      db.prepare.calledWithExactly(
        "INSERT INTO x12_835_loop_2000 (segment_order, x12_header_id) VALUES (?, ?);"
      )
    ).to.be.true;
    expect(statement.run.calledOnceWithExactly(order, headerId)).to.be.true;
    expect(result).equals(0);
  });

  it("should insert main 2100 loop table", () => {
    let order = 5;
    const loop2000 = 34;
    runResult.lastInsertRowid = 233;
    let result = inserter.insert2100(order, loop2000);

    expect(
      db.prepare.calledWithExactly(
        "INSERT INTO x12_835_loop_2100 (segment_order, x12_2000_id) VALUES (?, ?);"
      )
    ).to.be.true;
    expect(statement.run.calledOnceWithExactly(order, loop2000)).to.be.true;
    expect(result).equals(233);
  });

  it("should insert main 2105 loop table", () => {
    let order = 5;
    const loop2100 = 34;
    runResult.lastInsertRowid = 233;
    let result = inserter.insert2105(order, loop2100);

    expect(
      db.prepare.calledWithExactly(
        "INSERT INTO x12_835_loop_2105 (segment_order, x12_2100_id) VALUES (?, ?);"
      )
    ).to.be.true;
    expect(statement.run.calledOnceWithExactly(order, loop2100)).to.be.true;
    expect(result).equals(233);
  });

  it("should insert main 2110 loop table", () => {
    let order = 5;
    const loop2100 = 34;
    runResult.lastInsertRowid = 233;
    let result = inserter.insert2110(order, loop2100);

    expect(
      db.prepare.calledWithExactly(
        "INSERT INTO x12_835_loop_2110 (segment_order, x12_2100_id) VALUES (?, ?);"
      )
    ).to.be.true;
    expect(statement.run.calledOnceWithExactly(order, loop2100)).to.be.true;
    expect(result).equals(233);
  });

  it("should insert into amt table if all values present", () => {
    const data: SegmentInfo = {
      name: "AMT",
      1: "val1",
      2: "val2",
      3: "val3",
    };
    const id = 34;
    const order = 4;
    const result = inserter.insertAMT(data, "parent", id, order);

    const expected =
      "INSERT INTO x12_amt (segment_order, amount_qualifier_code, " +
      "monetary_amount, credit_debit_flag, parent_type, parent_id) " +
      "VALUES (?, ?, ?, ?, ?, ?);";
    expect(db.prepare.calledOnceWithExactly(expected)).to.be.true;
    expect(
      statement.run.calledOnceWithExactly(
        order,
        "val1",
        "val2",
        "val3",
        "parent",
        id
      )
    ).to.be.true;
    expect(result).equals(0);
  });

  it("should insert into amt table if one missing", () => {
    const data: SegmentInfo = {
      name: "AMT",
      1: "val1",
      3: "val3",
    };
    const id = 34;
    const order = 4;
    const result = inserter.insertAMT(data, "parent", id, order);

    const expected =
      "INSERT INTO x12_amt (segment_order, amount_qualifier_code, " +
      "credit_debit_flag, parent_type, parent_id) " +
      "VALUES (?, ?, ?, ?, ?);";
    expect(db.prepare.calledOnceWithExactly(expected)).to.be.true;
    expect(
      statement.run.calledOnceWithExactly(order, "val1", "val3", "parent", id)
    ).to.be.true;
    expect(result).equals(0);
  });

  it("should insert into amt even if unknown key", () => {
    const data: SegmentInfo = {
      name: "AMT",
      1: "val1",
      3: "val3",
      7: "stuff",
    };
    const id = 34;
    const order = 4;
    const result = inserter.insertAMT(data, "parent", id, order);

    const expected =
      "INSERT INTO x12_amt (segment_order, amount_qualifier_code, " +
      "credit_debit_flag, parent_type, parent_id) " +
      "VALUES (?, ?, ?, ?, ?);";
    expect(db.prepare.calledOnceWithExactly(expected)).to.be.true;
    expect(
      statement.run.calledOnceWithExactly(order, "val1", "val3", "parent", id)
    ).to.be.true;
    expect(result).equals(0);
  });

  it("should insert into bpr no date", () => {
    const data: SegmentInfo = {
      name: "BPR",
    };
    for (let i = 1; i < 22; i++) {
      if (i == 16) continue;
      data[`${i}`] = `${i}`;
    }

    const result = inserter.insertBPR(data, 33);

    const expected =
      "INSERT INTO x12_bpr (segment_order, transaction_handling_code, " +
      "payment_amount, credit_debit_flag, payment_method_code, " +
      "payment_format_code, odfi_id_number_qualifier, odfi_id_number, " +
      "payer_financial_asset_type, payer_account_number, " +
      "originating_company_id, originating_company_supplemental_code, " +
      "rdfi_id_number_qualifier, rdfi_id_number, receiver_asset_type, " +
      "receiver_account_number, reason_for_payment, " +
      "id_number_qualifier_for_returns, dfi_id_number_for_returns, " +
      "asset_type_for_return_account, account_number_for_return, " +
      "x12_header_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?," +
      " ?, ?, ?, ?, ?, ?);";

    expect(db.prepare.calledOnceWithExactly(expected)).to.be.true;

    expect(result).equals(0);
  });
});
