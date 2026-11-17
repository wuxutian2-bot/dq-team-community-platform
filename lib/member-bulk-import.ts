import "server-only";

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { inflateRawSync } from "node:zlib";

const DISPLAY_NAME_MAX_LENGTH = 40;

function generateInitialPassword() {
  return randomBytes(9).toString("base64url");
}

function truncateDisplayName(value: string) {
  return Array.from(value).slice(0, DISPLAY_NAME_MAX_LENGTH).join("");
}

const WORKBOOK_FILE_NAME = "殿祁（🐮🐴小窝）_$ǿ_20260427_215142.xlsx";
const QQ_HEADER = "QQ号";
const GROUP_NICKNAME_HEADER = "群昵称";
const QQ_NICKNAME_HEADER = "QQ昵称";
const JOINED_AT_HEADER = "加入时间";

const EMPTY_NAME_MARKERS = new Set([
  "",
  "-",
  "--",
  "---",
  "—",
  "——",
  "/",
  "\\",
  "无",
  "暂无",
  "null",
  "undefined",
]);

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

export type WorkbookMemberImportCandidate = {
  rowNumber: number;
  qqNumber: string;
  email: string;
  password: string;
  displayName: string;
  joinedAt: string;
  nameSource: "group_nickname" | "qq_nickname";
};

export type WorkbookMemberImportSkippedRow = {
  rowNumber: number;
  qqNumber: string;
  groupNickname: string;
  qqNickname: string;
  joinedAt: string;
  reason: string;
};

export type WorkbookMemberImportPlan = {
  workbookName: string;
  workbookPath: string;
  totalDataRows: number;
  candidates: WorkbookMemberImportCandidate[];
  skippedRows: WorkbookMemberImportSkippedRow[];
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function decodeXml(text: string) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnKeyToNumber(columnKey: string) {
  let value = 0;

  for (const char of columnKey) {
    value = value * 26 + (char.charCodeAt(0) - 64);
  }

  return value;
}

function normalizeNickname(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "";
  }

  if (EMPTY_NAME_MARKERS.has(cleaned.toLowerCase())) {
    return "";
  }

  return cleaned;
}

function normalizeQQNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function excelSerialToDate(serial: number) {
  const utcTime = Math.round((serial - 25569) * 86400 * 1000);
  const date = new Date(utcTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function normalizeJoinedAt(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return "";
  }

  if (/^\d+(\.\d+)?$/.test(cleaned)) {
    return excelSerialToDate(Number(cleaned));
  }

  const dateLike = cleaned.replace(/\//g, "-");
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(dateLike);

  if (!match) {
    return "";
  }

  return `${match[1]}-${pad(Number(match[2]))}-${pad(Number(match[3]))}`;
}

function parseZipEntries(buffer: Buffer) {
  const entries = new Map<string, ZipEntry>();
  const endOfCentralDirectorySignature = 0x06054b50;
  const centralDirectorySignature = 0x02014b50;
  const endOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

  if (endOffset < 0) {
    throw new Error("无法识别 Excel 文件结构，未找到压缩目录。");
  }

  const signature = buffer.readUInt32LE(endOffset);

  if (signature !== endOfCentralDirectorySignature) {
    throw new Error("Excel 压缩目录签名无效。");
  }

  const centralDirectoryOffset = buffer.readUInt32LE(endOffset + 16);
  const totalEntries = buffer.readUInt16LE(endOffset + 10);
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(cursor) !== centralDirectorySignature) {
      throw new Error("Excel 中央目录读取失败。");
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString("utf8");

    entries.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipEntryText(
  archiveBuffer: Buffer,
  entries: Map<string, ZipEntry>,
  fileName: string,
) {
  const localHeaderSignature = 0x04034b50;
  const entry = entries.get(fileName);

  if (!entry) {
    return "";
  }

  const offset = entry.localHeaderOffset;

  if (archiveBuffer.readUInt32LE(offset) !== localHeaderSignature) {
    throw new Error(`Excel 条目 ${fileName} 的本地头无效。`);
  }

  const fileNameLength = archiveBuffer.readUInt16LE(offset + 26);
  const extraLength = archiveBuffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = archiveBuffer.subarray(
    dataStart,
    dataStart + entry.compressedSize,
  );

  if (entry.compressionMethod === 0) {
    return compressed.toString("utf8");
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed).toString("utf8");
  }

  throw new Error(
    `Excel 条目 ${fileName} 使用了当前不支持的压缩方式 ${entry.compressionMethod}。`,
  );
}

function parseSharedStrings(xml: string) {
  const sharedStrings: string[] = [];
  const matches = xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g);

  for (const match of matches) {
    const text = Array.from(match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g))
      .map((textMatch) => decodeXml(textMatch[1]))
      .join("");

    sharedStrings.push(text);
  }

  return sharedStrings;
}

function getCellValue(
  cellAttributes: string,
  cellInnerXml: string,
  sharedStrings: string[],
) {
  const type = /t="([^"]+)"/.exec(cellAttributes)?.[1] ?? "";
  const inlineText = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/.exec(cellInnerXml)?.[1] ?? "";
  const rawValue = /<v>([\s\S]*?)<\/v>/.exec(cellInnerXml)?.[1] ?? "";

  if (type === "s") {
    const index = Number(rawValue);
    return Number.isFinite(index) ? sharedStrings[index] ?? "" : "";
  }

  if (type === "inlineStr") {
    return decodeXml(inlineText);
  }

  return decodeXml(rawValue);
}

function parseSheetRows(xml: string, sharedStrings: string[]) {
  const rows = new Map<number, Map<string, string>>();
  const rowMatches = xml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g);

  for (const rowMatch of rowMatches) {
    const rowNumber = Number(rowMatch[1]);
    const rowCells = new Map<string, string>();
    const cellMatches = rowMatch[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);

    for (const cellMatch of cellMatches) {
      const columnKey = /r="([A-Z]+)\d+"/.exec(cellMatch[1])?.[1];

      if (!columnKey) {
        continue;
      }

      rowCells.set(columnKey, getCellValue(cellMatch[1], cellMatch[2], sharedStrings));
    }

    rows.set(rowNumber, rowCells);
  }

  return rows;
}

async function resolveWorkbookPath() {
  const workspaceRoot = path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    "..",
  );
  const preferredPath = path.join(
    /*turbopackIgnore: true*/ workspaceRoot,
    WORKBOOK_FILE_NAME,
  );

  try {
    await access(/*turbopackIgnore: true*/ preferredPath);
    return preferredPath;
  } catch {
    const candidates = (
      await readdir(/*turbopackIgnore: true*/ workspaceRoot)
    ).filter((entry) => entry.toLowerCase().endsWith(".xlsx"));

    if (candidates.length === 1) {
      return path.join(
        /*turbopackIgnore: true*/ workspaceRoot,
        candidates[0],
      );
    }

    throw new Error(
      `未在主文件夹找到 ${WORKBOOK_FILE_NAME}。请确认 Excel 文件仍放在 ${workspaceRoot}。`,
    );
  }
}

export async function buildWorkbookMemberImportPlan(): Promise<WorkbookMemberImportPlan> {
  const workbookPath = await resolveWorkbookPath();
  const archiveBuffer = await readFile(/*turbopackIgnore: true*/ workbookPath);
  const zipEntries = parseZipEntries(archiveBuffer);
  const sharedStrings = parseSharedStrings(
    readZipEntryText(archiveBuffer, zipEntries, "xl/sharedStrings.xml"),
  );
  const sheetRows = parseSheetRows(
    readZipEntryText(archiveBuffer, zipEntries, "xl/worksheets/sheet1.xml"),
    sharedStrings,
  );
  const headerRow = sheetRows.get(1);

  if (!headerRow) {
    throw new Error("Excel 第一行表头不存在，无法继续导入。");
  }

  const headerEntries = Array.from(headerRow.entries()).sort(
    ([left], [right]) => columnKeyToNumber(left) - columnKeyToNumber(right),
  );
  const qqColumn = headerEntries.find(([, value]) => value === QQ_HEADER)?.[0];
  const groupNicknameColumn = headerEntries.find(
    ([, value]) => value === GROUP_NICKNAME_HEADER,
  )?.[0];
  const qqNicknameColumn = headerEntries.find(
    ([, value]) => value === QQ_NICKNAME_HEADER,
  )?.[0];
  const joinedAtColumn =
    headerEntries.find(([, value]) => value === JOINED_AT_HEADER)?.[0] ??
    headerEntries.at(-1)?.[0];

  if (!qqColumn || !groupNicknameColumn || !qqNicknameColumn || !joinedAtColumn) {
    throw new Error("Excel 缺少 QQ号、群昵称、QQ昵称 或 加入时间 列，无法批量导入。");
  }

  const rowNumbers = Array.from(sheetRows.keys())
    .filter((rowNumber) => rowNumber > 1)
    .sort((left, right) => left - right);
  const candidates: WorkbookMemberImportCandidate[] = [];
  const skippedRows: WorkbookMemberImportSkippedRow[] = [];

  for (const rowNumber of rowNumbers) {
    const row = sheetRows.get(rowNumber);

    if (!row) {
      continue;
    }

    const qqNumber = normalizeQQNumber(row.get(qqColumn) ?? "");
    const groupNickname = normalizeNickname(row.get(groupNicknameColumn) ?? "");
    const qqNickname = normalizeNickname(row.get(qqNicknameColumn) ?? "");
    const joinedAt = normalizeJoinedAt(row.get(joinedAtColumn) ?? "");

    if (!qqNumber) {
      skippedRows.push({
        rowNumber,
        qqNumber: "",
        groupNickname,
        qqNickname,
        joinedAt,
        reason: "缺少可用 QQ 号",
      });
      continue;
    }

    if (!groupNickname && !qqNickname) {
      skippedRows.push({
        rowNumber,
        qqNumber,
        groupNickname,
        qqNickname,
        joinedAt,
        reason: "群昵称和 QQ 昵称都为空，按规则跳过",
      });
      continue;
    }

    if (!joinedAt) {
      skippedRows.push({
        rowNumber,
        qqNumber,
        groupNickname,
        qqNickname,
        joinedAt: row.get(joinedAtColumn) ?? "",
        reason: "加入时间无法识别，按规则跳过",
      });
      continue;
    }

    const displayName = truncateDisplayName(groupNickname || qqNickname);

    candidates.push({
      rowNumber,
      qqNumber,
      email: `${qqNumber}@qq.com`,
      password: generateInitialPassword(),
      displayName,
      joinedAt,
      nameSource: groupNickname ? "group_nickname" : "qq_nickname",
    });
  }

  return {
    workbookName: path.basename(workbookPath),
    workbookPath,
    totalDataRows: rowNumbers.length,
    candidates,
    skippedRows,
  };
}
