 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/loadApiKey.js
index 0000000000000000000000000000000000000000..91902db45df7139a8d2603341f229ff41f8421bd 100644
--- a//dev/null
+++ b/loadApiKey.js
@@ -0,0 +1,24 @@
+const fs = require('fs');
+const path = require('path');
+
+function loadApiKey() {
+  if (process.env.DID_API_KEY) {
+    return process.env.DID_API_KEY;
+  }
+
+  try {
+    const filePath = path.join(__dirname, 'api.json');
+    const data = fs.readFileSync(filePath, 'utf8');
+    const { key } = JSON.parse(data);
+    if (key) {
+      process.env.DID_API_KEY = key;
+      return key;
+    }
+  } catch (err) {
+    console.warn('⚠️  Unable to read DID_API_KEY from api.json:', err.message);
+  }
+
+  return undefined;
+}
+
+module.exports = loadApiKey;
 
EOF
)
