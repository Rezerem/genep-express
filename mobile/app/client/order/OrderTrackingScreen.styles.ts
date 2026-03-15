import { StyleSheet } from 'react-native'

export const orderTrackingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  timelineContainer: {
    gap: 15,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export const statusColors: Record<string, string> = {
  pending: '#f97316',
  accepted: '#3b82f6',
  en_route: '#a855f7',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export const statusLabels: Record<string, string> = {
  pending: "En attente d'acceptation...",
  accepted: 'Commande acceptée !',
  en_route: 'Le ravitailleur arrive...',
  delivered: 'Livré !',
  cancelled: 'Commande annulée',
}
