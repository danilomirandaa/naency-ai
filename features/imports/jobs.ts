import type { ImportBatchSummary } from '@/features/imports/types';

export type JobNotice = {
  batchId: string;
  title: string;
  description: string;
  variant: 'success' | 'critical';
};

/** Lotes que estavam processando e pararam desde a última verificação. */
export function finishedBatches(previous: ImportBatchSummary[], current: ImportBatchSummary[]) {
  const running = new Set(previous.filter((batch) => batch.job).map((batch) => batch.id));
  return current.filter((batch) => running.has(batch.id) && !batch.job);
}

/** Texto do aviso, pelo que aconteceu com o lote. */
export function jobNotice(batch: ImportBatchSummary): JobNotice {
  if (batch.jobError) {
    return {
      batchId: batch.id,
      title: 'A importação não terminou',
      description: `${batch.fileName}: ${batch.jobError}`,
      variant: 'critical',
    };
  }
  if (batch.status === 'committed') {
    return {
      batchId: batch.id,
      title: 'Importação concluída',
      description: `${batch.rowCount === 1 ? '1 linha' : `${batch.rowCount} linhas`} de ${batch.fileName} em ${batch.accountName}.`,
      variant: 'success',
    };
  }
  return {
    batchId: batch.id,
    title: 'Sugestões prontas',
    description: `A AI terminou de ler ${batch.fileName}. Revise antes de importar.`,
    variant: 'success',
  };
}

/** Avisa pelo sistema operacional quando a aba está em segundo plano. */
export function notifyOutsideTab({ title, description }: Pick<JobNotice, 'title' | 'description'>) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return false;
  }
  if (typeof document !== 'undefined' && !document.hidden) {
    return false;
  }
  new Notification(title, { body: description, tag: 'naency-import', icon: '/favicon.ico' });
  return true;
}

/** Pede permissão no clique, única hora em que o navegador aceita. */
export async function askForNotifications() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
    return;
  }
  await Notification.requestPermission().catch(() => undefined);
}
