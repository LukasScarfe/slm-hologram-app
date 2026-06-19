/**
 * WorkerQueue — wraps a Web Worker with a bounded FIFO queue.
 *
 * At most `maxQueue` messages may be waiting to be processed at once.
 * If a new message arrives when the queue is already at the limit, the
 * OLDEST queued message is evicted so the worker always converges on the
 * most recent request rather than replaying stale state.
 *
 * Usage:
 *   const q = new WorkerQueue(worker, (e) => handleResult(e), 10);
 *   q.post({ type: 'COMPUTE', payload: ... });
 *   // on cleanup:
 *   q.terminate();
 */
export class WorkerQueue {
  constructor(worker, onResult, maxQueue = 10) {
    this._worker = worker;
    this._maxQueue = maxQueue;
    this._queue = [];
    this._busy = false;

    worker.onmessage = (e) => {
      this._busy = false;
      onResult(e);
      this._processNext();
    };

    worker.onerror = () => {
      this._busy = false;
      this._processNext();
    };
  }

  post(message) {
    this._queue.push(message);
    // Evict oldest when over the limit
    while (this._queue.length > this._maxQueue) {
      this._queue.shift();
    }
    this._processNext();
  }

  _processNext() {
    if (this._busy || this._queue.length === 0) return;
    const msg = this._queue.shift();
    this._busy = true;
    this._worker.postMessage(msg);
  }

  get queueLength() {
    return this._queue.length;
  }

  terminate() {
    this._worker.terminate();
    this._queue = [];
    this._busy = false;
  }
}
