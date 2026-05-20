import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GW = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_NAME = "Casamento D & L";

let cachedFolderId: string | null = null;

function authHeaders() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente — Cloud não configurado");
  if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY ausente — Drive não conectado");
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
  };
}

async function getOrCreateFolder(): Promise<string> {
  if (cachedFolderId) return cachedFolderId;
  const headers = authHeaders();
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const sr = await fetch(`${GW}/drive/v3/files?q=${q}&fields=files(id,name)`, { headers });
  const sd: any = await sr.json();
  if (sr.ok && sd.files?.[0]?.id) {
    cachedFolderId = sd.files[0].id;
    return cachedFolderId!;
  }
  const cr = await fetch(`${GW}/drive/v3/files`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const cd: any = await cr.json();
  if (!cr.ok) throw new Error(`Falha criando pasta no Drive: ${JSON.stringify(cd)}`);
  cachedFolderId = cd.id;
  return cachedFolderId!;
}

export const uploadToDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("FormData esperado");
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Arquivo ausente");
    const type = String(input.get("type") || "");
    if (type !== "image" && type !== "video") throw new Error("type inválido");
    const moment = String(input.get("moment") || "ceremonia");
    const visibility = String(input.get("visibility") || "public");
    const message = (input.get("message") as string | null) || null;
    const mimeType = String(input.get("mimeType") || file.type || "application/octet-stream");
    return { file, type: type as "image" | "video", moment, visibility, message, mimeType };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const headers = authHeaders();
    const folderId = await getOrCreateFolder();

    const safeName = data.file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const fileName = `${Date.now()}-${userId.slice(0, 8)}-${safeName}`;
    const metadata = { name: fileName, parents: [folderId] };

    const boundary = `----lovable${Math.random().toString(36).slice(2)}`;
    const fileBuf = Buffer.from(await data.file.arrayBuffer());
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
          metadata,
        )}\r\n--${boundary}\r\nContent-Type: ${data.mimeType}\r\n\r\n`,
      ),
      fileBuf,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const upRes = await fetch(
      `${GW}/upload/drive/v3/files?uploadType=multipart&fields=id`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": `multipart/related; boundary=${boundary}` },
        body,
      },
    );
    if (!upRes.ok) {
      const txt = await upRes.text();
      throw new Error(`Drive upload falhou [${upRes.status}]: ${txt.slice(0, 300)}`);
    }
    const upData: any = await upRes.json();
    const fileId: string = upData.id;

    // tornar público (qualquer pessoa com o link)
    await fetch(`${GW}/drive/v3/files/${fileId}/permissions`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });

    const viewUrl =
      data.type === "video"
        ? `https://drive.google.com/file/d/${fileId}/preview`
        : `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;

    const { error } = await supabase.from("memories").insert({
      user_id: userId,
      type: data.type,
      storage_path: null,
      drive_file_id: fileId,
      drive_view_url: viewUrl,
      drive_thumbnail_url: thumbUrl,
      mime_type: data.mimeType,
      size_bytes: fileBuf.length,
      moment: data.moment,
      visibility: data.visibility,
      message: data.message,
    } as any);
    if (error) throw new Error(`Erro salvando memória: ${error.message}`);

    return { ok: true, fileId, viewUrl, thumbUrl };
  });

export const deleteFromDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const arr = (input as any)?.fileIds;
    if (!Array.isArray(arr)) throw new Error("fileIds[] esperado");
    return { fileIds: arr.filter((x: unknown) => typeof x === "string") as string[] };
  })
  .handler(async ({ data }) => {
    const headers = authHeaders();
    const results: Record<string, boolean> = {};
    for (const id of data.fileIds) {
      try {
        const r = await fetch(`${GW}/drive/v3/files/${id}`, { method: "DELETE", headers });
        results[id] = r.ok || r.status === 404;
      } catch {
        results[id] = false;
      }
    }
    return { results };
  });
