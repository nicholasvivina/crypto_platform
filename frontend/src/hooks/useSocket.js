import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { updateTicker, setConnected } from '../store/slices/marketSlice';
import { WS_URL } from '../config/constants';

let socketInstance = null;

export const useSocket = () => {
  const accessToken = useSelector((s) => s.auth.accessToken);

  const getSocket = useCallback(() => {
    if (!socketInstance || !socketInstance.connected) {
      socketInstance = io(WS_URL, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    return socketInstance;
  }, [accessToken]);

  const disconnect = useCallback(() => {
    if (socketInstance) { socketInstance.disconnect(); socketInstance = null; }
  }, []);

  return { getSocket, disconnect };
};

export const useMarketStream = (pairs = []) => {
  const dispatch = useDispatch();
  const { getSocket } = useSocket();
  const subscribedPairs = useRef(new Set());

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => dispatch(setConnected(true));
    const handleDisconnect = () => dispatch(setConnected(false));
    const handlePriceUpdate = (data) => dispatch(updateTicker(data));

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('price:update', handlePriceUpdate);

    // Subscribe to requested pairs
    pairs.forEach((pair) => {
      if (!subscribedPairs.current.has(pair)) {
        socket.emit('subscribe:pair', pair);
        subscribedPairs.current.add(pair);
      }
    });

    if (socket.connected) dispatch(setConnected(true));

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('price:update', handlePriceUpdate);
    };
  }, [pairs.join(','), dispatch, getSocket]);
};
