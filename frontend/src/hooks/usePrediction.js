import { useQuery } from 'react-query';
import { aiAPI } from '../api';
export const usePrediction = (pair) =>
  useQuery(['prediction', pair], () => aiAPI.getPrediction(pair).then((r) => r.data.data.prediction), { enabled: !!pair, refetchInterval: 30000 });
export const useSignals = () =>
  useQuery('signals', () => aiAPI.getSignals().then((r) => r.data.data.signals), { refetchInterval: 60000 });
