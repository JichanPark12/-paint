import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../socket/io';

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (req.method === 'POST') {
    const message = req.body;
    console.log(message);
    if (res.socket) res.socket.server.io.emit('message', message);
    res.status(201).json(message);
  }
}
