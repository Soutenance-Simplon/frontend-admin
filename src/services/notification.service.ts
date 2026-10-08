// Importation du module ou composant
import api from './api'

// Exportation
export interface NotificationItem {
  id: string
  destinataireId: string
  type: string
  titre: string
  message: string
  rendezVousId?: string
  lue: boolean
  canal: string
  createdAt: string
}

// Exportation
export const notificationService = {
  async sendNotification(
    destinataireId: string,
    type: string,
    titre: string,
    message: string,
    rdvId?: string,
    canal: string = 'IN_APP'
  ): Promise<NotificationItem | null> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const params = new URLSearchParams()
      params.append('destinataireId', destinataireId)
      params.append('type', type)
      params.append('titre', titre)
      params.append('message', message)
      // Condition logique
      if (rdvId) params.append('rdvId', rdvId)
      params.append('canal', canal)

      // Déclaration de variable
      const res = await api.post(`/notifications/send?${params.toString()}`)
      // Retourne la valeur
      return res.data?.data || null
    } catch (err) {
      // Trace dans la console de debug
      console.warn('Erreur envoi notification:', err)
      // Retourne la valeur
      return null
    }
  },

  async getUserNotifications(userId: string): Promise<NotificationItem[]> {
    // Bloc d'essai pour gérer les erreurs
    try {
      // Déclaration de variable
      const res = await api.get(`/notifications/user/${userId}`)
      // Retourne la valeur
      return res.data?.data || []
    } catch {
      // Retourne la valeur
      return []
    }
  },

  async logAuditAndNotifyDossierAccess(params: {
    patientUserId: string
    patientName: string
    medecinUserId?: string
    medecinName: string
    isEmergency: boolean
    qrToken?: string
  }) {
    // Déclaration de variable
    const timestampStr = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Déclaration de variable
    const actionType = params.isEmergency
      ? 'ACCES_DOSSIER_URGENCE_BRIS_DE_GLACE'
      : 'ACCES_DOSSIER_MEDECIN'

    // Déclaration de variable
    const auditDetails = params.isEmergency
      ? `Accès d'urgence 'Bris de Glace' par ${params.medecinName} sur le dossier de ${params.patientName} (Jeton: ${params.qrToken || 'N/A'})`
      : `Consultation de dossier médical par ${params.medecinName} pour le patient ${params.patientName}`

    // 1. Enregistrer dans le journal d'audit de sécurité
    try {
      // Déclaration de variable
      const auditParams = new URLSearchParams()
      auditParams.append('actionType', actionType)
      // Condition logique
      if (params.medecinUserId) auditParams.append('userId', params.medecinUserId)
      auditParams.append('details', auditDetails)
      auditParams.append('ipAddress', '127.0.0.1')
      auditParams.append('success', 'true')
      // Attente de la promesse (asynchrone)
      await api.post(`/auth/audit/log?${auditParams.toString()}`)
    } catch (e) {
      // Trace dans la console de debug
      console.warn('Audit log fallback:', e)
    }

    // 2. Notifier immédiatement le patient concerné
    const notifType = params.isEmergency ? 'ACCES_DOSSIER_URGENCE' : 'ACCES_DOSSIER_CONSULTE'
    // Déclaration de variable
    const notifTitle = params.isEmergency
      ? '🚨 Alerte Sécurité : Accès d’urgence à votre dossier médical'
      : 'Alerte : Consultation de votre dossier médical'

    // Déclaration de variable
    const notifMessage = params.isEmergency
      ? `${params.medecinName} a accédé à votre dossier médical le ${timestampStr}. Motif déclaré par le praticien : URGENCE MÉDICALE VITALE (« Mode Bris de Glace »).`
      : `${params.medecinName} a consulté votre dossier médical le ${timestampStr} dans le cadre de votre prise en charge.`

    // Retourne la valeur
    return await this.sendNotification(
      params.patientUserId,
      notifType,
      notifTitle,
      notifMessage
    )
  },

  async reportAbusiveAccess(params: {
    patientUserId: string
    patientName: string
    medecinUserId?: string
    medecinName: string
    motif: string
    dateAcces: string
  }) {
    // Déclaration de variable
    const timestampStr = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Déclaration de variable
    const auditDetails = `SIGNALEMENT D'ACCÈS ABUSIF : Le patient ${params.patientName} conteste l'urgence et signale le praticien ${params.medecinName}. Motif : ${params.motif}`

    // 1. Log d'audit ALERTE dans auth_schema.audit_log
    try {
      // Déclaration de variable
      const auditParams = new URLSearchParams()
      auditParams.append('actionType', 'SIGNALEMENT_ACCES_ABUSIF')
      auditParams.append('userId', params.patientUserId)
      auditParams.append('details', auditDetails)
      auditParams.append('ipAddress', '127.0.0.1')
      auditParams.append('success', 'false')
      // Attente de la promesse (asynchrone)
      await api.post(`/auth/audit/log?${auditParams.toString()}`)
    } catch (e) {
      // Trace dans la console de debug
      console.warn('Audit log reporting fallback:', e)
    }

    // 2. Notification envoyée au Médecin
    const medecinTitle = '⚠️ Avertissement Déontologique : Accès d’urgence contesté'
    // Déclaration de variable
    const medecinMessage = `Le patient ${params.patientName} a signalé votre accès à son dossier du ${params.dateAcces || timestampStr} comme NON JUSTIFIÉ par une urgence vitale. Motif indiqué : « ${params.motif} ». Une justification formelle est exigée sous 48h (Code Déontologie ONMS).`
    
    // 3. Notification envoyée à l'Administrateur (admin global)
    const adminTitle = '🚨 ALERTE AUDIT : Signalement d’accès médical abusif'
    // Déclaration de variable
    const adminMessage = `Le patient ${params.patientName} signale le médecin ${params.medecinName} pour accès non justifié à son dossier médical (urgence vitale contestée). Motif : « ${params.motif} ». Enquête de conformité requise.`

    // Envoyer au médecin
    if (params.medecinUserId) {
      // Attente de la promesse (asynchrone)
      await this.sendNotification(
        params.medecinUserId,
        'SIGNALEMENT_ACCES_ABUSIF',
        medecinTitle,
        medecinMessage
      )
    }

    // Trouver un admin ID ou envoyer à l'admin
    try {
      // Déclaration de variable
      const adminUsersRes = await api.get('/auth/admin/users?role=ADMIN')
      // Déclaration de variable
      const admins = adminUsersRes.data?.data || []
      // Condition logique
      if (admins.length > 0) {
        // Attente de la promesse (asynchrone)
        await this.sendNotification(
          admins[0].id,
          'SIGNALEMENT_ACCES_ABUSIF',
          adminTitle,
          adminMessage
        )
      }
    } catch {
      // fallback
    }

    // Retourne la valeur
    return true
  }
}
