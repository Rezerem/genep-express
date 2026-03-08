import { StyleSheet } from 'react-native'

export const agentMarkerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#d0d0cc',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f0f0e',
    textAlign: 'center',
  },
  distance: {
    fontSize: 9,
    color: '#888884',
    marginTop: 2,
    textAlign: 'center',
  },
})
