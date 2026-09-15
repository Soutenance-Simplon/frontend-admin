import api from './api'

export interface AuditLogItem {
  id: string
  // QUI
  actorName: string
  actorRole: 'ADMIN' | 'MEDECIN' | 'PATIENT' | 'SYSTEME'
  actorTelephone?: string
  // QUOI
  actionCategory: 'CONNEXION' | 'MEDICAL' | 'FINANCE' | 'ONMS' | 'SECURITE' | 'DOSSIER' | 'COMPTE'
  actionTitle: string
  description: string
  // SUR QUOI (CIBLE)
  targetResource?: string
  // QUAND & À QUEL MOMENT
  createdAt: string
  // RÉSULTAT
  status: 'SUCCES' | 'ALERTE' | 'INFO'

  // Backward compatibility fields
  action?: string
  telephoneTente?: string
  ipAdresse?: string
  user?: {
    id?: string
    firstName?: string
    lastName?: string
    telephone?: string
    role?: string
  }
}

function parseActionDetails(actRaw: string, details?: string, ip?: string, tel?: string): {
  category: AuditLogItem['actionCategory']
  title: string
  desc: string
  target: string
} {
  const act = (actRaw || '').toUpperCase()
  let category: AuditLogItem['actionCategory'] = 'CONNEXION'
  let title = 'Action Système'
  let desc = details || 'Opération enregistrée'
  let target = ip ? `IP : ${ip}` : (tel ? `Tél : ${tel}` : 'Plateforme Diam-Yaraam')

  switch (act) {
    case 'CONNEXION_REUSSIE':
      category = 'CONNEXION'
      title = 'Connexion Réussie'
      desc = details || 'Authentification sécurisée avec succès'
      break
    case 'ECHEC_CONNEXION':
      category = 'SECURITE'
      title = 'Échec de Connexion'
      desc = details || 'Tentative infructueuse d’accès'
      break
    case 'CREATION_COMPTE':
      category = 'COMPTE'
      title = 'Création de Compte'
      desc = details || 'Création d’un nouvel utilisateur'
      break
    case 'ACTIVATION_COMPTE':
      category = 'COMPTE'
      title = 'Activation de Compte'
      desc = details || 'Compte activé et validé'
      break
    case 'COMPTE_BLOQUE':
      category = 'SECURITE'
      title = 'Compte Verrouillé'
      desc = details || 'Compte temporairement bloqué suite à anomalies'
      break
    case 'COMPTE_DEBLOQUE':
      category = 'SECURITE'
      title = 'Compte Déverrouillé'
      desc = details || 'Déblocage du compte utilisateur'
      break
    case 'CHANGEMENT_MOT_DE_PASSE':
      category = 'SECURITE'
      title = 'Changement Mot de Passe'
      desc = details || 'Modification du mot de passe effectuée'
      break
    case 'DEMANDE_REINITIALISATION_MDP':
      category = 'SECURITE'
      title = 'Demande Réinitialisation MDP'
      desc = details || 'Procédure de récupération engagée'
      break
    case 'OTP_ENVOYE':
      category = 'SECURITE'
      title = 'Code OTP Envoyé'
      desc = details || 'Code de vérification expédié par SMS'
      break
    case 'OTP_VALIDE':
      category = 'SECURITE'
      title = 'Code OTP Validé'
      desc = details || 'Validation à deux facteurs réussie'
      break
    case 'OTP_EXPIRE':
      category = 'SECURITE'
      title = 'Code OTP Expiré'
      desc = details || 'Délai de validité du code SMS dépassé'
      break
    case 'OTP_ECHEC':
      category = 'SECURITE'
      title = 'Échec Code OTP'
      desc = details || 'Saisie de code OTP erronée'
      break
    case 'OTP_MAX_ATTEINT':
      category = 'SECURITE'
      title = 'Seuil Max OTP Atteint'
      desc = details || 'Tentatives de saisie OTP maximales atteintes'
      break
    case 'MODIFICATION_PROFIL':
      category = 'COMPTE'
      title = 'Mise à Jour Profil'
      desc = details || 'Informations personnelles modifiées'
      break
    case 'ACCES_DOSSIER_MEDECIN':
      category = 'DOSSIER'
      title = 'Accès Dossier Médical'
      desc = details || 'Consultation du dossier médical par un praticien'
      break
    case 'ACCES_DOSSIER_URGENCE_BRIS_DE_GLACE':
      category = 'DOSSIER'
      title = 'Urgence Bris de Glace'
      desc = details || 'Accès exceptionnel en urgence vitale déclaré'
      break
    case 'SIGNALEMENT_ACCES_ABUSIF':
      category = 'SECURITE'
      title = 'Signalement Accès Abusif'
      desc = details || 'Contestation d’accès d’urgence émise par le patient'
      break
    default:
      if (act.includes('PAIEMENT') || act.includes('WALLET') || act.includes('TRANSACTION')) {
        category = 'FINANCE'
        title = 'Transaction Financière'
      } else if (act.includes('RDV') || act.includes('CONSULT')) {
        category = 'MEDICAL'
        title = 'Consultation / RDV'
      } else if (act.includes('ONMS') || act.includes('ORDRE')) {
        category = 'ONMS'
        title = 'Conformité Ordinale'
      } else if (act.includes('SIGNALEMENT')) {
        category = 'SECURITE'
        title = 'Signalement Déontologique'
      } else if (act.includes('DOSSIER') || act.includes('BRIS_DE_GLACE')) {
        category = 'DOSSIER'
        title = 'Accès Dossier Médical'
      }
      break
  }

  return { category, title, desc, target }
}

export const systemService = {
  async getRecentAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const res = await api.get('/auth/audit/recent')
      const backendLogs = res.data?.data || []
      if (Array.isArray(backendLogs)) {
        return backendLogs.map((b: any, idx: number): AuditLogItem => {
          const actRaw = b.actionType || b.action || ''
          const { category, title, desc, target } = parseActionDetails(
            actRaw,
            b.details || b.description,
            b.ipAddress || b.ipAdresse,
            b.telephoneTente
          )

          let role: AuditLogItem['actorRole'] = 'SYSTEME'
          const rawRole = (b.userRole || b.user?.role?.nomRole || b.user?.role || '').toUpperCase()
          if (rawRole.includes('ADMIN')) role = 'ADMIN'
          else if (rawRole.includes('MEDECIN')) role = 'MEDECIN'
          else if (rawRole.includes('PATIENT')) role = 'PATIENT'
          else if (b.userName || b.userTelephone || b.telephoneTente) role = 'PATIENT'

          const actorName = b.userName ||
            (b.user ? `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() : null) ||
            (b.telephoneTente ? `Utilisateur (${b.telephoneTente})` : 'Utilisateur Système')

          const actorTelephone = b.userTelephone || b.user?.telephone || b.telephoneTente || ''

          const isAlert = actRaw.includes('SIGNALEMENT') || actRaw.includes('BRIS_DE_GLACE') || actRaw.includes('BLOQUE')
          const isSuccess = b.success !== false && !actRaw.includes('ECHEC') && !isAlert

          return {
            id: String(b.id || `audit-${idx}`),
            actorName,
            actorRole: role,
            actorTelephone: actorTelephone || undefined,
            actionCategory: category,
            actionTitle: title,
            description: desc,
            targetResource: target,
            createdAt: b.createdAt || new Date().toISOString(),
            status: isAlert ? 'ALERTE' : (isSuccess ? 'SUCCES' : 'ALERTE'),
            action: actRaw,
            telephoneTente: b.telephoneTente,
            ipAdresse: b.ipAddress || b.ipAdresse
          }
        })
      }
    } catch (err) {
      console.error('Erreur chargement journaux audit réels:', err)
    }

    return []
  }
}

