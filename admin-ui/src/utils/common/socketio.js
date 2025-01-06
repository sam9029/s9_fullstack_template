import { io } from 'socket.io-client';
import { getToken } from '@/utils/common/auth';

function socketIoClient() {
  let token = getToken();
  var socket = io(process.env.VUE_APP_WS_API, {
    transports: ['websocket'],
    path: '/api/socket',
    reconnectionDelayMax: 5000,
    reconnectionAttempts: process.env.NODE_ENV === 'development' ? 3 : 'Infinity',
    auth: { token, type: 'DSP_CILENT_PUSH_LOG' },
  });
  socket.on('connect', () => {
    // console.log(socket.id); // 'G5p5...'
  });
  socket.on('connect_error', (err) => {
    console.log('socket连接失败', err); // 'G5p5...'
  });
  socket.on('disconnect', (timeout) => {
    console.log('socket断开连接', timeout);
  });
  return socket;
}

export { socketIoClient };
