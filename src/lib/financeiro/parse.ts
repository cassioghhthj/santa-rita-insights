import { normalizeDb } from "./normalize";

export interface ParsedTx {
  data: string; // yyyy-mm-dd
  descricao: string;
  descricao_normalizada: string;
  valor: number; // sempre positivo
  tipo: "credito" | "debito";
  fitid: string | null;
}

export interface ParseResult {
  transacoes: ParsedTx[];
  saldoFinal: number | null;
  erros: string[];
}

function parseOfxDate(raw: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(raw.trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function tag(block: string, name: string): string | null {
  const re = new RegExp(`<${name}>([^<\\r\\n]*)`, "i");
  const m = re.exec(block);
  return m ? m[1].trim() : null;
}

export function parseOFX(text: string): ParseResult {
  const erros: string[] = [];
  const transacoes: ParsedTx[] = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  for (const b of blocks) {
    const dt = tag(b, "DTPOSTED");
    const amt = tag(b, "TRNAMT");
    const data = dt ? parseOfxDate(dt) : null;
    const valorRaw = amt ? Number(amt.replace(/\s/g, "").replace(",", ".")) : NaN;
    if (!data || !Number.isFinite(valorRaw)) {
      erros.push(`Transação ignorada (data ou valor inválido): ${dt ?? "?"} / ${amt ?? "?"}`);
      continue;
    }
    const trntype = (tag(b, "TRNTYPE") ?? "").toUpperCase();
    const descricao = (tag(b, "MEMO") ?? tag(b, "NAME") ?? "").trim() || "SEM DESCRIÇÃO";
    const credito = valorRaw >= 0 || trntype === "CREDIT" || trntype === "DEP";
    transacoes.push({
      data,
      descricao,
      descricao_normalizada: normalizeDb(descricao),
      valor: Math.abs(valorRaw),
      tipo: credito ? "credito" : "debito",
      fitid: tag(b, "FITID"),
    });
  }

  let saldoFinal: number | null = null;
  const balBlock =
    /<LEDGERBAL>[\s\S]*?<\/LEDGERBAL>/i.exec(text)?.[0] ??
    /<AVAILBAL>[\s\S]*?<\/AVAILBAL>/i.exec(text)?.[0] ??
    null;
  if (balBlock) {
    const bal = tag(balBlock, "BALAMT");
    const n = bal ? Number(bal.replace(/\s/g, "").replace(",", ".")) : NaN;
    if (Number.isFinite(n)) saldoFinal = n;
  }

  if (!transacoes.length) erros.push("Nenhuma transação <STMTTRN> encontrada no arquivo OFX.");
  return { transacoes, saldoFinal, erros };
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

function parseDateBr(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

export function parseValorBr(raw: string): number {
  let s = (raw ?? "").replace(/[R$\s]/gi, "").trim();
  const neg = /^\(.*\)$/.test(s) || s.startsWith("-");
  s = s.replace(/[()]/g, "").replace(/^-/, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return neg ? -n : n;
}

function findCol(headers: string[], needles: string[]): number {
  return headers.findIndex((h) => needles.some((n) => h.includes(n)));
}

export function parseCSV(text: string): ParseResult {
  const erros: string[] = [];
  const transacoes: ParsedTx[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { transacoes, saldoFinal: null, erros: ["Arquivo CSV vazio."] };

  const sep = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = splitCsvLine(lines[0], sep).map((h) =>
    h
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
  );

  const iData = findCol(headers, ["data", "date"]);
  const iDesc = findCol(headers, ["descri", "memo", "historico", "hist"]);
  const iValor = findCol(headers, ["valor", "amount", "value"]);
  const iTipo = findCol(headers, ["tipo", "type", "natureza"]);
  const iSaldo = findCol(headers, ["saldo", "balance"]);

  if (iData < 0 || iValor < 0) {
    return {
      transacoes,
      saldoFinal: null,
      erros: ["Não foi possível identificar as colunas de data e valor no CSV."],
    };
  }

  let saldoFinal: number | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], sep);
    const data = parseDateBr(cells[iData] ?? "");
    const valorRaw = parseValorBr(cells[iValor] ?? "");
    if (!data || !Number.isFinite(valorRaw)) {
      erros.push(`Linha ${i + 1} ignorada (data ou valor inválido).`);
      continue;
    }
    const descricao = (iDesc >= 0 ? cells[iDesc] : "")?.trim() || "SEM DESCRIÇÃO";
    let credito = valorRaw >= 0;
    if (iTipo >= 0) {
      const t = (cells[iTipo] ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      if (/cred|entrada|receita|c$/.test(t)) credito = true;
      else if (/deb|saida|despesa|pagamento|d$/.test(t)) credito = false;
    }
    if (iSaldo >= 0) {
      const s = parseValorBr(cells[iSaldo] ?? "");
      if (Number.isFinite(s)) saldoFinal = s;
    }
    transacoes.push({
      data,
      descricao,
      descricao_normalizada: normalizeDb(descricao),
      valor: Math.abs(valorRaw),
      tipo: credito ? "credito" : "debito",
      fitid: null,
    });
  }

  if (!transacoes.length) erros.push("Nenhuma transação válida encontrada no CSV.");
  return { transacoes, saldoFinal, erros };
}

export function parseExtrato(fileName: string, text: string): ParseResult {
  const isOfx = /\.ofx$/i.test(fileName) || /<STMTTRN>/i.test(text);
  return isOfx ? parseOFX(text) : parseCSV(text);
}
