import { StyleSheet } from 'react-native'

export const healthScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e8e8e8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  rowLabel: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  rowValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#3dd68c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})
