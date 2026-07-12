import {
  bulkDeleteRecords,
  bulkPutRecords,
  countRecords,
  deleteRecord,
  getAllRecords,
  getRecord,
  putRecord
} from "../db.js";

export function createRepository(storeName) {
  return {
    storeName,
    all(db) {
      return getAllRecords(db, storeName);
    },
    get(db, id) {
      return getRecord(db, storeName, id);
    },
    count(db) {
      return countRecords(db, storeName);
    },
    put(db, record) {
      return putRecord(db, storeName, record);
    },
    bulkPut(db, records) {
      return bulkPutRecords(db, storeName, records);
    },
    delete(db, id) {
      return deleteRecord(db, storeName, id);
    },
    bulkDelete(db, ids) {
      return bulkDeleteRecords(db, storeName, ids);
    }
  };
}

