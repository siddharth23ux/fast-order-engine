import { FastifyRequest } from 'fastify';
import { redisSub } from '../../lib/redis';
import { log } from '../../lib/logger';

export default (connection: any, req: FastifyRequest) => {
  const socket = connection.socket;
  let subscribedChannel: string | null = null;
  let redisListener: ((channel: string, message: string) => void) | null = null;

  const cleanup = async () => {
    try {
      if (subscribedChannel) {
        await redisSub.unsubscribe(subscribedChannel);
      }
    } catch (e) {
      // ignore unsubscribe errors
    }
    subscribedChannel = null;
    if (redisListener) {
      redisSub.off('message', redisListener);
      redisListener = null;
    }
  };

  socket.on('message', async (msg: Buffer) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.action === 'subscribe' && data.orderId) {
        const channel = `order:${data.orderId}`;
        subscribedChannel = channel;

        if (redisListener) {
          redisSub.off('message', redisListener);
        }

        redisListener = (ch: string, message: string) => {
          if (ch === channel) {
            try {
              socket.send(message);
            } catch (err) {
              // swallow send error (socket may be closed)
            }
          }
        };

        // Subscribe and attach listener
        await redisSub.subscribe(channel);
        redisSub.on('message', redisListener);

        socket.send(JSON.stringify({ status: 'subscribed', orderId: data.orderId }));
        log(`WS subscribed to ${channel}`);
      } else {
        socket.send(JSON.stringify({ error: 'unknown action or missing orderId' }));
      }
    } catch (err) {
      socket.send(JSON.stringify({ error: 'invalid message format' }));
    }
  });

  socket.on('close', async () => {
    await cleanup();
  });

  socket.on('error', async (err: any) => {
    log('ws error', err);
    await cleanup();
  });
};
