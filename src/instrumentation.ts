const REVALIDATE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const INITIAL_DELAY_MS = 5 * 60 * 1000; // let the app finish booting first

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { revalidateJobs } = await import('@/lib/core/pipeline/revalidate-jobs');

  const runOnce = async () => {
    try {
      const { checked, deactivated } = await revalidateJobs();
      if (checked > 0) {
        console.log(`[revalidate-jobs] ${checked} vaga(s) checada(s), ${deactivated} marcada(s) como inativa(s)`);
      }
    } catch (err) {
      console.error('[revalidate-jobs] Falha ao revalidar vagas:', err);
    }
  };

  setTimeout(() => {
    runOnce();
    setInterval(runOnce, REVALIDATE_INTERVAL_MS);
  }, INITIAL_DELAY_MS);
}
