import Dexie, { Table } from 'dexie';

export interface StoredFile {
  id: string;
  blob: Blob;
  createdAt: number;
  name: string;
  type: string;
}

class DocumentsDB extends Dexie {
  files!: Table<StoredFile, string>;

  constructor() {
    super('DocumentsDB');
    this.version(1).stores({
      files: 'id, createdAt, type, name'
    });
  }
}

const db = new DocumentsDB();

export async function saveDocument(file: File): Promise<string> {
  const id = crypto.randomUUID();
  const blob = file.slice(0, file.size, file.type);
  await db.files.put({ id, blob, createdAt: Date.now(), name: file.name, type: file.type });
  return id;
}

export async function getDocument(id: string): Promise<Blob | undefined> {
  const rec = await db.files.get(id);
  return rec?.blob;
}

export async function deleteDocument(id: string): Promise<void> {
  await db.files.delete(id);
}

export async function getDocumentURL(id: string): Promise<string | undefined> {
  const blob = await getDocument(id);
  return blob ? URL.createObjectURL(blob) : undefined;
}

export default db;
