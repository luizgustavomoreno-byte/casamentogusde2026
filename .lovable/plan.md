## Objetivo

Trocar o armazenamento de fotos/vídeos do Lovable Cloud pelo **Google Drive direto** da conta `luizgustavo.moreno@gmail.com` (100 GB). Cada convidado envia → o arquivo vai pro seu Drive numa pasta "Casamento D & L" → app guarda só metadados leves (autor, momento, mensagem, likes, comentários, ID do arquivo no Drive).

## Passo 1 — Conectar o Google Drive

Vou abrir o seletor de conexão. Quando aparecer:
1. Clica em **"Nova conexão"**
2. **Faz login com luizgustavo.moreno@gmail.com** (não a outra conta!)
3. Autoriza acesso ao Drive

Sem esse passo nada funciona, então é o primeiro.

## Passo 2 — Banco de dados

Adicionar colunas em `memories`:
- `drive_file_id` (text) — ID do arquivo no Drive
- `drive_view_url` (text) — link público pra exibir na galeria/TV
- `drive_thumbnail_url` (text) — thumbnail rápida pra grid

Manter `storage_path` opcional pra compatibilidade com o que já foi enviado (não perde nada).

## Passo 3 — Upload flow

Criar server function `uploadToDrive`:
- Recebe arquivo (multipart) + metadados
- Cria/reusa pasta "Casamento D & L" no Drive
- Sobe arquivo via gateway do Google Drive
- Torna o arquivo público (`permissions: anyone with link, reader`)
- Retorna `file_id` + URL de visualização
- Insere row em `memories` com os IDs do Drive

`UploadCard.tsx` passa a chamar essa server fn em vez do storage do Supabase.

## Passo 4 — Exibição

`SignedImage` passa a usar `drive_view_url` (`https://drive.google.com/uc?id={fileId}`) em vez de URL assinada do Supabase. Sem chamada extra de signed URL = mais rápido.

## Passo 5 — Admin

Botão "apagar selecionadas":
- Deleta do Drive via gateway
- Deleta a row do `memories`

## Trade-offs (já confirmados)

- ⚠️ Galeria/TV um pouco mais lenta (depende do Drive)
- ⚠️ Sem fotos "privadas" reais — todo arquivo no Drive precisa de link compartilhável (quem tem o link vê)
- ✅ Praticamente ilimitado (100 GB cabe ~50.000 fotos ou ~5.000 vídeos)
- ✅ Backup automático no seu Google
- ✅ Você acessa direto pelo Drive depois do casamento

## Detalhes técnicos

- Gateway URL: `https://connector-gateway.lovable.dev/google_drive/...`
- Upload: `POST /upload/drive/v3/files?uploadType=multipart` com `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key: GOOGLE_DRIVE_API_KEY`
- Permissão pública: `POST /drive/v3/files/{fileId}/permissions` com `{role:"reader", type:"anyone"}`
- Migração SQL: `ALTER TABLE memories ADD COLUMN drive_file_id TEXT, ADD COLUMN drive_view_url TEXT, ADD COLUMN drive_thumbnail_url TEXT; ALTER COLUMN storage_path DROP NOT NULL;`
- Server fn vai em `src/lib/drive.functions.ts` com `requireSupabaseAuth`
- Limite de upload aumenta pra 200 MB (Drive aguenta muito mais, mas evita travar o celular do convidado)

## Posso começar?

Se aprovar, eu já abro o seletor de conexão do Google Drive — só lembra de escolher a conta **luizgustavo.moreno@gmail.com**.
