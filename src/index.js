'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const { Server } = require('socket.io');
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: '*', // Allow all origins for simplicity
      },
    });
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = strapi.plugins['users-permissions'].services.jwt.verify(token);
        socket.user = decoded; // Attach user information to the socket
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Echo received messages back to the client
      socket.on('message', (message) => {
        console.log(`Message received from ${socket.id}: ${message}`);
        socket.emit('message', `🤖: ${message}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    strapi.io = io; // Attach io to Strapi for global usage
  },
};
