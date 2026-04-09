# Static Piste Data — Production Setup

## Overview

The application uses **static ski piste data** instead of real-time API queries. This is ideal for ski piste data since it changes infrequently but must be reliable and performant.

## Day-of Deployment Checklist

### 1. Download Fresh Piste Data

```bash
cd api/

# Download from Overpass API (takes ~30-60 seconds)
npm run download-pistes

# Output should show:
# ✅ Download complete!
# 📊 Statistics:
#    Total pistes: XXX
#    File: src/data/pistes-static.geojson
#    Size: XXX KB
```

### 2. Verify Data Quality

```bash
# Count features in the file
grep -o '"type": "Feature"' api/src/data/pistes-static.geojson | wc -l

# Or check file size (should be > 50 KB for 3 Vallées)
ls -lh api/src/data/pistes-static.geojson
```

### 3. Commit & Deploy

```bash
cd api/
git add src/data/pistes-static.geojson
git commit -m "chore: refresh piste data for production"
git push
```

### 4. Backend Logs

When the backend starts, you should see:

```
[Pistes Static] Loaded XXX features from static file
```

When a client requests pistes:

```
[Pistes Static] Bbox (45.29,6.58,45.30,6.59): returned 12/345 features (2ms)
```

## Data Refresh Strategy

### Before Production Launch
- Run `npm run download-pistes` once
- Commit the file to git
- Deploy normally

### During Event
- Data remains static (no updates needed)
- If issues found, run script again and redeploy

### Post-Event
- Data can stay static indefinitely
- Or refresh before next event

## Region Coverage

The script downloads pistes for **3 Vallées** (French Alps):
- ✅ Val Thorens (45.2930, 6.5855)
- ✅ Méribel (45.3895, 6.5645)
- ✅ Courchevel (45.4043, 6.6403)

**Bounding box**: 45.20°N to 45.55°N, 6.45°E to 6.75°E

## Customizing Region

To download pistes for a different region, edit `api/scripts/download-pistes.sh`:

```bash
# Change the BBOX line (south, west, north, east)
BBOX="45.20,6.45,45.55,6.75"  # Default: 3 Vallées

# Example: Chamonix area
BBOX="45.85,6.80,45.95,7.00"

# Then run:
npm run download-pistes
```

## Architecture

```
Mobile Request
    ↓
GET /map/pistes?south=X&west=Y&north=Z&east=W
    ↓
Backend loads pistes-static.geojson (once at startup)
    ↓
Filter by bbox (in-memory, very fast ~2ms)
    ↓
Return GeoJSON to client
```

**Benefits:**
- ⚡ No external API dependency
- ⚡ Consistent, reliable data
- ⚡ ~2ms response time (vs 300-500ms for Overpass)
- ⚡ Can work offline (data is local)

## Troubleshooting

### "No static data file found" warning

```
[Pistes Static] No static data file found at ...
[Pistes Static] Run: npm run download-pistes
```

**Solution:**
```bash
npm run download-pistes
```

### Script fails with timeout

Overpass API is rate-limited. Try again:

```bash
npm run download-pistes
```

If it keeps failing, check status: https://overpass-api.de/status.html

### Script fails on Windows

Use WSL2 or Git Bash:

```bash
# In WSL2 or Git Bash
cd api/
bash scripts/download-pistes.sh
```

### No pistes showing in app

1. **Check backend logs**:
   ```
   npm run dev
   # Look for "[Pistes Static]" logs
   ```

2. **Check file exists**:
   ```bash
   ls -la api/src/data/pistes-static.geojson
   # Should be > 50 KB
   ```

3. **Check data format**:
   ```bash
   # Should start with { "type": "FeatureCollection"
   head api/src/data/pistes-static.geojson
   ```

## API Response

```bash
# Example request
curl "http://localhost:3000/map/pistes?south=45.29&west=6.58&north=45.30&east=6.59"

# Response (GeoJSON)
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "LineString", "coordinates": [...] },
      "properties": {
        "id": "way-12345",
        "name": "Piste Blue 1",
        "difficulty": "blue",
        "type": "downhill",
        "lit": false
      }
    },
    ...
  ]
}
```

## Performance

| Metric | Value |
|--------|-------|
| File size | ~150 KB |
| Features | ~300-400 pistes |
| Load time | <10ms |
| Query time | ~2ms per bbox |
| Memory usage | <5 MB |

## Extending Coverage

To add more ski areas (e.g., Val d'Isère, Chamonix):

1. Modify `BBOX` in script
2. Run `npm run download-pistes`
3. File will contain all pistes in the bbox

To merge multiple regions, combine the GeoJSON files manually or run the script multiple times with different bboxes and merge the features.
