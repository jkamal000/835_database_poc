import { expect } from "chai";
import { reparseSegment } from "./parserHelper";

describe("Parser helper function", () => {
  it("reparse should not mess with original", () => {
    const data = {
      "1": "1",
      "2": "XYZ",
      "3": "AA",
      "3-1": "BB^CC",
      "3-2": "DD",
      "3-3": "EE^FF",
      "4": "stuff",
      name: "RAS",
    };
    const ogString = JSON.stringify(data);
    reparseSegment(data, ":", "^");
    expect(JSON.stringify(data)).equals(ogString);
  });

  it.only("reparse should correctly parse", () => {
    const data = {
      "1": "1",
      "2": "XYZ",
      "3": "AA",
      "3-1": "BB^CC",
      "3-2": "DD",
      "3-3": "EE^FF",
      "4": "stuff",
      name: "RAS",
    };

    const output = reparseSegment(data, ":", "^");
    expect(output["1"]).equals("1");
    expect(output["2"]).equals("XYZ");
    expect(output["3(0)_1"]).equals("AA");
    expect(output["3(0)_2"]).equals("BB");
    expect(output["3(1)_1"]).equals("CC");
    expect(output["3(1)_2"]).equals("DD");
    expect(output["3(1)_3"]).equals("EE");
    expect(output["3(2)_1"]).equals("FF");
    expect(output["4"]).equals("stuff");
  });
});
