import { StyleSheet } from 'react-native'

export const homeStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  gpsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gpsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  gpsStatusActive: {
    fontSize: 14,
    color: '#059669',
    fontFamily: 'monospace',
  },
  gpsStatusInactive: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  activeOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderLeftWidth: 4,
  },
  activeOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  meetPointBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  meetPointLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  meetPointCoord: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  meetPointStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  meetPointStatusValue: {
    fontWeight: '600',
    color: '#1f2937',
  },
  btnBlue: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnGreen: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnClientMode: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnLogout: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnTextLg: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  btnTextMd: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalMeetBox: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 8,
  },
  modalMeetLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modalMeetCoord: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  btnAccept: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnRefuse: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnModalText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
})
