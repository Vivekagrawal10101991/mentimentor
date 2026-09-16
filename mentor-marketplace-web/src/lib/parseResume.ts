import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

/** Safari/WebKit often lacks ReadableStream async iteration that pdf.js expects. */
function ensureStreamAsyncIteratorPolyfill() {
  const proto = (globalThis as { ReadableStream?: { prototype: object } }).ReadableStream
    ?.prototype as
    | (object & {
        getReader: () => ReadableStreamDefaultReader<unknown>;
        [Symbol.asyncIterator]?: () => AsyncIterator<unknown>;
      })
    | undefined;
  if (!proto || typeof proto[Symbol.asyncIterator] === "function") {
    return;
  }
  Object.defineProperty(proto, Symbol.asyncIterator, {
    configurable: true,
    writable: true,
    value: function asyncIterator(this: {
      getReader: () => ReadableStreamDefaultReader<unknown>;
    }) {
      const reader = this.getReader();
      return {
        async next(): Promise<IteratorResult<unknown>> {
          const result = await reader.read();
          if (result.done) {
            reader.releaseLock();
            return { done: true, value: undefined };
          }
          return { done: false, value: result.value };
        },
        async return(): Promise<IteratorResult<unknown>> {
          await reader.cancel();
          reader.releaseLock();
          return { done: true, value: undefined };
        },
      };
    },
  });
}

type WithResolversResult = {
  promise: Promise<unknown>;
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== "function") {
  (Promise as unknown as { withResolvers: () => WithResolversResult }).withResolvers =
    function withResolvers() {
      let resolve!: (value?: unknown) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise((res, rej) => {
        resolve = res as (value?: unknown) => void;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
}

ensureStreamAsyncIteratorPolyfill();

export type ParsedResumeEducation = {
  qualification: string;
  college: string;
  degree: string;
  year: string;
  cgpa: string;
  teachingExp: string;
  totalExp: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

const QUALIFICATION_RE =
  /\b((?:B\.?\s?Tech|B\.?\s?E\.?|B\.?\s?Sc|B\.?\s?A\.?|B\.?\s?Com|M\.?\s?Tech|M\.?\s?E\.?|M\.?\s?Sc|M\.?\s?A\.?|M\.?\s?Com|MBA|MCA|Ph\.?\s?D\.?|Diploma|Bachelor(?:'s)?|Master(?:'s)?|Doctorate)(?:\s*(?:of|in)\s+[A-Za-z&.\-\s]{2,40})?)\b/i;

const COLLEGE_RE =
  /\b((?:Indian Institute of Technology|IIT|NIT|IIIT|BITS|University|College|Institute|School)\s*[A-Za-z0-9&.,'\-\s]{0,60})/i;

const DEGREE_AREA_RE =
  /\b(?:in|of)\s+([A-Z][A-Za-z&.\-\s]{2,40}(?:Science|Engineering|Arts|Commerce|Technology|Studies|Mathematics|Physics|Chemistry|Biology|Computer|IT)?)/;

const YEAR_RE =
  /(?:graduat(?:ed|ion)|complet(?:ed|ion)|class of|batch(?: of)?|year)\s*[:\-]?\s*((?:19|20)\d{2})|\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2}|present|current)\b/i;

const CGPA_RE =
  /(?:cgpa|gpa|gpi|grade(?:\s*point)?)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:\/\s*(?:10|4))?|(?:percentage|percent|marks)\s*[:\-]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*%?/i;

const TEACHING_EXP_RE =
  /(?:teaching|tutoring|mentor(?:ing)?)\s+(?:experience|exp\.?)?\s*[:\-]?\s*(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)/i;

const TOTAL_EXP_RE =
  /(?:total|overall|professional|work)\s+(?:experience|exp\.?)?\s*[:\-]?\s*(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)|(?:experience|exp\.?)\s*[:\-]?\s*(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)/i;

function normalizeWhitespace(text: string): string {
  return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/** Avoid pdf.js getTextContent() — it uses for-await on ReadableStream (broken in Safari). */
async function readPageText(page: {
  streamTextContent: () => ReadableStream<{ items?: unknown[] }>;
}): Promise<string> {
  const stream = page.streamTextContent();
  const reader = stream.getReader();
  const chunks: string[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const items = value?.items ?? [];
      for (const item of items) {
        if (item && typeof item === "object" && "str" in item) {
          chunks.push(String((item as { str: string }).str));
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
  return chunks.join(" ");
}

async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(doc.numPages, 8);
  for (let i = 1; i <= maxPages; i++) {
    const page = await doc.getPage(i);
    pages.push(await readPageText(page));
  }
  return pages.join("\n");
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value ?? "";
}

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (file.size > MAX_BYTES) {
    throw new Error("File must be 5MB or smaller.");
  }

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return normalizeWhitespace(await extractPdfText(file));
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return normalizeWhitespace(await extractDocxText(file));
  }

  if (name.endsWith(".doc") || type === "application/msword") {
    throw new Error(
      "Old .doc files aren't supported in the browser. Please upload a PDF or DOCX."
    );
  }

  throw new Error("Please upload a PDF or DOCX resume.");
}

function cleanField(value: string | undefined, maxLen = 80): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function yearsLabel(raw: string | undefined): string {
  if (!raw) return "";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n} years`;
}

/** Best-effort heuristic extraction from resume plain text. */
export function parseEducationFromResumeText(text: string): ParsedResumeEducation {
  const educationSlice = (() => {
    const lower = text.toLowerCase();
    const start = lower.search(/\beducation\b|\bacademic\b|\bqualification\b/);
    if (start >= 0) {
      const rest = text.slice(start, start + 1200);
      const end = rest.search(
        /\n\s*(experience|work history|employment|projects|skills|certifications)\b/i
      );
      return end > 40 ? rest.slice(0, end) : rest;
    }
    return text.slice(0, 2000);
  })();

  const qualMatch = educationSlice.match(QUALIFICATION_RE) ?? text.match(QUALIFICATION_RE);
  let qualification = cleanField(qualMatch?.[1]);
  let degree = "";

  if (qualification) {
    const area = qualification.match(DEGREE_AREA_RE);
    if (area?.[1]) {
      degree = cleanField(area[1]);
      qualification = cleanField(qualification.replace(DEGREE_AREA_RE, "").trim());
    }
  }

  if (!degree) {
    const standalone = educationSlice.match(
      /\b(Computer Science|Information Technology|Electronics|Mechanical|Civil|Mathematics|Physics|Chemistry|Biology|English|Economics|Business Administration)\b/i
    );
    degree = cleanField(standalone?.[1]);
  }

  const collegeMatch = educationSlice.match(COLLEGE_RE) ?? text.match(COLLEGE_RE);
  const college = cleanField(collegeMatch?.[1]);

  const yearMatch = educationSlice.match(YEAR_RE) ?? text.match(YEAR_RE);
  const year = cleanField(
    yearMatch?.[1] || yearMatch?.[3] || yearMatch?.[2],
    4
  );

  const cgpaMatch = educationSlice.match(CGPA_RE) ?? text.match(CGPA_RE);
  let cgpa = "";
  if (cgpaMatch?.[1]) {
    cgpa = cleanField(cgpaMatch[1], 8);
  } else if (cgpaMatch?.[2]) {
    cgpa = `${cleanField(cgpaMatch[2], 8)}%`;
  }

  const teachingMatch = text.match(TEACHING_EXP_RE);
  const totalMatch = text.match(TOTAL_EXP_RE);

  return {
    qualification,
    college,
    degree,
    year,
    cgpa,
    teachingExp: yearsLabel(teachingMatch?.[1]),
    totalExp: yearsLabel(totalMatch?.[1] || totalMatch?.[2]),
  };
}

export async function parseResumeFile(file: File): Promise<ParsedResumeEducation> {
  const text = await extractResumeText(file);
  if (!text || text.length < 20) {
    throw new Error(
      "Couldn't read text from that file. Try a text-based PDF or DOCX (not a scanned image)."
    );
  }
  return parseEducationFromResumeText(text);
}
