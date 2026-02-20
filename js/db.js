let db;
let dbReady = false;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TKS_DB", 1);

    request.onupgradeneeded = function (e) {
      db = e.target.result;
      if (!db.objectStoreNames.contains("records")) {
        db.createObjectStore("records", { keyPath: "uuid" });
      }
    };

    request.onsuccess = function (e) {
      db = e.target.result;
      dbReady = true;
      resolve();
    };

    request.onerror = function () {
      reject("IndexedDB failed");
    };
  });
}

function saveRecord(record) {
  if (!dbReady) {
    alert("Database not ready yet.");
    return;
  }

  const tx = db.transaction(["records"], "readwrite");
  const store = tx.objectStore("records");
  store.put(record);
}

function getAllRecords(callback) {
  if (!dbReady) {
    alert("Database not ready yet.");
    return;
  }

  const tx = db.transaction(["records"], "readonly");
  const store = tx.objectStore("records");
  const request = store.getAll();

  request.onsuccess = () => callback(request.result);
}

initDB();
