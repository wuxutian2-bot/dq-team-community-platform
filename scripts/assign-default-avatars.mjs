import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const envText = readFileSync(path.join(projectRoot, ".env.local"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const AVATAR_DIR = "D:/头像提取/avatars_extracted";
const AVATAR_COUNT = 214;

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

const query = await fetch(
  `${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,joined_at&avatar_path=is.null&order=joined_at.asc,id.asc`,
  { headers: authHeaders },
);
if (!query.ok) {
  throw new Error(`查询成员失败: ${query.status} ${await query.text()}`);
}
const members = await query.json();

const usedQuery = await fetch(
  `${SUPABASE_URL}/rest/v1/profiles?select=id&avatar_path=like.*default-avatar.png`,
  { headers: authHeaders },
);
if (!usedQuery.ok) {
  throw new Error(`查询已分配数量失败: ${usedQuery.status}`);
}
const offset = (await usedQuery.json()).length;

if (offset + members.length > AVATAR_COUNT) {
  throw new Error(
    `头像库共 ${AVATAR_COUNT} 张，已用 ${offset} 张，不足以分配给 ${members.length} 位成员。`,
  );
}

console.log(
  `共 ${members.length} 位成员没有头像，从 avatar_${String(offset + 1).padStart(3, "0")} 继续分配…`,
);

for (const [index, member] of members.entries()) {
  const fileName = `avatar_${String(offset + index + 1).padStart(3, "0")}.png`;
  const objectPath = `profiles/${member.id}/default-avatar.png`;
  const body = await readFile(path.join(AVATAR_DIR, fileName));

  const upload = await fetch(
    `${SUPABASE_URL}/storage/v1/object/avatars/${objectPath}`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body,
    },
  );
  if (!upload.ok) {
    throw new Error(
      `上传 ${fileName} 失败: ${upload.status} ${await upload.text()}`,
    );
  }

  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${member.id}&avatar_path=is.null`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ avatar_path: objectPath }),
    },
  );
  if (!patch.ok) {
    throw new Error(
      `写入 ${member.display_name} 的头像失败: ${patch.status} ${await patch.text()}`,
    );
  }

  console.log(`${fileName} -> ${member.display_name}`);
}

console.log(`完成：已为 ${members.length} 位成员设置固定默认头像。`);