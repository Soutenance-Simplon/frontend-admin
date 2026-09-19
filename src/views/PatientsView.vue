<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import Modal from '../components/common/Modal.vue'
import Pagination from '../components/common/Pagination.vue'
import {
  patientService,
  type PatientProfile,
  type DossierMedical
} from '../services/patient.service'
import { userService, type UserItem } from '../services/user.service'
import { notificationService } from '../services/notification.service'
import { useToast } from '../composables/useToast'
import {
  Search,
  FileText,
  HeartPulse,
  AlertTriangle,
  Users,
  QrCode,
  CheckCircle2,
  Copy,
  Printer,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Check,
  Lock,
  Unlock,
  AlertOctagon,
  Scan,
  UserCheck,
  Smartphone,
  Flag,
  Clock,
  Radio,
  Eye
} from 'lucide-vue-next'

const toast = useToast()

const patients = ref<PatientProfile[]>([])
const usersMap = ref<Map<string, UserItem>>(new Map())
const loading = ref(true)
const searchQuery = ref('')

// Administrative Patient Modal
const isPatientModalOpen = ref(false)
const selectedPatient = ref<PatientProfile | null>(null)
const selectedDossier = ref<DossierMedical | null>(null)
const patientFamille = ref<any[]>([])
const loadingDossier = ref(false)
const qrCodeDataUrl = ref<string>('')
const copiedQr = ref(false)

// Emergency QR Scan & Patient Reporting Simulation Modal
const isScanSimModalOpen = ref(false)
const scanSimEmergencyChoice = ref<'none' | 'urgent' | 'not_urgent'>('none')
const doctorName = ref('Dr. Cheikh Fall (Cardiologie - Hôpital Principal)')
const patientVerificationState = ref<'waiting' | 'confirmed' | 'reporting' | 'reported'>('waiting')
const reportMotifPreset = ref('Je n’étais absolument pas en situation d’urgence vitale ce jour-là.')
const reportMotifCustom = ref('')
const isSendingReport = ref(false)
const lastEmergencyAccessDate = ref('')
const activeSimTab = ref<'soignant' | 'patient'>('soignant')

interface PatientAccessRecord {
  id: string
  medecin: string
  specialite: string
  hopital: string
  date: string
  isUrgence: boolean
  statut: 'EN_ATTENTE_CONFIRMATION' | 'CONFIRME_PAR_PATIENT' | 'SIGNALE_ABUSIF'
  motifSignalement?: string
}

const patientAccessLogs = ref<PatientAccessRecord[]>([
  {
    id: 'acc-prev-1',
    medecin: 'Dr. Aminata Mbaye',
    specialite: 'Médecine Générale',
    hopital: 'Centre de Santé de Dakar-Plateau',
    date: '18/09/2026 à 10:30',
    isUrgence: false,
    statut: 'CONFIRME_PAR_PATIENT'
  }
])

const fetchPatients = async () => {
  loading.value = true
  try {
    const [pts, allUsers] = await Promise.all([
      patientService.getAllPatients(),
      userService.getAllUsers()
    ])
    patients.value = pts
    const map = new Map<string, UserItem>()
    allUsers.forEach(u => map.set(u.id, u))
    usersMap.value = map
  } catch {
    toast.error('Erreur lors du chargement des patients')
  } finally {
    loading.value = false
  }
}

const getPatientUser = (patient: PatientProfile): UserItem | undefined => {
  return usersMap.value.get(patient.userId)
}

const getPatientName = (patient: PatientProfile): string => {
  const u = getPatientUser(patient)
  if (u && (u.firstName || u.lastName)) {
    return `${u.firstName || ''} ${u.lastName || ''}`.trim()
  }
  return `Patient #${patient.id.substring(0, 6).toUpperCase()}`
}

const getPatientPhone = (patient: PatientProfile): string => {
  const u = getPatientUser(patient)
  return u?.telephone || ''
}

const getPatientEmail = (patient: PatientProfile): string => {
  const u = getPatientUser(patient)
  return u?.email || 'Non renseigné'
}

const getPatientInitials = (patient: PatientProfile): string => {
  const u = getPatientUser(patient)
  if (u) {
    const f = u.firstName?.[0] || ''
    const l = u.lastName?.[0] || ''
    const inits = (f + l).toUpperCase()
    if (inits) return inits
  }
  return 'PT'
}

const generateQrCode = async (text: string) => {
  if (!text) {
    qrCodeDataUrl.value = ''
    return
  }
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(text, {
      width: 160,
      margin: 1,
      color: {
        dark: '#090D14',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
  } catch (err) {
    console.error('Erreur génération QR Code:', err)
    qrCodeDataUrl.value = ''
  }
}

const copyQrText = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedQr.value = true
    toast.success('Code QR copié dans le presse-papiers')
    setTimeout(() => {
      copiedQr.value = false
    }, 2500)
  } catch {
    toast.info(`Code : ${text}`)
  }
}

const printDossier = () => {
  window.print()
}

onMounted(() => {
  fetchPatients()
})

const openPatientDetails = async (patient: PatientProfile) => {
  selectedPatient.value = patient
  isPatientModalOpen.value = true
  loadingDossier.value = true
  qrCodeDataUrl.value = ''

  try {
    const [dossierRes, familleRes] = await Promise.allSettled([
      patientService.getDossierByPatientId(patient.id),
      patientService.getMembresFamille(patient.userId)
    ])

    if (dossierRes.status === 'fulfilled' && dossierRes.value) {
      selectedDossier.value = dossierRes.value
      const qrText = dossierRes.value.codeQrSecurise || `QR-PT-${patient.id.substring(0, 8).toUpperCase()}`
      await generateQrCode(qrText)
    } else {
      const qrText = `QR-PT-${patient.id.substring(0, 8).toUpperCase()}`
      await generateQrCode(qrText)
    }

    if (familleRes.status === 'fulfilled' && familleRes.value) {
      patientFamille.value = familleRes.value
    } else {
      patientFamille.value = []
    }
  } catch {
    toast.error('Erreur lors du chargement de la fiche administrative')
  } finally {
    loadingDossier.value = false
  }
}

const openQrScanSimulation = () => {
  scanSimEmergencyChoice.value = 'none'
  patientVerificationState.value = 'waiting'
  activeSimTab.value = 'soignant'
  isScanSimModalOpen.value = true
}

const declareUrgence = async (isUrgent: boolean) => {
  if (isUrgent) {
    scanSimEmergencyChoice.value = 'urgent'
    patientVerificationState.value = 'waiting'
    activeSimTab.value = 'soignant'
    lastEmergencyAccessDate.value = new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const patientName = selectedPatient.value ? getPatientName(selectedPatient.value) : 'Patient'
    const qrToken = selectedDossier.value?.codeQrSecurise || ('QR-PT-' + selectedPatient.value?.id.substring(0, 8).toUpperCase())

    // 1. Enregistrement d'audit et notification réelle vers notification-service et auth-service
    await notificationService.logAuditAndNotifyDossierAccess({
      patientUserId: selectedPatient.value?.userId || '',
      patientName,
      medecinName: doctorName.value,
      isEmergency: true,
      qrToken
    })

    // 2. Ajout au journal local des accès du patient
    patientAccessLogs.value.unshift({
      id: `acc-${Date.now()}`,
      medecin: doctorName.value,
      specialite: 'Cardiologie & Urgences',
      hopital: 'Hôpital Principal de Dakar',
      date: lastEmergencyAccessDate.value,
      isUrgence: true,
      statut: 'EN_ATTENTE_CONFIRMATION'
    })

    toast.warning("🚨 Mode Bris de Glace validé : Notification d'urgence envoyée au patient !")
  } else {
    scanSimEmergencyChoice.value = 'not_urgent'
    toast.info("Accès clinique restreint : Secret médical strictement préservé")
  }
}

const confirmPatientUrgency = () => {
  patientVerificationState.value = 'confirmed'
  const firstLog = patientAccessLogs.value[0]
  if (firstLog) {
    firstLog.statut = 'CONFIRME_PAR_PATIENT'
  }
  toast.success("✅ Urgence vitale confirmée par le patient : Accès certifié légitime")
}

const initiatePatientReport = () => {
  patientVerificationState.value = 'reporting'
}

const cancelPatientReport = () => {
  patientVerificationState.value = 'waiting'
}

const submitPatientReport = async () => {
  if (!selectedPatient.value) return
  isSendingReport.value = true
  const motifFinal = reportMotifCustom.value.trim() || reportMotifPreset.value

  try {
    await notificationService.reportAbusiveAccess({
      patientUserId: selectedPatient.value.userId,
      patientName: getPatientName(selectedPatient.value),
      medecinName: doctorName.value,
      motif: motifFinal,
      dateAcces: lastEmergencyAccessDate.value
    })

    patientVerificationState.value = 'reported'
    const firstLog = patientAccessLogs.value[0]
    if (firstLog) {
      firstLog.statut = 'SIGNALE_ABUSIF'
      firstLog.motifSignalement = motifFinal
    }

    toast.error("🚨 Signalement d'accès abusif transmis au Médecin et à l'Administrateur !")
  } catch {
    toast.error("Erreur lors de la transmission du signalement")
  } finally {
    isSendingReport.value = false
  }
}

// Pagination
const currentPage = ref(1)
const pageSize = ref(8)

const filteredPatientsList = computed(() => {
  if (!searchQuery.value.trim()) return patients.value
  const q = searchQuery.value.toLowerCase()
  return patients.value.filter(p => {
    const name = getPatientName(p).toLowerCase()
    const phone = getPatientPhone(p).toLowerCase()
    return (
      name.includes(q) ||
      phone.includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.userId?.toLowerCase().includes(q) ||
      p.contactUrgenceNom?.toLowerCase().includes(q) ||
      p.contactUrgenceTelephone?.toLowerCase().includes(q) ||
      p.ville?.toLowerCase().includes(q)
    )
  })
})

const paginatedPatients = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPatientsList.value.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
}
</script>

<template>
  <div class="patients-view">
    <div class="card-panel">
      <div class="panel-header">
        <div class="toolbar">
          <div class="search-input-wrapper">
            <span class="search-icon-inside"><Search :size="15" :stroke-width="1.8" /></span>
            <input
              type="text"
              v-model="searchQuery"
              @input="handleSearch"
              placeholder="Rechercher par identifiant, contact, ville..."
            />
          </div>
        </div>
        <div class="record-counter">
          {{ filteredPatientsList.length }} patient(s) répertorié(s)
        </div>
      </div>

      <div class="table-responsive">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Chargement du répertoire des patients...</p>
        </div>

        <div v-else-if="filteredPatientsList.length === 0" class="empty-state">
          <HeartPulse :size="32" class="empty-icon" />
          <p>Aucun dossier patient ne correspond à votre recherche.</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Patient & Identifiant</th>
              <th>Contact d'Urgence</th>
              <th>Localisation</th>
              <th>Consentements Données</th>
              <th>Dossier Clinique</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paginatedPatients" :key="p.id">
              <td>
                <div class="patient-profile-cell">
                  <div class="patient-avatar-circle">
                    {{ getPatientInitials(p) }}
                  </div>
                  <div class="patient-info-text">
                    <div class="patient-full-name">{{ getPatientName(p) }}</div>
                    <div class="patient-meta-row">
                      <span class="id-tag">Dossier N° {{ p.id.substring(0, 6).toUpperCase() }}</span>
                      <span v-if="getPatientPhone(p)" class="patient-tel-tag">• {{ getPatientPhone(p) }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div v-if="p.contactUrgenceNom" class="contact-urgence-cell">
                  <div class="contact-urgence-nom">
                    <strong>{{ p.contactUrgenceNom }}</strong>
                    <span v-if="p.contactUrgenceLien" class="contact-lien-tag">({{ p.contactUrgenceLien }})</span>
                  </div>
                  <div class="text-muted text-sm">{{ p.contactUrgenceTelephone }}</div>
                </div>
                <div v-else class="text-muted text-sm">Non renseigné</div>
              </td>
              <td>
                <div>{{ p.ville || 'Dakar' }}</div>
                <div class="text-muted text-sm">{{ p.region || 'Sénégal' }}</div>
              </td>
              <td>
                <span class="badge" :class="p.consentAnalyseIa ? 'badge-actif' : 'badge-suspendu'">
                  <span class="badge-dot"></span>
                  {{ p.consentAnalyseIa ? 'Consentement Validé' : 'Non Partagé' }}
                </span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="openPatientDetails(p)">
                  <ShieldCheck :size="13" :stroke-width="1.8" />
                  <span>Fiche Administrative</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Patients -->
      <Pagination
        v-if="filteredPatientsList.length > 0"
        v-model:currentPage="currentPage"
        :totalItems="filteredPatientsList.length"
        v-model:pageSize="pageSize"
      />
    </div>

    <!-- Administrative Patient Inspection Modal (No Clinical Data for Admin) -->
    <Modal
      :isOpen="isPatientModalOpen"
      :title="`Fiche Administrative & Sécurité — ${selectedPatient ? getPatientName(selectedPatient) : ''}`"
      maxWidth="840px"
      @close="isPatientModalOpen = false"
    >
      <div v-if="loadingDossier" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des informations administratives...</p>
      </div>

      <div v-else class="dossier-details-wrapper">
        <!-- Patient Identity Banner -->
        <div class="patient-modal-hero">
          <div class="hero-left">
            <div class="hero-avatar">
              {{ selectedPatient ? getPatientInitials(selectedPatient) : 'PT' }}
            </div>
            <div class="hero-identity">
              <div class="hero-name">{{ selectedPatient ? getPatientName(selectedPatient) : '' }}</div>
              <div class="hero-meta">
                <span class="hero-id">ID N° {{ selectedPatient?.id.substring(0, 8).toUpperCase() }}</span>
                <span v-if="selectedPatient && getPatientPhone(selectedPatient)" class="hero-meta-item">
                  <Phone :size="12" /> {{ getPatientPhone(selectedPatient) }}
                </span>
                <span v-if="selectedPatient && getPatientEmail(selectedPatient)" class="hero-meta-item">
                  <Mail :size="12" /> {{ getPatientEmail(selectedPatient) }}
                </span>
                <span v-if="selectedPatient?.ville" class="hero-meta-item">
                  <MapPin :size="12" /> {{ selectedPatient.ville }}, {{ selectedPatient.region || 'Sénégal' }}
                </span>
              </div>
            </div>
          </div>
          <div class="hero-badges">
            <span class="badge badge-actif">
              <span class="badge-dot"></span>
              Compte Actif
            </span>
            <span class="badge badge-role">Rôle : PATIENT</span>
          </div>
        </div>

        <!-- Administrative & Security Grid (2 Columns) -->
        <div class="passport-grid">
          <!-- Left: Administrative & Contacts Information -->
          <div class="passport-card admin-essentials">
            <div class="card-header-mini">
              <UserCheck :size="15" class="text-vert" />
              <span class="mini-title">Coordonnées Civiles & Ayants Droit</span>
            </div>

            <div class="essentials-body">
              <!-- Civil info -->
              <div class="admin-data-row">
                <div class="admin-data-col">
                  <span class="item-label">Adresse de résidence</span>
                  <span class="item-val">{{ selectedPatient?.adresse || 'Non renseignée' }}</span>
                </div>
                <div class="admin-data-col">
                  <span class="item-label">Ville / Région</span>
                  <span class="item-val">{{ selectedPatient?.ville || 'Dakar' }}, {{ selectedPatient?.region || 'Sénégal' }}</span>
                </div>
              </div>

              <!-- Emergency Contact -->
              <div class="essential-item contact-item">
                <div class="item-label">Contact d'Urgence Référent (Administratif)</div>
                <div v-if="selectedPatient?.contactUrgenceNom" class="contact-highlight">
                  <div class="contact-name">
                    <strong>{{ selectedPatient.contactUrgenceNom }}</strong>
                    <span v-if="selectedPatient.contactUrgenceLien" class="contact-lien">({{ selectedPatient.contactUrgenceLien }})</span>
                  </div>
                  <div class="contact-tel">
                    <Phone :size="12" /> {{ selectedPatient.contactUrgenceTelephone }}
                  </div>
                </div>
                <div v-else class="text-muted text-xs">Aucun contact d'urgence consigné</div>
              </div>

              <!-- Family Relatives -->
              <div class="essential-item">
                <div class="item-label">Proches & Ayants Droit Liés</div>
                <div v-if="patientFamille.length > 0" class="family-list">
                  <div v-for="f in patientFamille" :key="f.id" class="family-member-chip">
                    <span class="family-name">
                      <strong>{{ ((f.prenom || '') + ' ' + (f.nom || '')).trim() || 'Membre Famille' }}</strong>
                    </span>
                    <span class="family-relation">{{ f.lienParente || 'Ayant-droit' }}</span>
                  </div>
                </div>
                <div v-else class="text-muted text-xs">Aucun ayant-droit rattaché à ce compte</div>
              </div>
            </div>
          </div>

          <!-- Right: Identification Support (QR Code & NFC) -->
          <div class="passport-card qr-code-card">
            <div class="card-header-mini">
              <QrCode :size="15" class="text-vert" />
              <span class="mini-title">Identifiant Numérique Sécurisé</span>
            </div>

            <div class="qr-card-body">
              <div class="qr-visual-wrapper">
                <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code d'Urgence" class="qr-image" />
                <div v-else class="qr-placeholder">
                  <QrCode :size="48" class="text-muted" />
                </div>
              </div>

              <div class="qr-meta-info">
                <div class="qr-code-string-box" @click="copyQrText(selectedDossier?.codeQrSecurise || '')" title="Cliquer pour copier l'identifiant">
                  <span class="qr-string">{{ selectedDossier?.codeQrSecurise || ('QR-PT-' + selectedPatient?.id.substring(0, 8).toUpperCase()) }}</span>
                  <button class="qr-copy-btn" type="button">
                    <Check v-if="copiedQr" :size="13" class="text-vert" />
                    <Copy v-else :size="13" />
                  </button>
                </div>
                <div class="nfc-tag-indicator">
                  <span class="text-muted text-xs">Puce NFC :</span>
                  <code class="nfc-code">{{ selectedPatient?.nfcId || 'Non assignée' }}</code>
                </div>
                <button class="btn btn-outline btn-sm w-full test-scan-btn" @click="openQrScanSimulation">
                  <Scan :size="13" />
                  <span>Tester le Scan QR (Vue Soignant)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Patient Dossier Access History & Deontological Reports -->
        <div class="access-audit-card">
          <div class="card-header-mini">
            <Clock :size="15" class="text-vert" />
            <span class="mini-title">Journal des Accès au Dossier & Traçabilité des Signalements (RM029)</span>
          </div>

          <div class="access-logs-table-wrapper">
            <table class="access-table">
              <thead>
                <tr>
                  <th>Praticien / Soignant</th>
                  <th>Spécialité & Hôpital</th>
                  <th>Date & Heure</th>
                  <th>Modalité d'accès</th>
                  <th>Statut Déontologique & Patient</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in patientAccessLogs" :key="log.id" :class="{'row-reported': log.statut === 'SIGNALE_ABUSIF'}">
                  <td>
                    <div class="font-bold">{{ log.medecin }}</div>
                  </td>
                  <td>
                    <div>{{ log.specialite }}</div>
                    <div class="text-muted text-xs">{{ log.hopital }}</div>
                  </td>
                  <td class="text-xs">{{ log.date }}</td>
                  <td>
                    <span v-if="log.isUrgence" class="badge badge-urgence">
                      <AlertOctagon :size="11" /> Mode Bris de Glace
                    </span>
                    <span v-else class="badge badge-normal">
                      <CheckCircle2 :size="11" /> Consultation Ordinaire
                    </span>
                  </td>
                  <td>
                    <div v-if="log.statut === 'SIGNALE_ABUSIF'" class="reported-badge-box">
                      <span class="badge badge-signalement">
                        <Flag :size="11" /> SIGNALÉ ABUSIF PAR LE PATIENT
                      </span>
                      <div v-if="log.motifSignalement" class="reported-reason">
                        Motif : « {{ log.motifSignalement }} »
                      </div>
                      <span class="admin-action-note">Dossier sous enquête transmise à l'ONMS et à l'Admin</span>
                    </div>
                    <div v-else-if="log.statut === 'CONFIRME_PAR_PATIENT'">
                      <span class="badge badge-confirmed">
                        <CheckCircle2 :size="11" /> Urgence confirmée par le patient
                      </span>
                    </div>
                    <div v-else>
                      <span class="badge badge-pending">
                        <Clock :size="11" /> En attente de confirmation du patient
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Full-Width Medical Secrecy & Deontology Policy Banner -->
        <div class="medical-secrecy-card">
          <div class="secrecy-card-header">
            <div class="secrecy-title-box">
              <ShieldAlert :size="17" class="text-vert" />
              <h4 class="secrecy-title">Secret Médical Absolu & Confidentialité des Données (Loi CDP n° 2008-12)</h4>
            </div>
            <span class="secrecy-pill">Données Cliniques Verrouillées</span>
          </div>

          <div class="secrecy-rules-grid">
            <div class="rule-box">
              <div class="rule-title">
                <Lock :size="14" class="text-danger" />
                <strong>Règle Administrateur Plateforme :</strong>
              </div>
              <p class="rule-desc">
                Les administrateurs gèrent les comptes utilisateurs et l'infrastructure technique, mais <strong>n'ont aucun droit d'accès aux données médicales cliniques</strong> (antécédents, diagnostics, allergies, ordonnances et comptes-rendus de consultation).
              </p>
            </div>

            <div class="rule-box">
              <div class="rule-title">
                <AlertOctagon :size="14" class="text-warning" />
                <strong>Règle Médecin & Protocole d'Urgence :</strong>
              </div>
              <p class="rule-desc">
                De base, <strong>aucun praticien n'a accès au dossier</strong> sans rendez-vous confirmé ou consentement. Lors du scan du QR code, le système demande obligatoirement une <strong>déclaration d'urgence médicale (« Mode Bris de Glace »)</strong> avant tout accès de secours, avec traçabilité immuable dans l'audit log (RM029).
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer-actions">
          <button class="btn btn-secondary btn-sm" @click="printDossier" title="Imprimer la fiche administrative patient">
            <Printer :size="14" />
            <span>Imprimer la Fiche Administrative</span>
          </button>
          <button class="btn btn-primary btn-sm" @click="isPatientModalOpen = false">Fermer</button>
        </div>
      </template>
    </Modal>

    <!-- Emergency QR Scan Simulation Modal (Demonstrating Deontological Access Rules & Patient Reporting) -->
    <Modal
      :isOpen="isScanSimModalOpen"
      title="Contrôle Déontologique d'Accès — Scan du QR Code Médical"
      maxWidth="680px"
      @close="isScanSimModalOpen = false"
    >
      <div class="scan-sim-modal-body">
        <div class="sim-context-banner">
          <div class="sim-context-left">
            <span class="text-muted text-xs">Patient scanné :</span>
            <strong class="text-sm">{{ selectedPatient ? getPatientName(selectedPatient) : '' }}</strong>
          </div>
          <div class="sim-context-right">
            <span class="text-muted text-xs">Jeton d'urgence :</span>
            <code class="qr-token-chip">{{ selectedDossier?.codeQrSecurise || ('QR-PT-' + selectedPatient?.id.substring(0, 8).toUpperCase()) }}</code>
          </div>
        </div>

        <!-- Case 1: Prompt Question -->
        <div v-if="scanSimEmergencyChoice === 'none'" class="sim-question-panel">
          <div class="sim-icon-circle warning-circle">
            <AlertTriangle :size="30" class="text-warning" />
          </div>
          <h4 class="sim-question-title">Déclaration d'Urgence Médicale Requise</h4>
          <p class="sim-question-text">
            <strong>De base, l'accès au dossier médical de ce patient est restreint :</strong> vous n'avez pas de rendez-vous actif ni de consentement direct avec lui.
          </p>
          <div class="sim-solemn-question">
            S'agit-il d'une <u>urgence médicale vitale immédiate</u> justifiant l'activation exceptionnelle du protocole d'urgence (« Mode Bris de Glace ») sous votre responsabilité de praticien ?
          </div>

          <div class="sim-actions-row">
            <button class="btn btn-secondary flex-1" @click="declareUrgence(false)">
              <Lock :size="14" />
              <span>Non — Hors urgence / Vérification</span>
            </button>
            <button class="btn btn-danger flex-1" @click="declareUrgence(true)">
              <AlertOctagon :size="14" />
              <span>Oui — Urgence Vitale Déclarée</span>
            </button>
          </div>
        </div>

        <!-- Case 2: Refused (Not an emergency) -->
        <div v-else-if="scanSimEmergencyChoice === 'not_urgent'" class="sim-result-panel panel-denied">
          <div class="sim-result-header">
            <Lock :size="24" class="text-danger" />
            <div>
              <h5 class="sim-result-title text-danger">Accès Clinique Refusé (Secret Médical Préservé)</h5>
              <span class="text-xs text-muted">Conformité Loi CDP n° 2008-12 & Code de Déontologie ONMS</span>
            </div>
          </div>
          <p class="sim-result-desc">
            En l'absence d'urgence médicale vitale, le secret médical est préservé : aucun praticien ne peut consulter les antécédents, diagnostics ou prescriptions du patient sans consultation active ou consentement.
          </p>
          <div class="sim-allowed-contacts">
            <div class="allowed-title">Seules les coordonnées d'urgence sont consultables pour contacter les proches :</div>
            <div class="allowed-row">
              <span class="text-muted">Contact référent :</span>
              <strong>{{ selectedPatient?.contactUrgenceNom || 'Proche désigné' }} ({{ selectedPatient?.contactUrgenceLien || 'Famille' }})</strong>
            </div>
            <div class="allowed-row">
              <span class="text-muted">Téléphone d'urgence :</span>
              <strong class="text-vert">{{ selectedPatient?.contactUrgenceTelephone || 'Non renseigné' }}</strong>
            </div>
          </div>
          <div class="sim-panel-footer">
            <button class="btn btn-secondary btn-sm" @click="scanSimEmergencyChoice = 'none'">
              Recommencer la simulation
            </button>
          </div>
        </div>

        <!-- Case 3: Granted under Emergency Protocol (With Patient Notification & Report Flow) -->
        <div v-else-if="scanSimEmergencyChoice === 'urgent'" class="sim-granted-flow">
          <!-- Simulation Mode Switcher Tabs -->
          <div class="sim-tabs-nav">
            <button
              class="sim-tab-btn"
              :class="{ 'active': activeSimTab === 'soignant' }"
              @click="activeSimTab = 'soignant'"
            >
              <Stethoscope :size="14" />
              <span>1. Vue Soignant / Secours</span>
            </button>
            <button
              class="sim-tab-btn"
              :class="{ 'active': activeSimTab === 'patient' }"
              @click="activeSimTab = 'patient'"
            >
              <Smartphone :size="14" />
              <span>2. Vue Smartphone Patient (Notification & Contrôle)</span>
              <span v-if="patientVerificationState === 'waiting'" class="tab-pulse-dot"></span>
            </button>
          </div>

          <!-- TAB 1: SOIGNANT VIEW -->
          <div v-if="activeSimTab === 'soignant'" class="sim-result-panel panel-granted">
            <div class="sim-result-header">
              <Unlock :size="24" class="text-vert" />
              <div>
                <h5 class="sim-result-title text-vert">Protocole d'Urgence Validé (« Mode Bris de Glace »)</h5>
                <span class="text-xs text-muted">Déverrouillage exceptionnel sous la responsabilité du praticien</span>
              </div>
            </div>

            <div class="sim-notice-sent-box">
              <Radio :size="15" class="text-vert" />
              <div>
                <strong>Alerte de sécurité transmise au patient :</strong>
                <span> Le patient a été immédiatement notifié par SMS et notification In-App avec la mention <u>URGENCE MÉDICALE VITALE</u>.</span>
              </div>
            </div>

            <div class="sim-audit-alert">
              <div class="audit-alert-top">
                <ShieldCheck :size="15" class="text-vert" />
                <strong>Traçabilité Inviolable dans l'Audit (RM029) :</strong>
              </div>
              <p class="audit-alert-text">
                Enregistré dans <code>auth_schema.audit_log</code> avec votre identifiant soignant, horodatage, adresse IP et motif « ACCES_URGENCE_BRIS_DE_GLACE ».
              </p>
            </div>

            <div class="sim-unlocked-data">
              <div class="unlocked-title">Constantes Vitales Déverrouillées pour les Secours :</div>
              <div class="unlocked-grid">
                <div class="unlocked-item">
                  <span class="u-label">Groupe Sanguin & Rhésus :</span>
                  <span class="u-val text-vert font-bold">Groupe certifié accessible aux urgentistes</span>
                </div>
                <div class="unlocked-item">
                  <span class="u-label">Allergies Médicamenteuses Graves :</span>
                  <span class="u-val text-warning">Registre d'éviction immédiate ouvert</span>
                </div>
              </div>
            </div>

            <!-- Call to action to test patient reaction -->
            <div class="patient-cta-box">
              <p class="cta-desc">
                👉 Le patient a reçu une notification lui demandant de confirmer si cette urgence était réelle.
              </p>
              <button class="btn btn-primary btn-sm w-full" @click="activeSimTab = 'patient'">
                <Smartphone :size="14" />
                <span>Voir la Notification Reçue par le Patient & Tester sa Réponse</span>
              </button>
            </div>

            <div class="sim-panel-footer mt-3">
              <button class="btn btn-secondary btn-sm" @click="scanSimEmergencyChoice = 'none'">
                Recommencer la simulation
              </button>
            </div>
          </div>

          <!-- TAB 2: PATIENT SMARTPHONE VIEW -->
          <div v-else class="patient-phone-simulator">
            <div class="phone-top-bar">
              <span class="phone-carrier">DIAM-YARAAM • E-Santé Sénégal</span>
              <span class="phone-time">{{ lastEmergencyAccessDate }}</span>
            </div>

            <!-- The Incoming Notification Card -->
            <div class="phone-notif-card">
              <div class="notif-header">
                <div class="notif-sender">
                  <ShieldAlert :size="16" class="text-danger" />
                  <strong>Sécurité Médicale — Accès Dossier</strong>
                </div>
                <span class="notif-badge">Urgent</span>
              </div>
              <div class="notif-body">
                <p class="notif-msg">
                  <strong>{{ doctorName }}</strong> a accédé à votre dossier médical d'urgence le {{ lastEmergencyAccessDate }}.
                </p>
                <div class="notif-declared-reason">
                  <AlertOctagon :size="13" class="text-danger" />
                  <span>Motif déclaré par le médecin : <strong>URGENCE MÉDICALE VITALE (« Bris de Glace »)</strong></span>
                </div>
              </div>
            </div>

            <!-- Patient Verification / Question -->
            <div class="patient-question-card">
              <h5 class="question-h5">Contrôle de Sécurité Patient :</h5>
              <p class="question-sub">
                Étiez-vous réellement en situation de détresse vitale prise en charge par ce praticien ?
              </p>

              <!-- State: Waiting -->
              <div v-if="patientVerificationState === 'waiting'" class="patient-action-buttons">
                <button class="btn btn-outline-success flex-1" @click="confirmPatientUrgency">
                  <CheckCircle2 :size="14" />
                  <span>Oui, j'étais en urgence</span>
                </button>
                <button class="btn btn-danger flex-1" @click="initiatePatientReport">
                  <Flag :size="14" />
                  <span>Non, signaler le médecin</span>
                </button>
              </div>

              <!-- State: Reporting Form -->
              <div v-else-if="patientVerificationState === 'reporting'" class="report-form-box">
                <div class="report-warning-header">
                  <AlertTriangle :size="16" class="text-danger" />
                  <h6>Signalement d'Accès Abusif (Transmission Admin & ONMS)</h6>
                </div>
                <p class="report-expl">
                  Vous contestez la réalité de l'urgence vitale. Ce signalement sera notifié immédiatement au médecin pour justification formelle sous 48h et consigné à l'administrateur de la plateforme.
                </p>

                <div class="form-group mb-2">
                  <label class="form-label text-xs">Motif de la contestation :</label>
                  <select v-model="reportMotifPreset" class="form-select text-xs">
                    <option value="Je n’étais absolument pas en situation d’urgence vitale ce jour-là.">Je n’étais absolument pas en situation d’urgence vitale ce jour-là.</option>
                    <option value="Je ne connais pas ce médecin et je n’ai jamais autorisé cet accès.">Je ne connais pas ce médecin et je n’ai jamais autorisé cet accès.</option>
                    <option value="Accès de curiosité sans aucun motif clinique ni consultation.">Accès de curiosité sans aucun motif clinique ni consultation.</option>
                  </select>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label text-xs">Précision complémentaire (facultatif) :</label>
                  <input
                    type="text"
                    v-model="reportMotifCustom"
                    placeholder="Ex: J'étais à mon domicile, aucune intervention d'urgence..."
                    class="form-input text-xs"
                  />
                </div>

                <div class="report-actions">
                  <button class="btn btn-secondary btn-sm" @click="cancelPatientReport">Annuler</button>
                  <button class="btn btn-danger btn-sm" :disabled="isSendingReport" @click="submitPatientReport">
                    <Flag :size="13" />
                    <span>{{ isSendingReport ? 'Envoi en cours...' : 'Confirmer et Signaler le Médecin' }}</span>
                  </button>
                </div>
              </div>

              <!-- State: Confirmed by Patient -->
              <div v-else-if="patientVerificationState === 'confirmed'" class="confirmed-box">
                <CheckCircle2 :size="22" class="text-vert" />
                <div>
                  <strong class="text-vert">Urgence Vitale Confirmée par le Patient</strong>
                  <p class="text-xs text-muted mb-0">
                    Merci. Votre attestation a été enregistrée. L'accès d'urgence est certifié conforme et archivé sous la référence RM026.
                  </p>
                </div>
              </div>

              <!-- State: Reported by Patient -->
              <div v-else-if="patientVerificationState === 'reported'" class="reported-success-card">
                <div class="reported-header">
                  <Flag :size="20" class="text-danger" />
                  <strong>Signalement d'Accès Abusif Déclenché avec Succès !</strong>
                </div>
                <p class="reported-desc">
                  Votre contestation a été immédiatement transmise en temps réel :
                </p>

                <div class="dispatch-receipts">
                  <div class="receipt-item receipt-doctor">
                    <div class="receipt-dest">
                      <Stethoscope :size="13" />
                      <strong>Reçu par le {{ doctorName }} :</strong>
                    </div>
                    <div class="receipt-msg">
                      « Avertissement Déontologique : Le patient conteste votre déclaration d'urgence du {{ lastEmergencyAccessDate }}. Une justification écrite est exigée sous 48h (Règles ONMS). »
                    </div>
                  </div>

                  <div class="receipt-item receipt-admin">
                    <div class="receipt-dest">
                      <ShieldAlert :size="13" />
                      <strong>Reçu par l'Administrateur Plateforme :</strong>
                    </div>
                    <div class="receipt-msg">
                      « ALERTE AUDIT : Signalement d'accès abusif ouvert pour ce patient. L'événement est archivé dans auth_schema.audit_log sous le code ALERTE. »
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="sim-panel-footer mt-3">
              <button class="btn btn-secondary btn-sm" @click="activeSimTab = 'soignant'">
                Retour Vue Soignant
              </button>
              <button class="btn btn-secondary btn-sm ml-2" @click="scanSimEmergencyChoice = 'none'">
                Recommencer le test
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-primary btn-sm" @click="isScanSimModalOpen = false">Fermer</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.patient-profile-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.patient-avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  font-weight: 700;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(13, 124, 102, 0.25);
  letter-spacing: 0.5px;
}

.patient-info-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.patient-full-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #090D14;
}

.patient-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.patient-tel-tag {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.contact-urgence-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-urgence-nom {
  font-size: 0.85rem;
  color: #090D14;
}

.contact-lien-tag {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  margin-left: 4px;
}

.patient-id-badge {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.id-tag {
  font-family: monospace;
  font-weight: 700;
  color: var(--text-dark);
  font-size: 0.75rem;
}

.text-xs {
  font-size: 0.72rem;
}

.text-sm {
  font-size: 0.8rem;
}

.text-danger {
  color: var(--danger);
}

.text-warning {
  color: var(--warning);
}

.text-primary {
  color: var(--primary);
}

.record-counter {
  background: #F8FAFC;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.dossier-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Patient Hero Banner */
.patient-modal-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #090D14;
  color: #FFFFFF;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #0D7C66;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-identity {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hero-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.2px;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  color: #94A3B8;
  flex-wrap: wrap;
}

.hero-id {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  color: #F1F5F9;
  font-weight: 600;
}

.hero-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hero-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.badge-tele {
  background: rgba(13, 124, 102, 0.2);
  color: #2DD4BF;
  border: 1px solid rgba(13, 124, 102, 0.4);
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

/* Passport Grid (2 Columns) */
.passport-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 14px;
}

.passport-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}

.card-header-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #090D14;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F1F5F9;
}

.card-header-mini .mini-title {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.74rem;
}

/* Clinical Essentials Box */
.essentials-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.essential-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.essential-item .item-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.4px;
}

.badge-role {
  background: rgba(255, 255, 255, 0.12);
  color: #F8FAFC;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Administrative Information Box */
.admin-data-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: #F8FAFC;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #E2E8F0;
}

.admin-data-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-data-col .item-label,
.essential-item .item-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.4px;
}

.admin-data-col .item-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: #090D14;
}

.contact-highlight {
  background: #F8FAFC;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.contact-name {
  font-size: 0.86rem;
  color: #090D14;
}

.contact-lien {
  color: var(--text-muted);
  font-size: 0.76rem;
  margin-left: 4px;
}

.contact-tel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #0D7C66;
}

/* Family List */
.family-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.family-member-chip {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
}

.family-name {
  color: #090D14;
  font-weight: 700;
}

.family-relation {
  color: var(--text-muted);
  font-size: 0.72rem;
  background: #E2E8F0;
  padding: 1px 5px;
  border-radius: 3px;
}

/* Visual QR Code Card */
.qr-code-card {
  align-items: center;
  text-align: center;
}

.qr-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.qr-visual-wrapper {
  background: #FFFFFF;
  padding: 8px;
  border-radius: 10px;
  border: 2px dashed rgba(13, 124, 102, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 130px;
  height: 130px;
  display: block;
  border-radius: 4px;
}

.qr-placeholder {
  width: 130px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
}

.qr-meta-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.qr-code-string-box {
  background: #090D14;
  color: #FFFFFF;
  padding: 5px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.76rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  max-width: 100%;
  transition: background 0.15s ease;
}

.qr-code-string-box:hover {
  background: #0D7C66;
}

.qr-string {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qr-copy-btn {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.nfc-tag-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.nfc-code {
  font-family: monospace;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
  color: #334155;
  border: 1px solid #E2E8F0;
}

.test-scan-btn {
  font-size: 0.76rem;
  gap: 6px;
}

/* Medical Secrecy Banner */
.medical-secrecy-card {
  background: #FFFFFF;
  border: 1px solid rgba(13, 124, 102, 0.3);
  border-left: 4px solid #0D7C66;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.secrecy-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F1F5F9;
}

.secrecy-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.secrecy-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: #090D14;
  margin: 0;
}

.secrecy-pill {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(13, 124, 102, 0.1);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.25);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.secrecy-rules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.rule-box {
  background: #F8FAFC;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid #EDF2F7;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #090D14;
}

.rule-desc {
  font-size: 0.74rem;
  color: #475569;
  line-height: 1.45;
  margin: 0;
}

/* QR Scan Simulation Modal Styles */
.scan-sim-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sim-context-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFC;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid #E2E8F0;
  font-size: 0.8rem;
}

.sim-context-left,
.sim-context-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qr-token-chip {
  font-family: monospace;
  background: #090D14;
  color: #FFFFFF;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
}

.sim-question-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 12px;
  gap: 12px;
  background: #FFFDF5;
  border: 1px solid #FEF08A;
  border-radius: var(--radius-md);
}

.sim-icon-circle {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-circle {
  background: #FEF9C3;
  border: 2px solid #FDE047;
}

.sim-question-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #854D0E;
  margin: 0;
}

.sim-question-text {
  font-size: 0.82rem;
  color: #475569;
  max-width: 480px;
  margin: 0;
  line-height: 1.45;
}

.sim-solemn-question {
  background: #FFFFFF;
  border: 1px solid #FDE047;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  font-weight: 700;
  color: #713F12;
  line-height: 1.45;
}

.sim-actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 6px;
}

.sim-actions-row button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.82rem;
  padding: 10px 14px;
  font-weight: 700;
}

.flex-1 {
  flex: 1;
}

/* Simulation Results */
.sim-result-panel {
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-denied {
  background: #FEF2F2;
  border: 1px solid #FECACA;
}

.panel-granted {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
}

.sim-result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sim-result-title {
  font-size: 0.96rem;
  font-weight: 800;
  margin: 0;
}

.sim-result-desc {
  font-size: 0.8rem;
  color: #334155;
  line-height: 1.45;
  margin: 0;
}

.sim-allowed-contacts {
  background: #FFFFFF;
  border: 1px solid #FEE2E2;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
}

.allowed-title {
  font-weight: 700;
  color: #991B1B;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.allowed-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sim-audit-alert {
  background: #FFFFFF;
  border: 1px solid #DCFCE7;
  border-left: 3px solid #0D7C66;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.audit-alert-top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #0D7C66;
}

.audit-alert-text {
  font-size: 0.74rem;
  color: #334155;
  margin: 0;
  line-height: 1.4;
}

.audit-alert-text code {
  background: #F1F5F9;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 700;
  color: #090D14;
}

.sim-unlocked-data {
  background: #FFFFFF;
  border: 1px solid #DCFCE7;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.unlocked-title {
  font-weight: 700;
  color: #166534;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.unlocked-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 0.78rem;
}

.unlocked-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.u-label {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.u-val {
  font-weight: 700;
}

.sim-panel-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.modal-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* Patient Dossier Access Logs Table */
.access-audit-card {
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}

.access-logs-table-wrapper {
  overflow-x: auto;
  margin-top: 4px;
}

.access-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  text-align: left;
}

.access-table th {
  background: #F8FAFC;
  padding: 8px 10px;
  font-weight: 700;
  color: #475569;
  border-bottom: 2px solid #E2E8F0;
  text-transform: uppercase;
  font-size: 0.68rem;
  letter-spacing: 0.4px;
}

.access-table td {
  padding: 10px 10px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
}

.access-table tbody tr:hover {
  background: #FAFAFA;
}

.access-table tr.row-reported {
  background: #FEF2F2 !important;
  border-left: 3px solid #EF4444;
}

.badge-urgence {
  background: rgba(239, 68, 68, 0.12);
  color: #DC2626;
  border: 1px solid rgba(239, 68, 68, 0.25);
  font-weight: 700;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-normal {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  border: 1px solid rgba(13, 124, 102, 0.25);
  font-weight: 600;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.reported-badge-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge-signalement {
  background: #EF4444;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.3px;
  width: fit-content;
}

.reported-reason {
  font-size: 0.72rem;
  font-style: italic;
  color: #991B1B;
  background: #FEE2E2;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1.35;
}

.admin-action-note {
  font-size: 0.68rem;
  font-weight: 700;
  color: #B91C1C;
}

.badge-confirmed {
  background: rgba(13, 124, 102, 0.12);
  color: #0D7C66;
  font-weight: 700;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-pending {
  background: rgba(245, 158, 11, 0.12);
  color: #D97706;
  font-weight: 600;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Simulation Flow & Tabs */
.sim-granted-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sim-tabs-nav {
  display: flex;
  gap: 6px;
  background: #E2E8F0;
  padding: 4px;
  border-radius: 8px;
}

.sim-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.sim-tab-btn:hover {
  color: #090D14;
}

.sim-tab-btn.active {
  background: #FFFFFF;
  color: #090D14;
  font-weight: 700;
  border: 1px solid var(--border-color);
}

.tab-pulse-dot {
  width: 8px;
  height: 8px;
  background: #EF4444;
  border-radius: 50%;
  display: inline-block;
}

.sim-notice-sent-box {
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.78rem;
  color: #065F46;
  line-height: 1.45;
}

.patient-cta-box {
  background: #F8FAFC;
  border: 1px dashed #CBD5E1;
  border-radius: 6px;
  padding: 12px 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.cta-desc {
  font-size: 0.78rem;
  color: #334155;
  margin: 0;
  font-weight: 600;
}

/* Patient Smartphone View Simulator */
.patient-phone-simulator {
  background: #0F172A;
  border-radius: var(--radius-md);
  padding: 16px;
  color: #F8FAFC;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phone-top-bar {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #94A3B8;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-family: monospace;
}

.phone-notif-card {
  background: #1E293B;
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-left: 4px solid #EF4444;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-sender {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #F87171;
}

.notif-badge {
  background: #EF4444;
  color: #FFFFFF;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.notif-msg {
  font-size: 0.82rem;
  color: #F1F5F9;
  margin: 0;
  line-height: 1.45;
}

.notif-declared-reason {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.74rem;
  color: #FCA5A5;
  display: flex;
  align-items: center;
  gap: 6px;
}

.patient-question-card {
  background: #1E293B;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.question-h5 {
  font-size: 0.86rem;
  font-weight: 700;
  color: #38BDF8;
  margin: 0;
}

.question-sub {
  font-size: 0.78rem;
  color: #CBD5E1;
  margin: 0;
  line-height: 1.4;
}

.patient-action-buttons {
  display: flex;
  gap: 8px;
}

.btn-outline-success {
  background: transparent;
  color: #0D7C66;
  border: 1px solid #0D7C66;
  font-size: 0.8rem;
  padding: 8px 12px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-outline-success:hover {
  background: #0D7C66;
  color: #FFFFFF;
}

.report-form-box {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-warning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #F87171;
  font-weight: 700;
  font-size: 0.8rem;
}

.report-warning-header h6 {
  margin: 0;
  font-size: 0.8rem;
}

.report-expl {
  font-size: 0.72rem;
  color: #CBD5E1;
  line-height: 1.4;
  margin: 0;
}

.report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirmed-box {
  background: rgba(13, 124, 102, 0.15);
  border: 1px solid rgba(13, 124, 102, 0.3);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.reported-success-card {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reported-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #F87171;
  font-size: 0.86rem;
  font-weight: 800;
}

.reported-desc {
  font-size: 0.74rem;
  color: #E2E8F0;
  margin: 0;
}

.dispatch-receipts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.receipt-item {
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.73rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.receipt-doctor {
  background: #020617;
  border-left: 3px solid #38BDF8;
  color: #E2E8F0;
}

.receipt-admin {
  background: #020617;
  border-left: 3px solid #F59E0B;
  color: #E2E8F0;
}

.receipt-dest {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #F8FAFC;
  font-weight: 700;
}

.receipt-msg {
  font-style: italic;
  color: #94A3B8;
  line-height: 1.4;
}

.ml-2 {
  margin-left: 8px;
}
</style>
