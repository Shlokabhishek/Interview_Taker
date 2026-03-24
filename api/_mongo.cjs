const { MongoClient } = require('mongodb');

const getMongoUri = () => {
  return (
    process?.env?.MONGODB_URI ||
    process?.env?.MONGO_URI ||
    process?.env?.DATABASE_URL ||
    ''
  ).trim();
};

const getMongoDbName = () => {
  return (
    process?.env?.MONGODB_DB ||
    process?.env?.MONGO_DB_NAME ||
    'ai_interview_platform'
  ).trim();
};

const globalCache = globalThis.__INTERVIEW_PRO_MONGO__ || {
  client: null,
  db: null,
  promise: null,
};
globalThis.__INTERVIEW_PRO_MONGO__ = globalCache;

const mongoConfigured = () => Boolean(getMongoUri());

const getMongoDb = async () => {
  if (!mongoConfigured()) return null;

  if (globalCache.db) return globalCache.db;
  if (globalCache.promise) return globalCache.promise;

  const uri = getMongoUri();
  const dbName = getMongoDbName();

  globalCache.promise = MongoClient.connect(uri)
    .then((client) => {
      globalCache.client = client;
      globalCache.db = client.db(dbName);
      return globalCache.db;
    })
    .catch(() => {
      globalCache.promise = null;
      return null;
    });

  return globalCache.promise;
};

module.exports = {
  mongoConfigured,
  getMongoDb,
};
