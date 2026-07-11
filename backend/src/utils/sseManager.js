/**
 * SSE Manager — manages Server-Sent Events connections.
 * Singleton that tracks active client connections per user.
 */
class SSEManager {
  constructor() {
    // userId → Set<Response>
    this.clients = new Map();
  }

  /**
   * Register a new SSE client for a user.
   * Automatically cleans up when the client disconnects.
   * @param {string} userId
   * @param {import('express').Response} res
   */
  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);

    // Cleanup when client disconnects
    res.on('close', () => {
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(res);
        if (userClients.size === 0) {
          this.clients.delete(userId);
        }
      }
    });
  }

  /**
   * Push a notification to a specific user's SSE connections.
   * @param {string} userId
   * @param {object} data
   */
  sendToUser(userId, data) {
    const userClients = this.clients.get(userId);
    if (userClients && userClients.size > 0) {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      userClients.forEach((res) => {
        try {
          res.write(message);
        } catch (_err) {
          // Client may have disconnected; ignore write errors
          userClients.delete(res);
        }
      });
    }
  }

  /**
   * Check whether a user currently has active SSE connections.
   * @param {string} userId
   * @returns {boolean}
   */
  isOnline(userId) {
    return this.clients.has(userId) && this.clients.get(userId).size > 0;
  }

  /**
   * Get the number of active connections across all users.
   * @returns {number}
   */
  getTotalConnections() {
    let total = 0;
    this.clients.forEach((set) => { total += set.size; });
    return total;
  }

  /**
   * Broadcast an event to all active connections.
   * @param {object} data
   */
  broadcast(data) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((userClients) => {
      userClients.forEach((res) => {
        try {
          res.write(message);
        } catch (_err) {
          userClients.delete(res);
        }
      });
    });
  }
}

// Export as singleton
module.exports = new SSEManager();
