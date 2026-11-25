import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  getUserProfile,
  getJournalEntries,
  getDiagnosticResults,
  getPacteEntries,
  getUserProgress,
  getUserStreak,
} from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Construction du HTML — rendu ensuite en PDF via expo-print.
// Fond clair volontairement (document destiné à être lu/imprimé), accents
// dorés de la marque en filigrane du thème sombre de l'app.
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface ExportData {
  prenom: string;
  email: string;
  memberSince: string;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  diagnostics: { created_at: string; scores: Record<string, number> }[];
  journalEntries: { title: string; content: string; date: string; created_at: string }[];
  pacteEntries: { content: string; created_at: string; unlock_date: string }[];
}

function buildHtml(data: ExportData): string {
  const diagnosticsHtml = data.diagnostics.length
    ? data.diagnostics.map(d => `
        <div class="entry">
          <div class="entry-date">${formatDate(d.created_at)}</div>
          <table class="scores">
            ${Object.entries(d.scores).map(([pillar, score]) => `
              <tr><td>${escapeHtml(pillar)}</td><td class="score-value">${score}/10</td></tr>
            `).join('')}
          </table>
        </div>
      `).join('')
    : '<p class="empty">Aucun diagnostic enregistré.</p>';

  const journalHtml = data.journalEntries.length
    ? data.journalEntries.map(j => `
        <div class="entry">
          <div class="entry-date">${formatDate(j.created_at)}</div>
          <div class="entry-title">${escapeHtml(j.title || 'Sans titre')}</div>
          <div class="entry-content">${escapeHtml(j.content).replace(/\n/g, '<br>')}</div>
        </div>
      `).join('')
    : '<p class="empty">Aucune entrée de journal.</p>';

  const pacteHtml = data.pacteEntries.length
    ? data.pacteEntries.map(p => `
        <div class="entry pacte-entry">
          <div class="entry-date">Écrit le ${formatDate(p.created_at)} — déverrouillage prévu le ${formatDate(p.unlock_date)}</div>
          <div class="entry-content">${escapeHtml(p.content).replace(/\n/g, '<br>')}</div>
        </div>
      `).join('')
    : '<p class="empty">Aucun pacte enregistré.</p>';

  return `
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; color: #1A1A2E; padding: 40px; line-height: 1.6; }
      h1 { font-size: 28px; color: #1A1A2E; border-bottom: 3px solid #C4A35A; padding-bottom: 12px; margin-bottom: 4px; }
      .subtitle { color: #6b6b7d; font-size: 13px; margin-bottom: 40px; }
      h2 { font-size: 18px; color: #C4A35A; text-transform: uppercase; letter-spacing: 1px; margin-top: 40px; border-bottom: 1px solid #e0ddd4; padding-bottom: 8px; }
      .stats-row { display: flex; gap: 24px; margin: 20px 0 40px 0; }
      .stat-box { border: 1px solid #e0ddd4; border-radius: 8px; padding: 16px 20px; text-align: center; }
      .stat-value { font-size: 24px; font-weight: bold; color: #1A1A2E; }
      .stat-label { font-size: 11px; color: #6b6b7d; text-transform: uppercase; }
      .entry { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0efe9; }
      .entry-date { font-size: 12px; color: #6b6b7d; margin-bottom: 6px; }
      .entry-title { font-size: 15px; font-weight: bold; margin-bottom: 6px; }
      .entry-content { font-size: 13px; white-space: pre-wrap; }
      .pacte-entry { background: #faf8f2; padding: 16px; border-radius: 8px; border-bottom: none; }
      .scores { width: 100%; border-collapse: collapse; margin-top: 8px; }
      .scores td { padding: 4px 0; font-size: 13px; }
      .score-value { text-align: right; color: #C4A35A; font-weight: bold; }
      .empty { color: #999; font-style: italic; font-size: 13px; }
      .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e0ddd4; font-size: 11px; color: #999; text-align: center; }
    </style>
  </head>
  <body>
    <h1>Mes données — Le Code Masculin</h1>
    <div class="subtitle">${escapeHtml(data.prenom)} · ${escapeHtml(data.email)} · Membre depuis ${data.memberSince}</div>

    <div class="stats-row">
      <div class="stat-box"><div class="stat-value">${data.currentStreak}</div><div class="stat-label">Streak actuel</div></div>
      <div class="stat-box"><div class="stat-value">${data.longestStreak}</div><div class="stat-label">Record streak</div></div>
      <div class="stat-box"><div class="stat-value">${data.lessonsCompleted}</div><div class="stat-label">Leçons complétées</div></div>
    </div>

    <h2>Diagnostics</h2>
    ${diagnosticsHtml}

    <h2>Journal de réflexion</h2>
    ${journalHtml}

    <h2>Pacte avec toi-même</h2>
    ${pacteHtml}

    <div class="footer">
      Document généré le ${formatDate(new Date().toISOString())} · Pilier Conscient · pilierconscient.com
    </div>
  </body>
  </html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée — récupère les données, génère le PDF, ouvre le partage
// ─────────────────────────────────────────────────────────────────────────────

export async function exportUserData(userId: string): Promise<void> {
  const [profileRes, journalRes, diagnosticsRes, pacteRes, progressRes, streakRes] = await Promise.all([
    getUserProfile(userId),
    getJournalEntries(userId, 200),
    getDiagnosticResults(userId),
    getPacteEntries(userId),
    getUserProgress(userId),
    getUserStreak(userId),
  ]);

  const profile = profileRes.data;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'récemment';

  const data: ExportData = {
    prenom: profile?.prenom ?? profile?.name ?? 'Utilisateur',
    email: profile?.email ?? '',
    memberSince,
    currentStreak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
    lessonsCompleted: progressRes.data?.length ?? 0,
    diagnostics: diagnosticsRes.data ?? [],
    journalEntries: journalRes.data ?? [],
    pacteEntries: pacteRes.data ?? [],
  };

  const html = buildHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exporter mes données',
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Le partage de fichiers n\'est pas disponible sur cet appareil.');
  }
}
