import { SegmentInfo } from "./interfaces/segmentInfo";

// The x12 parse library cannot properly handle cases where an component is
// repeated so this function will reconstruct the original segment and reparse
// it based on the separators given.
export function reparseSegment(
  data: SegmentInfo,
  compositeSeparator: string,
  repetitionSeparator: string
) {
  // want a list that will not update
  const newData: SegmentInfo = { ...data };
  const keys = [...Object.keys(newData)];

  for (let i = 1; i <= keys.length; i++) {
    if (!keys.includes(`${i}`)) break;
    const maxSubKeys = keys.length - i - 1; // b/c 1 for the main key and 1 for name
    const parts: string[] = [];
    let maxJ = 1;
    let correctlyParsed = true;
    for (let j = 1; j <= maxSubKeys; j++) {
      if (!keys.includes(`${i}-${j}`)) {
        maxJ = j - 1;
        break;
      }

      if (parts.length == 0) {
        parts.push(newData[`${i}`]);
        correctlyParsed = !newData[`${i}`].includes(repetitionSeparator);
      }
      const val = newData[`${i}-${j}`];
      correctlyParsed = correctlyParsed && !val.includes(repetitionSeparator);
      parts.push(val);
      maxJ = j;
    }
    if (correctlyParsed) continue;

    const fullElement = parts.join(compositeSeparator);
    // now the fullElement is the string for the entire element including
    // composites.

    // deleting old values
    delete newData[i];
    for (let j = 1; j <= maxJ; j++) {
      delete newData[`${i}-${j}`];
    }

    // re-parsing
    const split = fullElement.split(repetitionSeparator);
    for (let itemIdx = 0; itemIdx < split.length; itemIdx++) {
      const base = `${i}(${itemIdx})_`;
      const subElements = split[itemIdx].split(compositeSeparator);
      for (let subEleIdx = 0; subEleIdx < subElements.length; subEleIdx++) {
        newData[`${base}${subEleIdx + 1}`] = subElements[subEleIdx];
      }
    }
  }
  return newData;
}
