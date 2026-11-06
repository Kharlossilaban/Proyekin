// Latensi simulasi untuk aksi di atas store mock (U4-6 dst.): memperlihatkan keadaan memuat dan menguji pencegahan kirim
// ganda. Bukan jaringan. Hapus pemanggilnya saat aksi tersambung ke backend sungguhan.

export const SIMULATED_LATENCY_MS = 300;

export const simulateLatency = (ms: number = SIMULATED_LATENCY_MS): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
