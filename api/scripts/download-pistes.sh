#!/bin/bash
# Script to download ski piste data from Overpass API for 3 Vallées region (Val Thorens, Méribel, Courchevel)
# Usage: ./download-pistes.sh
# Output: api/src/data/pistes-static.geojson

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$API_DIR/src/data"

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

echo "🏂 Downloading ski pistes for 3 Vallées region..."
echo "Region: Val Thorens, Méribel, Courchevel (French Alps)"
echo ""

# Bounding box for 3 Vallées: south, west, north, east
# Val Thorens: 45.2930, 6.5855
# Covers the entire ski area
BBOX="45.20,6.45,45.55,6.75"

# Build Overpass query
OVERPASS_QUERY="[out:json][timeout:60];
(
  way[\"piste:type\"~\"downhill|nordic|skitour\"]($BBOX);
  relation[\"piste:type\"~\"downhill|nordic|skitour\"]($BBOX);
);
out geom;"

echo "📍 Bounding box: $BBOX"
echo "🔍 Fetching from Overpass API..."
echo ""

# Query Overpass API (try Turbo first, fallback to regular)
echo "Making request to Overpass Turbo API..."
RESPONSE=$(curl -s -X POST "https://overpass.kumi.systems/api/interpreter" \
  -d "$OVERPASS_QUERY" \
  --max-time 120)

# Fallback to regular Overpass if Turbo fails
if [ -z "$RESPONSE" ] || echo "$RESPONSE" | grep -q "error\|Error"; then
  echo "Turbo API failed, trying regular Overpass..."
  RESPONSE=$(curl -s -X POST "https://overpass-api.de/api/interpreter" \
    -d "$OVERPASS_QUERY" \
    --max-time 120)
fi

# Debug: check if response is empty
if [ -z "$RESPONSE" ]; then
  echo "❌ Empty response from Overpass API"
  echo "This usually means:"
  echo "  - Overpass API is down: https://overpass-api.de/status.html"
  echo "  - Network timeout (try again)"
  exit 1
fi

# Debug: show first 500 chars of response
echo "Response preview (first 500 chars):"
echo "$RESPONSE" | head -c 500
echo -e "\n"

# Check for Overpass errors
if echo "$RESPONSE" | grep -q "\"remark\""; then
  ERROR=$(echo "$RESPONSE" | grep -o '"remark":"[^"]*"' | cut -d'"' -f4)
  echo "❌ Overpass API error: $ERROR"
  echo ""
  echo "Overpass status page: https://overpass-api.de/status.html"
  exit 1
fi

# Check if response starts with valid JSON
if ! echo "$RESPONSE" | grep -q "^{"; then
  echo "❌ Response is not JSON"
  echo "Full response:"
  echo "$RESPONSE"
  exit 1
fi

# Transform to GeoJSON using Node.js (inline script)
echo "$RESPONSE" | node > "$DATA_DIR/pistes-static.geojson" << 'EOF'
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));

const features = [];

// Process ways
if (data.ways) {
  data.ways.forEach(way => {
    if (!way.geometry || way.geometry.length < 2) return;

    const coordinates = way.geometry.map(node => [node.lon, node.lat]);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties: {
        id: `way-${way.id}`,
        name: way.tags?.name || 'Unknown',
        difficulty: way.tags?.['piste:difficulty'] || 'unknown',
        type: way.tags?.['piste:type'] || 'unknown',
        grooming: way.tags?.['piste:grooming'],
        status: way.tags?.['piste:status'],
        lit: way.tags?.['piste:lit'] === 'yes'
      }
    });
  });
}

// Process relations
if (data.relations) {
  data.relations.forEach(relation => {
    if (!relation.geometry || relation.geometry.length < 2) return;

    const coordinates = relation.geometry.map(node => [node.lon, node.lat]);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties: {
        id: `relation-${relation.id}`,
        name: relation.tags?.name || 'Unknown',
        difficulty: relation.tags?.['piste:difficulty'] || 'unknown',
        type: relation.tags?.['piste:type'] || 'unknown',
        grooming: relation.tags?.['piste:grooming'],
        status: relation.tags?.['piste:status'],
        lit: relation.tags?.['piste:lit'] === 'yes'
      }
    });
  });
}

const geojson = {
  type: 'FeatureCollection',
  features
};

console.log(JSON.stringify(geojson, null, 2));
EOF

# Verify file was created
if [ ! -f "$DATA_DIR/pistes-static.geojson" ]; then
  echo "❌ Failed to create pistes-static.geojson"
  exit 1
fi

# Count features
FEATURE_COUNT=$(grep -o '"type": "Feature"' "$DATA_DIR/pistes-static.geojson" | wc -l)

echo "✅ Download complete!"
echo ""
echo "📊 Statistics:"
echo "   Total pistes: $FEATURE_COUNT"
echo "   File: $DATA_DIR/pistes-static.geojson"
echo "   Size: $(du -h "$DATA_DIR/pistes-static.geojson" | cut -f1)"
echo ""
echo "🎿 Data is ready for production deployment!"
