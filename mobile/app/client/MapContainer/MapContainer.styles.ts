import { StyleSheet } from 'react-native'

export const mapContainerStyles = StyleSheet.create({
  map: {
    flex: 1,
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: 'white',
  },
  agentAvailable: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  agentBusy: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#9ca3af',
    borderWidth: 2,
    borderColor: 'white',
  },
  meetingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: 'white',
  },
})
