 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/api/env.js b/api/env.js
index 4fffaa17be626c579efb9a94249d674539d25c50..a9983e4a4870d71705d04145dfb82eca5048fb58 100644
--- a/api/env.js
+++ b/api/env.js
@@ -1,6 +1,26 @@
+import fs from 'fs';
+import path from 'path';
+
+let DID_API_KEY = process.env.DID_API_KEY;
+
+// Fallback to api.json if the key wasn't provided via environment variables
+if (!DID_API_KEY) {
+  try {
+    const filePath = path.join(process.cwd(), 'api.json');
+    const data = fs.readFileSync(filePath, 'utf8');
+    const { key } = JSON.parse(data);
+    if (key) {
+      DID_API_KEY = key;
+      process.env.DID_API_KEY = key;
+    }
+  } catch (err) {
+    console.warn('⚠️  Unable to read DID_API_KEY from api.json:', err.message);
+  }
+}
+
 export default function handler(req, res) {
   res.status(200).json({
-    DID_API_KEY: process.env.DID_API_KEY,
+    DID_API_KEY,
     OPENAI_API_KEY: process.env.OPENAI_API_KEY,
   });
 }
 
EOF
)
