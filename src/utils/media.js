import { Api } from '@/utils';
import store from '@/store';
import Worker from "worker-loader?name=decrypter.worker.js!./workers/decrypter.worker.js";

// IndexedDB
const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB
        || window.OIndexedDB || window.msIndexedDB;
const dbVersion = 1.0;

// DB name consts
const dbName = "mediaFiles";
const storeName = "media";

export default class MediaLoader {
    /**
     * MediaLoader - gets media from server or local store.
     * Sets up indexedDB and object store
     *
     * NOTE: This entire class was written on various pre/post-operative drugs
     * around the time of my lumbar discectomy surgery. And it works.
     */
    constructor () {
        this.db = null;

        this.db_req = indexedDB.open(dbName, dbVersion);

        this.db_req.onerror = () => {
            console.log("Error creating/accessing IndexedDB database");
        };

        this.db_req.onsuccess = () => {
            this.db = this.db_req.result;

            this.db.onerror = () => {
                console.log("Error creating/accessing IndexedDB database");
            };

            if (this.db.setVersion) {
                if (this.db.version != dbVersion) {
                    const setVersion = this.db.setVersion(dbVersion);
                    setVersion.onsuccess = () => {
                        this.createObjectStore(this.db);
                    };
                }
            }
        };

        this.db_req.onupgradeneeded = (event) => {
            this.createObjectStore(event.target.result);
        };
    }

    /**
     * getMedia - get's media from server or local store
     *
     * @param id - device id (media id)
     * @return Promise
     */
    getMedia(id) {
        return new Promise((resolve) => {
            this.getMediaFromStore(id) // Atempt to get media from local store
                .then(response => resolve(response))
                .catch(() => {
                    this.getMediaFromServer(id) // If fail, get from server
                        .then(response => resolve(response))
                        .catch(response => console.log(response));
                });
        });
    }

    /**
     * getMediaFromStore - gets media from local indexedDB store.
     *
     * @param id - device id (media id)
     * @return Promise
     */
    getMediaFromStore (id) {
        return new Promise((resolve, reject) => {

            const transaction = this.getTransaction();

            // Retreive file
            const req = transaction.objectStore(storeName).get(id);
            req.onsuccess = (event) => {
                // Get media from event
                const media_blob = event.target.result;

                if (media_blob != null)
                    resolve(media_blob); // Return media
                else
                    reject(null); // Return media
            };
        });
    }

    /**
     * getMediaFromServer - gets media from remote server
     *
     * @param id - device id (media id)
     * @return Promise
     */
    getMediaFromServer (id) {
        return new Promise((resolve, reject) => {
            Api.messages.media.get(id)
                .then(data => {

                    console.log("fetching media from web");

                    // get media out of json response
                    const imageData = data.data.data;

                    // One user was having issues with the web app freezing. It was coming from decrypting images...
                    // with data.length on the blob:

                    // freezing image size: 63,214,836
                    // good image size:         40,125
                    // good image size:        124,914

                    // TODO: Now that we are loading things off on the worker thread, can this restriction be removed?
                    if (imageData.length > 10000000) {
                        return reject(null);
                    }

                    // Reject empty response
                    if (!imageData || imageData == null)
                        return reject(null);

                    // We are offloading the decryption to a web worker, because it can be extremely intensive and lock up the UI
                    // https://github.com/klinker-apps/pulse-sms-web/issues/28

                    const database = this.db;
                    const getTransactionFunction = this.getTransaction;
                    const storeMediaFunction = this.storeMedia;
                    function handleWorkerCompletion(message) {
                        if (message.data.command == "done") {
                            // Store blob
                            storeMediaFunction(id, message.data.image, getTransactionFunction(database));

                            // Send back blob
                            resolve(message.data.image);

                            // unregister listener
                            worker.removeEventListener("message", handleWorkerCompletion);
                            worker.terminate();
                        }
                    }

                    const worker = new Worker();
                    worker.addEventListener("message", handleWorkerCompletion, false);

                    // Decrypt blob
                    worker.postMessage({
                        "imageData": imageData,
                        "key": store.state.key,
                    });
                });
        });
    }

    /**
     * Store media in indexDb
     *
     * @param id - device id
     * @param media_blob - data blob
     */
    storeMedia (id, media_blob, trans) {

        // Put the blob into the dabase
        //
        const transaction = trans ? trans : this.getTransaction();
        transaction.objectStore(storeName).put(media_blob, id);
    }

    /**
     * getTransaction - get db transaction for storeObject
     * @return transaction object
     */
    getTransaction (db) {
        // Open a transaction to the database
        const readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
        return db ? db.transaction([storeName], readWriteMode) : this.db.transaction([storeName], readWriteMode);
    }
    /**
     * createObjectStore - create ObjectStore in indexDb
     */
    createObjectStore (db) {
        db.createObjectStore(storeName);
    }
}
