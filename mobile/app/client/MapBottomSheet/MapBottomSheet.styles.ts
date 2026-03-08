import { StyleSheet } from 'react-native'

export const mapBottomSheetStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  agentCount: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  listContainer: {
    maxHeight: 300,
  },
  agentItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentItemSelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  agentDistance: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  agentStatus: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  commandButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  commandButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  commandButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
