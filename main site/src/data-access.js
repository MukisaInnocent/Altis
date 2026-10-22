import { isMysql } from '../db-config.js';
import { TABLE_COLUMNS, sanitizeRow } from '../table-columns.js';
import {
  clearSession as clearSqliteSession,
  countRecords,
  createSession as createSqliteSession,
  findRecords,
  getAllRecords,
  getRecordById,
  getSessionUser as getSqliteSessionUser,
  getSiteContent as getSqliteContent,
  getUserByEmail as getSqliteUser,
  listSiteContent as listSqliteContent,
  removeRecord,
  saveJsonTable,
  updateJsonTable
} from '../db.js';

let mysqlModulePromise = null;

function loadMysql() {
  if (!mysqlModulePromise) mysqlModulePromise = import('../mysql-db.js');
  return mysqlModulePromise;
}

export async function listRows(tableName) {
  if (!isMysql()) return getAllRecords(tableName);
  const mysql = await loadMysql();
  return mysql.listRows(tableName);
}

export async function listSiteContent() {
  if (!isMysql()) return listSqliteContent();
  const mysql = await loadMysql();
  return mysql.listSiteContent();
}

export async function getSiteContent(key) {
  if (!isMysql()) return getSqliteContent(key);
  const mysql = await loadMysql();
  return mysql.getSiteContent(key);
}

export async function getUserByEmail(email) {
  if (!isMysql()) return getSqliteUser(email) || null;
  const mysql = await loadMysql();
  return mysql.getUserByEmail(email);
}

export async function getSessionUser(sessionId) {
  if (!sessionId) return null;
  if (!isMysql()) return getSqliteSessionUser(sessionId);
  const mysql = await loadMysql();
  return mysql.getSessionUser(sessionId);
}

export async function createSession(sessionId, userId) {
  if (!isMysql()) {
    createSqliteSession(sessionId, userId);
    return;
  }
  const mysql = await loadMysql();
  await mysql.createSession(sessionId, userId);
}

export async function clearSession(sessionId) {
  if (!isMysql()) {
    clearSqliteSession(sessionId);
    return;
  }
  const mysql = await loadMysql();
  await mysql.clearSession(sessionId);
}

export async function insertRow(tableName, row) {
  const clean = sanitizeRow(tableName, row);
  if (!isMysql()) return saveJsonTable(tableName, clean);
  const mysql = await loadMysql();
  return mysql.insertRow(tableName, clean);
}

export async function updateRow(tableName, id, row) {
  row = sanitizeRow(tableName, row);
  if (!isMysql()) {
    updateJsonTable(tableName, id, row);
    return;
  }
  const mysql = await loadMysql();
  await mysql.updateRow(tableName, id, row);
}

export async function deleteRow(tableName, id) {
  if (!isMysql()) {
    removeRecord(tableName, id);
    return;
  }
  const mysql = await loadMysql();
  await mysql.deleteRow(tableName, id);
}

// Looks rows up by one whitelisted column, e.g. an enquiry by its public reference.
export async function findRows(tableName, column, value) {
  if (!TABLE_COLUMNS[tableName] || !(column in TABLE_COLUMNS[tableName])) throw new Error(`Invalid lookup: ${tableName}.${column}`);
  if (!isMysql()) return findRecords(tableName, column, value);
  const mysql = await loadMysql();
  return mysql.findRows(tableName, column, value);
}

export async function getRow(tableName, id) {
  if (!isMysql()) return getRecordById(tableName, id);
  const mysql = await loadMysql();
  return mysql.getRow(tableName, id);
}

export async function countRows(tableName) {
  if (!isMysql()) return countRecords(tableName);
  const mysql = await loadMysql();
  return mysql.countRows(tableName);
}
