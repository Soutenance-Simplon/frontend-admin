import api from './api'

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

export const notificationService = {
  async sendNotification(
    destinataireId: string,
    type: string,
    titre: string,
    message: string,
    rdvId?: string,
    canal: string = 'IN_APP'
  ): Promise<NotificationItem | null> {
    try {
      const params = new URLSearchParams()
      params.append('destinataireId', destinataireId)
      params.append('type', type)
      params.append('titre', titre)
      params.append('message', message)
      if (rdvId) params.append('rdvId', rdvId)
      params.append('canal', canal)

      const res = await api.post(`/notifications/send?${params.toString()}`)
      return res.data?.data || null
    } catch (err) {
      console.warn('Erreur envoi notification:', err)
      return null
    }
  },

  async getUserNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const res = await api.get(`/notifications/user/${userId}`)
      return res.data?.data || []
    } catch {
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
    const timestampStr = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const actionType = params.isEmergency
      ? 'ACCES_DOSSIER_URGENCE_BRIS_DE_GLACE'
      : 'ACCES_DOSSIER_MEDECIN'

    const auditDetails = params.isEmergency
      ? `Accès d'urgence 'Bris de Glace' par ${params.medecinName} sur le dossier de ${params.patientName} (Jeton: ${params.qrToken || 'N/A'})`
      : `Consultation de dossier médical par ${params.medecinName} pour le patient ${params.patientName}`

    // 1. Enregistrer dans le journal d'audit de sécurité
    try {
      const auditParams = new URLSearchParams()
      auditParams.append('actionType', actionType)
      if (params.medecinUserId) auditParams.append('userId', params.medecinUserId)
      auditParams.append('details', auditDetails)
      auditParams.append('ipAddress', '127.0.0.1')
      auditParams.append('success', 'true')
      await api.post(`/auth/audit/log?${auditParams.toString()}`)
    } catch (e) {
      console.warn('Audit log fallback:', e)
    }

    // 2. Notifier immédiatement le patient concerné
    const notifType = params.isEmergency ? 'ACCES_DOSSIER_URGENCE' : 'ACCES_DOSSIER_CONSULTE'
    const notifTitle = params.isEmergency
      ? '🚨 Alerte Sécurité : Accès d’urgence à votre dossier médical'
      : 'Alerte : Consultation de votre dossier médical'

    const notifMessage = params.isEmergency
      ? `${params.medecinName} a accédé à votre dossier médical le ${timestampStr}. Motif déclaré par le praticien : URGENCE MÉDICALE VITALE (« Mode Bris de Glace »).`
      : `${params.medecinName} a consulté votre dossier médical le ${timestampStr} dans le cadre de votre prise en charge.`

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
    const timestampStr = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const auditDetails = `SIGNALEMENT D'ACCÈS ABUSIF : Le patient ${params.patientName} conteste l'urgence et signale le praticien ${params.medecinName}. Motif : ${params.motif}`

    // 1. Log d'audit ALERTE dans auth_schema.audit_log
    try {
      const auditParams = new URLSearchParams()
      auditParams.append('actionType', 'SIGNALEMENT_ACCES_ABUSIF')
      auditParams.append('userId', params.patientUserId)
      auditParams.append('details', auditDetails)
      auditParams.append('ipAddress', '127.0.0.1')
      auditParams.append('success', 'false')
      await api.post(`/auth/audit/log?${auditParams.toString()}`)
    } catch (e) {
      console.warn('Audit log reporting fallback:', e)
    }

    // 2. Notification envoyée au Médecin
    const medecinTitle = '⚠️ Avertissement Déontologique : Accès d’urgence contesté'
    const medecinMessage = `Le patient ${params.patientName} a signalé votre accès à son dossier du ${params.dateAcces || timestampStr} comme NON JUSTIFIÉ par une urgence vitale. Motif indiqué : « ${params.motif} ». Une justification formelle est exigée sous 48h (Code Déontologie ONMS).`
    
    // 3. Notification envoyée à l'Administrateur (admin global)
    const adminTitle = '🚨 ALERTE AUDIT : Signalement d’accès médical abusif'
    const adminMessage = `Le patient ${params.patientName} signale le médecin ${params.medecinName} pour accès non justifié à son dossier médical (urgence vitale contestée). Motif : « ${params.motif} ». Enquête de conformité requise.`

    // Envoyer au médecin
    if (params.medecinUserId) {
      await this.sendNotification(
        params.medecinUserId,
        'SIGNALEMENT_ACCES_ABUSIF',
        medecinTitle,
        medecinMessage
      )
    }

    // Trouver un admin ID ou envoyer à l'admin
    try {
      const adminUsersRes = await api.get('/auth/admin/users?role=ADMIN')
      const admins = adminUsersRes.data?.data || []
      if (admins.length > 0) {
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

    return true
  }
}
